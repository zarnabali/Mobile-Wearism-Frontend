import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { communicationService, EmailCommunication } from '../../services/CommunicationService';

interface EmailInputWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  description?: string;
  autoActions?: boolean; // Show send email button
  recordId?: string; // For tracking communication history
  schemaName?: string; // For audit trail
}

const EmailInputWidget: React.FC<EmailInputWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = 'name@example.com',
  description,
  autoActions = false,
  recordId,
  schemaName,
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<EmailCommunication[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const emailError = value && !isValidEmail(value) ? 'Invalid email format' : error;

  // Load email history when recordId changes
  useEffect(() => {
    if (recordId && autoActions) {
      loadEmailHistory();
    }
  }, [recordId]);

  const loadEmailHistory = async () => {
    if (!recordId) return;
    
    setLoadingHistory(true);
    try {
      const emails = await communicationService.getEmailHistory(recordId);
      setHistory(emails);
    } catch (err) {
      console.error('Failed to load email history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendEmail = async () => {
    if (!value || !emailSubject || !emailBody) {
      Alert.alert('Validation Error', 'Please fill in email, subject, and message');
      return;
    }

    if (!isValidEmail(value)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setSending(true);
    try {
      await communicationService.sendEmail({
        to: value,
        subject: emailSubject,
        body: emailBody,
        entityType: schemaName || 'unknown',
        entityId: recordId || 'unknown',
      });
      
      Alert.alert('Success', '✅ Email sent successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowEmailModal(false);
            setEmailSubject('');
            setEmailBody('');
            // Reload history
            if (recordId) {
              loadEmailHistory();
            }
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (email: EmailCommunication) => {
    setEmailSubject(email.subject);
    setEmailBody(email.body);
    setShowHistoryModal(false);
    setShowEmailModal(true);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const lastEmail = history[0];

  return (
    <>
      <View className="mb-5">
        {label && (
          <View className="mb-2">
            <Text className="text-white text-base font-semibold">
              {label}
              {required && <Text className="text-red-400"> *</Text>}
            </Text>
            {description && (
              <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>
                {description}
              </Text>
            )}
            {lastEmail && (
              <Text className="text-gray-500 text-xs mt-1">
                Last sent: {formatTimestamp(lastEmail.timestamp)} •{' '}
                <Text className={lastEmail.status === 'sent' ? 'text-green-400' : 'text-red-400'}>
                  {lastEmail.status}
                </Text>
              </Text>
            )}
          </View>
        )}
        <View className="flex-row items-center">
          <View className={`flex-1 flex-row items-center bg-gray-800/60 rounded-xl px-4 py-4 border ${
            emailError ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
          }`}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={emailError ? '#EF4444' : isValidEmail(value) ? '#34D399' : '#9CA3AF'} 
            />
            <RNTextInput
              className="flex-1 ml-3 text-white text-base"
              placeholder={placeholder}
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {value && isValidEmail(value) && (
              <Ionicons name="checkmark-circle" size={20} color="#34D399" />
            )}
          </View>
          
          {autoActions && value && isValidEmail(value) && (
            <View className="flex-row ml-2">
              <TouchableOpacity
                onPress={() => setShowEmailModal(true)}
                className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              {history.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowHistoryModal(true)}
                  className="w-12 h-12 bg-gray-700/50 rounded-xl items-center justify-center ml-2 border border-gray-600/50"
                  activeOpacity={0.7}
                >
                  <View>
                    <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">{history.length}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {emailError && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text className="text-red-400 text-xs ml-1">{emailError}</Text>
          </View>
        )}
      </View>

      {/* Send Email Modal */}
      <Modal
        visible={showEmailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => setShowEmailModal(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Send Email</Text>
            <TouchableOpacity 
              onPress={handleSendEmail}
              disabled={sending || !emailSubject || !emailBody}
              className={`px-6 py-3 rounded-xl ${
                sending || !emailSubject || !emailBody ? 'bg-gray-700' : 'bg-blue-600'
              }`}
            >
              {sending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Send</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            {/* To Field */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">To</Text>
              <View className="bg-gray-800/60 rounded-xl px-4 py-4 flex-row items-center border border-gray-700/50">
                <Ionicons name="person-outline" size={20} color="#60A5FA" />
                <Text className="text-white text-base ml-3">{value}</Text>
              </View>
            </View>

            {/* Subject */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">Subject *</Text>
              <RNTextInput
                className="bg-gray-800/60 rounded-xl px-4 py-4 text-white text-base border border-gray-700/50"
                placeholder="Email subject"
                placeholderTextColor="rgba(156, 163, 175, 0.6)"
                value={emailSubject}
                onChangeText={setEmailSubject}
              />
            </View>

            {/* Body */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">Message *</Text>
              <RNTextInput
                className="bg-gray-800/60 rounded-xl px-4 py-4 text-white text-base border border-gray-700/50"
                placeholder="Write your message here..."
                placeholderTextColor="rgba(156, 163, 175, 0.6)"
                value={emailBody}
                onChangeText={setEmailBody}
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                style={{ minHeight: 200 }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Email History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => setShowHistoryModal(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Email History</Text>
            <TouchableOpacity 
              onPress={loadEmailHistory}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              {loadingHistory ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="refresh" size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            {history.length > 0 ? (
              history.map((email, index) => (
                <View
                  key={email.id || index}
                  className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-1" numberOfLines={1}>
                        {email.subject}
                      </Text>
                      <Text className="text-gray-400 text-sm">{formatTimestamp(email.timestamp)}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${
                      email.status === 'sent' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      <Text className={`text-xs font-semibold ${
                        email.status === 'sent' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {email.status}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-gray-300 text-sm mb-3" numberOfLines={3}>
                    {email.body}
                  </Text>
                  
                  {email.error && (
                    <View className="bg-red-900/20 rounded-lg p-3 mb-3">
                      <Text className="text-red-400 text-xs">{email.error}</Text>
                    </View>
                  )}
                  
                  {email.status === 'failed' && (
                    <TouchableOpacity
                      onPress={() => handleRetry(email)}
                      className="bg-blue-600 rounded-lg py-3 items-center"
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View className="py-12 items-center">
                <Ionicons name="mail-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">No email history</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Emails sent to this address will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default EmailInputWidget;
