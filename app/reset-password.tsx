import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../src/lib/apiClient';
import BackgroundImage from './components/BackgroundImage';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Calls backend `POST /auth/update-password` with standard session
      await apiClient.post('/auth/update-password', { password });
      Alert.alert("Success", "Your password has been reset successfully.", [
        { text: "OK", onPress: () => router.replace('/home') }
      ]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundImage>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 px-6 justify-center">
            <View className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
              <Text
                className="text-white text-3xl font-bold mb-2 text-center"
                style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}
              >
                Reset Password
              </Text>
              <Text
                className="text-white/80 text-base mb-8 text-center"
                style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
              >
                Enter your new password below.
              </Text>

              {/* Password Input */}
              <View className="mb-4">
                <Text
                  className="text-white text-sm font-medium mb-2"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}
                >
                  New Password
                </Text>
                <View className="bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-[16px]"
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View className="mb-8">
                <Text
                  className="text-white text-sm font-medium mb-2"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}
                >
                  Confirm Password
                </Text>
                <View className="bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
                  <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-[16px]"
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                  />
                </View>
              </View>

              {error ? (
                <Text className="text-orange-400 text-center mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                  {error}
                </Text>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                className="h-14 rounded-full"
                onPress={handleReset}
                activeOpacity={0.8}
                disabled={loading}
                style={{ backgroundColor: '#FF6B35', opacity: loading ? 0.8 : 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center text-lg font-semibold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Heavy' }}>
                    UPDATE PASSWORD
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
}
