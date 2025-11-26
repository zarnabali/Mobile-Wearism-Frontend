import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EnhancedDynamicViewRenderer } from '../src/components/DynamicViewRenderer/EnhancedDynamicViewRenderer';
import * as SecureStore from 'expo-secure-store';

const DynamicViewScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const viewId = params.viewId as string;

  const [viewJson, setViewJson] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchView();
  }, []);

  const fetchUserRole = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!viewId) {
        setError('No view ID provided');
        setLoading(false);
        return;
      }

      // Fetch from ViewApi
      const { ViewApi } = await import('../src/utils/api');
      const response = await ViewApi.getView(viewId);
      
      if (response.success && response.data) {
        setViewJson(response.data);
      } else {
        setError('View not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch view:', err);
      // Fallback to mock data if backend not available
      const mockView = {
        id: 'customer_form_v1',
        title: 'Customer Information Form',
        layout: 'column',
        roleVisibility: ['office', 'admin'],
        widgets: [
          {
            key: 'firstName',
            type: 'TextInput',
            label: 'First Name',
            required: true,
            order: 1,
          },
          {
            key: 'lastName',
            type: 'TextInput',
            label: 'Last Name',
            required: true,
            order: 2,
          },
          {
            key: 'email',
            type: 'EmailInput',
            label: 'Email Address',
            required: true,
            placeholder: 'john@example.com',
            order: 3,
            autoActions: { email: true },
          },
          {
            key: 'phone',
            type: 'PhoneInput',
            label: 'Phone Number',
            required: false,
            placeholder: '+1 234 567 8900',
            order: 4,
            autoActions: { call: true },
          },
          {
            key: 'address',
            type: 'AddressInput',
            label: 'Address',
            required: false,
            placeholder: '123 Main St, City, State, ZIP',
            order: 5,
            autoActions: { map: true },
          },
          {
            key: 'submit',
            type: 'Button',
            label: 'Submit',
            order: 99,
          },
        ],
        options: {
          showFieldHints: true,
        },
        defaultEndpoint: '/api/data/customer',
      };

      setViewJson(mockView);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (data: Record<string, any>) => {
    Alert.alert('Form Submitted', `Submitted data: ${JSON.stringify(data, null, 2)}`);
    console.log('Form data:', data);
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/background/img5.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }} className="items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-white mt-4">Loading view...</Text>
        </View>
      </ImageBackground>
    );
  }

  if (error || !viewJson) {
    return (
      <ImageBackground
        source={require('../assets/background/img5.jpg')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Error</Text>
            <View style={{ width: 40 }} />
          </View>
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-white text-lg mt-4">{error || 'View not found'}</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Dynamic View (Form/List/Detail/Wizard) - Header is included in EnhancedDynamicViewRenderer */}
        <EnhancedDynamicViewRenderer
          viewJson={viewJson}
          userRole={userRole}
          onSubmit={handleSubmit}
          context={{}}
        />
      </View>
    </ImageBackground>
  );
};

export default DynamicViewScreen;

