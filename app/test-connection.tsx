import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../src/utils/api';
import BackgroundImage from './components/BackgroundImage';

const TestConnectionScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState('health');

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const url = `${API_BASE_URL}/${endpoint}`;
      console.log('🧪 Testing connection to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const text = await response.text();
      const json = text ? JSON.parse(text) : {};
      
      setResult(`✅ SUCCESS!\n\nStatus: ${response.status}\n\nResponse:\n${JSON.stringify(json, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ FAILED!\n\nError: ${error.message}\n\nURL: ${API_BASE_URL}\n\nTroubleshooting:\n1. Make sure backend is running\n2. Backend must listen on 0.0.0.0\n3. Both devices on same WiFi\n4. Check firewall settings`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <BackgroundImage>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Network Test</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="px-6 pb-8" showsVerticalScrollIndicator={false}>
        {/* Current Configuration */}
        <View className="bg-white/10 rounded-2xl p-6 mb-6 border border-white/20">
          <Text className="text-white text-lg font-semibold mb-4">Current Configuration</Text>
          <View className="mb-3">
            <Text className="text-white/60 text-sm mb-1">API Base URL</Text>
            <Text className="text-white text-base font-mono">{API_BASE_URL}</Text>
          </View>
          <View className="mb-3">
            <Text className="text-white/60 text-sm mb-1">Endpoint</Text>
            <Text className="text-white text-base font-mono">/{endpoint}</Text>
          </View>
          <View>
            <Text className="text-white/60 text-sm mb-1">Full URL</Text>
            <Text className="text-white text-base font-mono">{API_BASE_URL}/{endpoint}</Text>
          </View>
        </View>

        {/* Test Button */}
        <TouchableOpacity
          onPress={testConnection}
          className="bg-blue-600 py-4 rounded-full mb-6 items-center"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-lg font-semibold">Test Connection</Text>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <Text className="text-white text-lg font-semibold mb-4">Result</Text>
            <Text className="text-white text-sm font-mono whitespace-pre-wrap">{result}</Text>
          </View>
        )}

        {/* Instructions */}
        <View className="bg-blue-600/20 rounded-2xl p-6 mt-6 border border-blue-500/30">
          <Text className="text-blue-300 text-lg font-semibold mb-3">📋 Troubleshooting Steps</Text>
          <View className="space-y-2">
            <Text className="text-blue-200 text-sm">1. Restart backend: npm start</Text>
            <Text className="text-blue-200 text-sm">2. Look for: "Backend accessible from network"</Text>
            <Text className="text-blue-200 text-sm">3. Check firewall allows port 3000</Text>
            <Text className="text-blue-200 text-sm">4. Both devices on same WiFi</Text>
            <Text className="text-blue-200 text-sm">5. Try opening: {API_BASE_URL}/{endpoint} in phone browser</Text>
          </View>
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

export default TestConnectionScreen;

