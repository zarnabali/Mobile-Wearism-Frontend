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
import { SchemaApi, DynamicDataApi } from '../src/utils/api';
import { convertSchemaToView } from '../src/utils/schemaToWidgetMapper';
import * as SecureStore from 'expo-secure-store';

const CreateRecordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const schemaName = params.schemaName as string;

  const [viewJson, setViewJson] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
    fetchSchemaAndCreateView();
  }, [schemaName]);

  const fetchUserRole = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'customer');
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchSchemaAndCreateView = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!schemaName) {
        setError('No schema name provided');
        setLoading(false);
        return;
      }

      // Fetch schema from backend
      const schemaResponse = await SchemaApi.getSchemaByName(schemaName);
      
      if (schemaResponse.success && schemaResponse.data?.jsonSchema) {
        // Convert schema to view
        const view = convertSchemaToView(schemaName, schemaResponse.data.jsonSchema, {
          title: `Create ${schemaResponse.data.displayName || schemaName}`,
          viewType: 'form',
        });
        
        setViewJson(view);
      } else {
        setError('Schema not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch schema:', err);
      setError(err.message || 'Failed to load schema');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      setSubmitting(true);

      // Clean data - remove empty values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );

      const response = await DynamicDataApi.createRecord(schemaName, cleanData);
      
      if (response.success) {
        Alert.alert('Success', 'Record created successfully', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create record');
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      Alert.alert('Error', err.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
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
          <Text className="text-white mt-4">Loading form...</Text>
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
            <Text className="text-white text-lg mt-4 text-center">{error || 'Form not found'}</Text>
            <TouchableOpacity
              onPress={fetchSchemaAndCreateView}
              className="bg-blue-600 px-6 py-3 rounded-full mt-6"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
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

export default CreateRecordScreen;

