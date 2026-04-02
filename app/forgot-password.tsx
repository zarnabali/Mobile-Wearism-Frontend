import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundImage from './components/BackgroundImage';
import { apiClient } from '../src/lib/apiClient';

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Intentionally swallow errors — never reveal whether email exists (security)
    } finally {
      setLoading(false);
      setSubmitted(true); // Always show success message
    }
  };

  return (
    <BackgroundImage>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1">
            {/* Header */}
            <View className="px-6 pt-8">
              <Text
                className="text-white text-2xl font-bold"
                style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}
              >
                Wearism
              </Text>
            </View>

            {/* Spacer */}
            <View className="flex-1" />

            {/* Main Content */}
            <View className="px-6 pb-8">
              <View className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">

                {/* Icon */}
                <View className="items-center mb-6">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,107,53,0.15)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)' }}
                  >
                    <Ionicons name="lock-open-outline" size={30} color="#FF6B35" />
                  </View>
                </View>

                <Text
                  className="text-white text-3xl font-bold mb-2 text-center"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}
                >
                  Forgot Password?
                </Text>
                <Text
                  className="text-white/60 text-sm mb-8 text-center leading-relaxed"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                >
                  Enter your email address and we'll send you a reset link.
                </Text>

                {submitted ? (
                  /* ── Success state — always shown regardless of email existence ── */
                  <View className="bg-white/10 rounded-xl p-5 border border-white/20 items-center">
                    <Ionicons name="checkmark-circle-outline" size={36} color="#FF6B35" />
                    <Text
                      className="text-white text-base text-center mt-3 leading-relaxed"
                      style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      If that email exists, a reset link has been sent.
                    </Text>
                    <Text
                      className="text-white/50 text-xs text-center mt-2"
                      style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                    >
                      Check your spam folder if you don't see it.
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Email Input */}
                    <View className="mb-6">
                      <Text
                        className="text-white text-sm font-medium mb-2"
                        style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}
                      >
                        Email Address
                      </Text>
                      <View className="bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
                        <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                        <TextInput
                          className="flex-1 ml-3 text-white text-[16px]"
                          placeholder="Enter your email"
                          placeholderTextColor="rgba(255,255,255,0.6)"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                        />
                      </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                      className="h-14 rounded-full"
                      onPress={handleSubmit}
                      activeOpacity={0.8}
                      disabled={loading || !email}
                      style={{
                        backgroundColor: '#FF6B35',
                        opacity: loading || !email ? 0.7 : 1,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text
                          className="text-white text-center text-lg"
                          style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Heavy' }}
                        >
                          SEND RESET LINK
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Back to Login */}
              <TouchableOpacity
                className="mt-6 h-14"
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text
                  className="text-white/70 text-center text-sm"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                >
                  ← Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
};

export default ForgotPasswordScreen;
