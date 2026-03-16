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
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BackgroundImage from './components/BackgroundImage';
import { useRouter } from 'expo-router';

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

  const handleSignup = () => {
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
    
    // UI only - no backend call; go to home/feed
    router.replace('/home');
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

            {/* Main Content */}
            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
              <View className="flex-1 py-8">
                {/* Signup Form Container */}
                <View className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-orange-500/30">
                  <Text
                    className="text-white text-3xl font-bold mb-2 text-center"
                    style={{ fontFamily: 'HelveticaNeue-Bold' }}
                  >
                    Create Account
                  </Text>
                  <Text
                    className="text-white/80 text-base mb-8 text-center"
                    style={{ fontFamily: 'HelveticaNeue' }}
                  >
                    Start your fashion journey with us
                  </Text>

                  {/* First Name Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-medium mb-2"
                      style={{ fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      First Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="person-outline" size={20} color="#FF6B35" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your first name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.firstName}
                        onChangeText={(value: string) => handleInputChange('firstName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={{ fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Last Name Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-medium mb-2"
                      style={{ fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      Last Name
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="person-outline" size={20} color="#FF6B35" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your last name"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.lastName}
                        onChangeText={(value: string) => handleInputChange('lastName', value)}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={{ fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Email Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-medium mb-2"
                      style={{ fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      Email Address
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="mail-outline" size={20} color="#FF6B35" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your email"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.email}
                        onChangeText={(value: string) => handleInputChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View className="mb-4">
                    <Text
                      className="text-white text-sm font-medium mb-2"
                      style={{ fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Enter your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.password}
                        onChangeText={(value: string) => handleInputChange('password', value)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ fontFamily: 'HelveticaNeue', color: '#ffffff' }}
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

                  {/* Confirm Password Input */}
                  <View className="mb-8">
                    <Text
                      className="text-white text-sm font-medium mb-2"
                      style={{ fontFamily: 'HelveticaNeue-Medium' }}
                    >
                      Confirm Password
                    </Text>
                    <View className="bg-white/10 rounded-xl px-4 py-4 flex-row items-center border border-white/20">
                      <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
                      <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Confirm your password"
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={formData.confirmPassword}
                        onChangeText={(value: string) => handleInputChange('confirmPassword', value)}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={{ fontFamily: 'HelveticaNeue', color: '#ffffff' }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="ml-2"
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
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

                  {/* Signup Button */}
                  <TouchableOpacity
                    className="py-4 rounded-full mb-4"
                    onPress={handleSignup}
                    activeOpacity={0.8}
                    style={{ backgroundColor: '#FF6B35' }}
                  >
                    <Text
                      className="text-white text-center text-lg font-semibold"
                      style={{ fontFamily: 'HelveticaNeue-Heavy' }}
                    >
                      Create Account
                    </Text>
                  </TouchableOpacity>

                  {/* Terms and Conditions */}
                  <Text
                    className="text-white/60 text-xs text-center mb-6 leading-relaxed"
                    style={{ fontFamily: 'HelveticaNeue' }}
                  >
                    By creating an account, you agree to our{' '}
                    <Text
                      className="text-orange-400"
                      style={{ fontFamily: 'HelveticaNeue', color: '#FF6B35' }}
                    >
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text
                      className="text-orange-400"
                      style={{ fontFamily: 'HelveticaNeue', color: '#FF6B35' }}
                    >
                      Privacy Policy
                    </Text>
                  </Text>

                  {/* Login Link */}
                  <View className="flex-row justify-center items-center">
                    <Text
                      className="text-white/80 text-sm"
                      style={{ fontFamily: 'HelveticaNeue' }}
                    >
                      Already have an account?{' '}
                    </Text>
                    <Link href="/login" asChild>
                      <TouchableOpacity>
                        <Text
                          className="text-orange-400 text-sm font-semibold"
                          style={{ fontFamily: 'HelveticaNeue-Heavy', color: '#FF6B35' }}
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
