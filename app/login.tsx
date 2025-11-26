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
import { Link, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthApi } from '../src/utils/api';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from './components/BackgroundImage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'regular' | 'superadmin'>('regular');
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    // Super Admin login uses separate endpoint
    if (loginMode === 'superadmin') {
      setLoading(true);
      try {
        const res = await AuthApi.loginSuperAdmin(email, password);
        const token = res.data.token;
        const user = res.data.user;
        await SecureStore.setItemAsync('auth_token', token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
        await SecureStore.setItemAsync('auth_user', JSON.stringify(user), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
        await SecureStore.setItemAsync('login_mode', loginMode, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
        router.push('/menu');
      } catch (e: any) {
        setError(e?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Regular user login requires tenantId
    if (!tenantId) {
      setError('Tenant ID is required for regular users');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthApi.login(email, password, tenantId);
      const token = res.data.token;
      const user = res.data.user;
      await SecureStore.setItemAsync('auth_token', token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
      await SecureStore.setItemAsync('login_mode', loginMode, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
      router.push('/menu');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
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
              <Text className="text-white text-2xl font-bold">
                Toolivo
              </Text>
            </View>

            {/* Spacer to push content to bottom */}
            <View className="flex-1" />

            {/* Main Content */}
            <View className="px-6 pb-8">
              {/* Login Mode Toggle */}
              <View className="mb-6">
                <View className="bg-white/10 rounded-xl p-1 flex-row">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg ${loginMode === 'regular' ? 'bg-blue-600' : ''}`}
                    onPress={() => setLoginMode('regular')}
                  >
                    <Text className={`text-center font-medium ${loginMode === 'regular' ? 'text-white' : 'text-white/80'}`}>
                      Regular User
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg ${loginMode === 'superadmin' ? 'bg-blue-600' : ''}`}
                    onPress={() => setLoginMode('superadmin')}
                  >
                    <Text className={`text-center font-medium ${loginMode === 'superadmin' ? 'text-white' : 'text-white/80'}`}>
                      Super Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Form Container with Opacity */}
              <View className="bg-black/30 backdrop-blur-sm rounded-2xl p-8">
                <Text className="text-white text-3xl font-bold mb-2 text-center">
                  Welcome Back
                </Text>
                <Text className="text-white/80 text-base mb-8 text-center">
                  Sign in to continue your craftsman journey
                </Text>

                {/* Email Input */}
                <View className="mb-6">
                  <Text className="text-white text-sm font-medium mb-2">
                    Email Address
                  </Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                    <Ionicons name="mail-outline" size={20} color="white" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter your email"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Tenant ID (only for regular users) */}
                {loginMode === 'regular' && (
                  <View className="mb-6">
                    <Text className="text-white text-sm font-medium mb-2">
                      Tenant ID
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="business-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter tenant id (e.g. test-tenant)"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={tenantId}
                        onChangeText={setTenantId}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {/* Password Input */}
                <View className="mb-8">
                  <Text className="text-white text-sm font-medium mb-2">
                    Password
                  </Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="white" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter your password"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="ml-2"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <Text className="text-red-400 text-center mb-3">{error}</Text>
                ) : null}

                {/* Login Button */}
                <TouchableOpacity
                  className="bg-blue-700 py-4 rounded-full mb-4"
                  onPress={handleLogin}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-center text-lg font-semibold">
                    {loading ? 'Signing in...' : 'Login'}
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity className="mb-6">
                  <Text className="text-white/80 text-center text-sm">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Sign Up Link */}
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/80 text-sm">
                    Don't have an account?{' '}
                  </Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity>
                      <Text className="text-blue-300 text-sm font-semibold">
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>

              {/* Back to Splash */}
              <View className="mt-6">
                <Link href="/splash" asChild>
                  <TouchableOpacity className="py-4">
                    <Text className="text-white/80 text-center text-sm">
                      ← Back to Home
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Debug: Test Connection */}
              <View className="mt-4">
                <Link href="/test-connection" asChild>
                  <TouchableOpacity className="py-2">
                    <Text className="text-white/60 text-center text-xs">
                      🧪 Test Network Connection
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
