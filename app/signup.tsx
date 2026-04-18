import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from './components/BackgroundImage';
import { useRouter } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { COLORS, FONTS } from '../src/constants/theme';
import { useAuthStore } from '../src/stores/authStore';
import * as WebBrowser from 'expo-web-browser';

const SignupScreen = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { signup } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleSignup = async () => {
    setError(null);
    const { firstName, lastName, email, password, confirmPassword } = formData;
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!gdprConsent) {
      setError('You must accept the privacy policy.');
      return;
    }
    
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await signup(email, password, fullName);
      router.replace('/login');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Signup failed. Please try again.');
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
              <Image
                source={require('../assets/logo/wearism-w.png')}
                style={{ width: 90, height: 30 }}
                resizeMode="contain"
              />
            </View>

            {/* Main Content */}
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              <View className="flex-1 py-8">
                {/* Signup Form Container */}
                <View className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
                  <Text
                    className="text-white text-3xl font-h-bold mb-2 text-center"
                  >
                    Create Account
                  </Text>
                  <Text
                    className="text-white/80 text-base mb-8 text-center font-h-light"
                  >
                    Start your fashion journey with us
                  </Text>

                  {/* First Name Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-h-light mb-2"
                    >
                      First Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                      <TextInput
                        className="flex-1 ml-3 text-white text-[16px] font-h-light"
                        placeholder="Enter your first name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.firstName}
                        onChangeText={(value: string) => handleInputChange('firstName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={{ paddingVertical: 0, color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Last Name Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-h-light mb-2"
                    >
                      Last Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                      <TextInput
                        className="flex-1 ml-3 text-white text-[16px] font-h-light"
                        placeholder="Enter your last name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.lastName}
                        onChangeText={(value: string) => handleInputChange('lastName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={{ paddingVertical: 0, color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-h-light mb-2"
                    >
                      Email Address
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                      <TextInput
                        className="flex-1 ml-3 text-white text-[16px] font-h-light"
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.email}
                        onChangeText={(value: string) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ paddingVertical: 0, color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-h-light mb-2"
                    >
                      Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
                      <TextInput
                        className="flex-1 ml-3 text-white text-[16px] font-h-light"
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.password}
                        onChangeText={(value: string) => handleInputChange('password', value)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ paddingVertical: 0, color: '#ffffff' }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="ml-2"
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View className="mb-8">
                    <Text
                      className="text-white text-sm font-h-light mb-2"
                    >
                      Confirm Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
                      <TextInput
                        className="flex-1 ml-3 text-white text-[16px] font-h-light"
                        placeholder="Confirm your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.confirmPassword}
                        onChangeText={(value: string) => handleInputChange('confirmPassword', value)}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ paddingVertical: 0, color: '#ffffff' }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="ml-2"
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {error ? (
                    <Text
                      className="text-orange-400 text-center mb-3 font-h-light"
                    >
                      {error}
                    </Text>
                  ) : null}

                  {/* Signup Button */}
                  <TouchableOpacity
                    className="py-4 rounded-full mb-4 bg-primary"
                    onPress={handleSignup}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        className="text-white text-center text-lg font-h-heavy"
                      >
                        Create Account
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* GDPR Consent Checkbox */}
                  <TouchableOpacity
                    onPress={() => setGdprConsent(!gdprConsent)}
                    className="flex-row items-start mb-6"
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: gdprConsent ? COLORS.primary : 'rgba(255,255,255,0.3)',
                        backgroundColor: gdprConsent ? COLORS.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                        marginRight: 10,
                        flexShrink: 0,
                      }}
                    >
                      {gdprConsent && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text className="flex-1 text-white/60 text-xs leading-relaxed font-h-light">
                      I agree to the{' '}
                      <Text
                        className="text-primary font-h-light"
                        onPress={() => WebBrowser.openBrowserAsync('https://wearism.ai/privacy')}
                      >
                        Privacy Policy
                      </Text>
                      {' '}and consent to Wearism collecting and processing my personal data (name, email, body measurements) in accordance with GDPR.
                    </Text>
                  </TouchableOpacity>

                  {/* Login Link */}
                  <View className="flex-row justify-center items-center">
                    <Text
                      className="text-white/80 text-sm font-h-light"
                    >
                      Already have an account?{' '}
                    </Text>
                    <Link href="/login" asChild>
                      <TouchableOpacity>
                        <Text
                          className="text-primary text-sm font-h-heavy"
                        >
                          Login
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
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
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
};

export default SignupScreen;
