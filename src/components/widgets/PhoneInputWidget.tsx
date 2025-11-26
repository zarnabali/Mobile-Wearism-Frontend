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
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { communicationService, CallCommunication } from '../../services/CommunicationService';

interface PhoneInputWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  description?: string;
  autoActions?: boolean; // Show call/SMS/WhatsApp buttons
  recordId?: string; // For tracking communication history
  schemaName?: string; // For audit trail
}

const PhoneInputWidget: React.FC<PhoneInputWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = '+1 (555) 000-0000',
  description,
  autoActions = false,
  recordId,
  schemaName,
}) => {
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'call' | 'sms'>('call');
  const [callDuration, setCallDuration] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<CallCommunication[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate phone format (basic validation)
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\(\)\-\+]+$/;
    return phone.length >= 10 && phoneRegex.test(phone);
  };

  const phoneError = value && !isValidPhone(value) ? 'Invalid phone format' : error;

  // Load call history when recordId changes
  useEffect(() => {
    if (recordId && autoActions) {
      loadCallHistory();
    }
  }, [recordId]);

  const loadCallHistory = async () => {
    if (!recordId) return;
    
    setLoadingHistory(true);
    try {
      const calls = await communicationService.getCallHistory(recordId);
      setHistory(calls);
    } catch (err) {
      console.error('Failed to load call history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCall = async () => {
    if (!isValidPhone(value)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      const phoneUrl = `tel:${value.replace(/[^\d+]/g, '')}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
        // Show call log modal after call
        setTimeout(() => {
          setShowCallLogModal(true);
        }, 1000);
      } else {
        Alert.alert('Error', 'Cannot make phone calls on this device');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to initiate call');
    }
  };

  const handleSMS = async () => {
    if (!isValidPhone(value)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      const smsUrl = Platform.OS === 'ios' 
        ? `sms:${value.replace(/[^\d+]/g, '')}`
        : `sms:${value.replace(/[^\d+]/g, '')}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Cannot send SMS on this device');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open SMS');
    }
  };

  const handleWhatsApp = async () => {
    if (!isValidPhone(value)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      const cleanPhone = value.replace(/[^\d]/g, '');
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp Not Installed', 'Please install WhatsApp to use this feature');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleSaveCallLog = async () => {
    if (!callDuration) {
      Alert.alert('Validation Error', 'Please enter call duration');
      return;
    }

    setSaving(true);
    try {
      const duration = parseInt(callDuration) * 60; // Convert minutes to seconds
      
      await communicationService.logCall({
        phone: value,
        duration,
        notes: callNotes,
        entityType: schemaName || 'unknown',
        entityId: recordId || 'unknown',
      });
      
      Alert.alert('Success', '✅ Call logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setShowCallLogModal(false);
            setCallDuration('');
            setCallNotes('');
            // Reload history
            if (recordId) {
              loadCallHistory();
            }
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log call');
    } finally {
      setSaving(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const callHistory = history.filter(h => h.type === 'call');
  const smsHistory = history.filter(h => h.type === 'sms');
  const lastCall = callHistory[0];

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
            {lastCall && (
              <Text className="text-gray-500 text-xs mt-1">
                Last call: {formatTimestamp(lastCall.timestamp)} • {formatDuration(lastCall.duration)}
              </Text>
            )}
          </View>
        )}
        <View className="flex-row items-center">
          <View className={`flex-1 flex-row items-center bg-gray-800/60 rounded-xl px-4 py-4 border ${
            phoneError ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
          }`}>
            <Ionicons 
              name="call-outline" 
              size={20} 
              color={phoneError ? '#EF4444' : isValidPhone(value) ? '#34D399' : '#9CA3AF'} 
            />
            <RNTextInput
              className="flex-1 ml-3 text-white text-base"
              placeholder={placeholder}
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType="phone-pad"
            />
            {value && isValidPhone(value) && (
              <Ionicons name="checkmark-circle" size={20} color="#34D399" />
            )}
          </View>
          
          {autoActions && value && isValidPhone(value) && (
            <View className="flex-row ml-2">
              <TouchableOpacity
                onPress={handleCall}
                className="w-12 h-12 bg-green-600 rounded-xl items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSMS}
                className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center ml-2"
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble" size={20} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleWhatsApp}
                className="w-12 h-12 bg-emerald-600 rounded-xl items-center justify-center ml-2"
                activeOpacity={0.7}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
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
        {phoneError && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text className="text-red-400 text-xs ml-1">{phoneError}</Text>
          </View>
        )}
      </View>

      {/* Call Log Modal */}
      <Modal
        visible={showCallLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCallLogModal(false)}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => setShowCallLogModal(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Log Call</Text>
            <TouchableOpacity 
              onPress={handleSaveCallLog}
              disabled={saving || !callDuration}
              className={`px-6 py-3 rounded-xl ${
                saving || !callDuration ? 'bg-gray-700' : 'bg-green-600'
              }`}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            {/* Phone Field */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">Phone Number</Text>
              <View className="bg-gray-800/60 rounded-xl px-4 py-4 flex-row items-center border border-gray-700/50">
                <Ionicons name="call-outline" size={20} color="#34D399" />
                <Text className="text-white text-base ml-3">{value}</Text>
              </View>
            </View>

            {/* Duration */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">Call Duration (minutes) *</Text>
              <RNTextInput
                className="bg-gray-800/60 rounded-xl px-4 py-4 text-white text-base border border-gray-700/50"
                placeholder="Enter duration in minutes"
                placeholderTextColor="rgba(156, 163, 175, 0.6)"
                value={callDuration}
                onChangeText={setCallDuration}
                keyboardType="number-pad"
              />
            </View>

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-gray-400 text-sm font-medium mb-2">Call Notes</Text>
              <RNTextInput
                className="bg-gray-800/60 rounded-xl px-4 py-4 text-white text-base border border-gray-700/50"
                placeholder="Add notes about the call..."
                placeholderTextColor="rgba(156, 163, 175, 0.6)"
                value={callNotes}
                onChangeText={setCallNotes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={{ minHeight: 120 }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Call History Modal */}
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
            <Text className="text-white text-xl font-bold">Communication History</Text>
            <TouchableOpacity 
              onPress={loadCallHistory}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              {loadingHistory ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="refresh" size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="px-6 py-4 flex-row border-b border-gray-800">
            <TouchableOpacity
              onPress={() => setActiveHistoryTab('call')}
              className={`flex-1 py-3 rounded-xl mr-2 ${
                activeHistoryTab === 'call' ? 'bg-green-600/20 border-2 border-green-500/50' : 'bg-gray-800'
              }`}
            >
              <View className="items-center">
                <Ionicons name="call" size={20} color={activeHistoryTab === 'call' ? '#34D399' : '#9CA3AF'} />
                <Text className={`text-sm font-semibold mt-1 ${
                  activeHistoryTab === 'call' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  Calls ({callHistory.length})
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveHistoryTab('sms')}
              className={`flex-1 py-3 rounded-xl ml-2 ${
                activeHistoryTab === 'sms' ? 'bg-blue-600/20 border-2 border-blue-500/50' : 'bg-gray-800'
              }`}
            >
              <View className="items-center">
                <Ionicons name="chatbubble" size={20} color={activeHistoryTab === 'sms' ? '#60A5FA' : '#9CA3AF'} />
                <Text className={`text-sm font-semibold mt-1 ${
                  activeHistoryTab === 'sms' ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  SMS ({smsHistory.length})
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            {activeHistoryTab === 'call' && (
              callHistory.length > 0 ? (
                callHistory.map((call, index) => (
                  <View
                    key={call.id || index}
                    className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="call" size={16} color="#34D399" />
                          <Text className="text-white font-semibold text-base ml-2">
                            {formatDuration(call.duration)}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-sm">{formatTimestamp(call.timestamp)}</Text>
                      </View>
                    </View>
                    
                    {call.notes && (
                      <Text className="text-gray-300 text-sm mt-2" numberOfLines={3}>
                        {call.notes}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View className="py-12 items-center">
                  <Ionicons name="call-outline" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-lg font-medium mt-4">No call history</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Calls to this number will appear here
                  </Text>
                </View>
              )
            )}
            
            {activeHistoryTab === 'sms' && (
              smsHistory.length > 0 ? (
                smsHistory.map((sms, index) => (
                  <View
                    key={sms.id || index}
                    className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50"
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="chatbubble" size={16} color="#60A5FA" />
                          <Text className="text-white font-semibold text-base ml-2">SMS</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">{formatTimestamp(sms.timestamp)}</Text>
                      </View>
                    </View>
                    
                    {sms.notes && (
                      <Text className="text-gray-300 text-sm mt-2" numberOfLines={3}>
                        {sms.notes}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <View className="py-12 items-center">
                  <Ionicons name="chatbubble-outline" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-lg font-medium mt-4">No SMS history</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    SMS to this number will appear here
                  </Text>
                </View>
              )
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default PhoneInputWidget;
