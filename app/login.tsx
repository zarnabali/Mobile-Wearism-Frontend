import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from './components/BackgroundImage';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { ActivityIndicator } from 'react-native';

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      await useAuthStore.getState().login(email, password);
      router.replace('/home');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
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
                style={{ fontFamily: 'HelveticaNeue-Bold' }}
              >
                Wearism
              </Text>
            </View>

            {/* Spacer to push content to bottom */}
            <View className="flex-1" />

            {/* Main Content */}
            <View className="px-6 pb-8">
              {/* Login Form Container */}
              <View className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
                <Text
                  className="text-white text-3xl font-bold mb-2 text-center"
                  style={{ fontFamily: 'HelveticaNeue-Bold' }}
                >
                  Welcome Back
                </Text>
                <Text
                  className="text-white/80 text-base mb-8 text-center"
                  style={{ fontFamily: 'HelveticaNeue' }}
                >
                  Sign in to continue your fashion journey
                </Text>

                {/* Email Input */}
                <View className="mb-6">
                  <Text
                    className="text-white text-sm font-medium mb-2"
                    style={{ fontFamily: 'HelveticaNeue-Medium' }}
                  >
                    Email Address
                  </Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
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
                      style={{ paddingVertical: 0, fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-8">
                  <Text
                    className="text-white text-sm font-medium mb-2"
                    style={{ fontFamily: 'HelveticaNeue-Medium' }}
                  >
                    Password
                  </Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                    <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-[16px]"
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={{ paddingVertical: 0, fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#FF6B35"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <Text
                    className="text-orange-400 text-center mb-3"
                    style={{ fontFamily: 'HelveticaNeue' }}
                  >
                    {error}
                  </Text>
                ) : null}

                {/* Login Button */}
                <TouchableOpacity
                  className="py-4 rounded-full mb-4"
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-center text-lg font-semibold" style={{ fontFamily: 'HelveticaNeue-Heavy' }}>Login</Text>}
                </TouchableOpacity>

                {/* Forgot Password */}
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity className="mb-6">
                    <Text
                      className="text-orange-400 text-center text-sm"
                      style={{ fontFamily: 'HelveticaNeue', color: '#FF6B35' }}
                    >
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </Link>

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center">
                  <Text
                    className="text-white/80 text-sm"
                    style={{ fontFamily: 'HelveticaNeue' }}
                  >
                    Don't have an account?{' '}
                  </Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity>
                      <Text
                        className="text-orange-400 text-sm font-semibold"
                        style={{ fontFamily: 'HelveticaNeue-Heavy', color: '#FF6B35' }}
                      >
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>

              {/* Back to Splash */}
              <View className="mt-6">
                <Link href="/" asChild>
                  <TouchableOpacity className="py-4">
                    <Text
                      className="text-white/80 text-center text-sm"
                      style={{ fontFamily: 'HelveticaNeue' }}
                    >
                      ← Back to Home
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
};

export default LoginScreen;
