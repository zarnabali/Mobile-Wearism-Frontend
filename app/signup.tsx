import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from './components/BackgroundImage';
import * as SecureStore from 'expo-secure-store';
import { AuthApi } from '../src/utils/api';

const SignupScreen = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    tenantId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'technician' | 'office'>('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignup = async () => {
    setError(null);
    const { firstName, lastName, email, password, confirmPassword, username, tenantId } = formData;
    if (!firstName || !lastName || !email || !password || !confirmPassword || !username || !tenantId) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (role === 'office') {
      // Backend requires admin to create office users
      setError('Office users must be created by a tenant admin. Please select customer or technician.');
      return;
    }
    setLoading(true);
    try {
      const res = await AuthApi.register({
        username,
        email,
        password,
        firstName,
        lastName,
        role,
        tenantId,
      });
      const token = res.data.token;
      const user = res.data.user;
      await SecureStore.setItemAsync('auth_token', token, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
      await SecureStore.setItemAsync('auth_user', JSON.stringify(user), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
      router.push('/menu');
    } catch (e: any) {
      setError(e?.message || 'Signup failed');
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

            {/* Main Content */}
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              <View className="flex-1 py-8">
                {/* Signup Form Container with Opacity */}
                <View className="bg-black/30 backdrop-blur-sm rounded-2xl p-8">
                <Text className="text-white text-3xl font-bold mb-2 text-center">
                    Create Account
                  </Text>
                  <Text className="text-white/80 text-base mb-8 text-center">
                    Start your building your schemas with us
                  </Text>

                {/* Role Selector */}
                <View className="mb-4">
                  <Text className="text-white text-sm font-medium mb-2">Register As</Text>
                  <View className="flex-row gap-2">
                    {(['customer','technician','office'] as const).map(r => (
                      <TouchableOpacity
                        key={r}
                        className={`px-4 py-2 rounded-full ${role===r ? 'bg-blue-700' : 'bg-white/10'}`}
                        onPress={() => setRole(r)}
                        activeOpacity={0.8}
                      >
                        <Text className="text-white text-sm capitalize">{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                  {/* First Name Input */}
                  <View className="mb-4">
                    <Text className="text-white text-sm font-medium mb-2">
                      First Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="person-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your first name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.firstName}
                        onChangeText={(value) => handleInputChange('firstName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                  {/* Last Name Input */}
                  <View className="mb-4">
                    <Text className="text-white text-sm font-medium mb-2">
                      Last Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="person-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your last name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.lastName}
                        onChangeText={(value) => handleInputChange('lastName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                {/* Username Input */}
                <View className="mb-4">
                  <Text className="text-white text-sm font-medium mb-2">Username</Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                    <Ionicons name="person-circle-outline" size={20} color="white" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Choose a username"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.username}
                      onChangeText={(value) => handleInputChange('username', value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                  {/* Email Input */}
                  <View className="mb-4">
                    <Text className="text-white text-sm font-medium mb-2">
                      Email Address
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="mail-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.email}
                        onChangeText={(value) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>

                {/* Tenant ID */}
                <View className="mb-4">
                  <Text className="text-white text-sm font-medium mb-2">Tenant ID</Text>
                  <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                    <Ionicons name="business-outline" size={20} color="white" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-base"
                      placeholder="Enter tenant id (e.g. test-tenant)"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={formData.tenantId}
                      onChangeText={(value) => handleInputChange('tenantId', value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                  {/* Password Input */}
                  <View className="mb-4">
                    <Text className="text-white text-sm font-medium mb-2">
                      Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="lock-closed-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.password}
                        onChangeText={(value) => handleInputChange('password', value)}
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

                  {/* Confirm Password Input */}
                  <View className="mb-8">
                    <Text className="text-white text-sm font-medium mb-2">
                      Confirm Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center">
                      <Ionicons name="lock-closed-outline" size={20} color="white" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Confirm your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="ml-2"
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                {error ? (
                  <Text className="text-red-400 text-center mb-3">{error}</Text>
                ) : null}

                {/* Signup Button */}
                  <TouchableOpacity
                    className="bg-blue-700 py-4 rounded-full mb-4"
                    onPress={handleSignup}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-center text-lg font-semibold">
                      {loading ? 'Creating...' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>

                  {/* Terms and Conditions */}
                  <Text className="text-white/60 text-xs text-center mb-6 leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <Text className="text-blue-300">Terms of Service</Text>
                    {' '}and{' '}
                    <Text className="text-blue-300">Privacy Policy</Text>
                  </Text>

                  {/* Login Link */}
                  <View className="flex-row justify-center items-center">
                    <Text className="text-white/80 text-sm">
                      Already have an account?{' '}
                    </Text>
                    <Link href="/login" asChild>
                      <TouchableOpacity>
                        <Text className="text-blue-300 text-sm font-semibold">
                          Login
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
};

export default SignupScreen;
