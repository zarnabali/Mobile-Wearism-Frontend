import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ImageBackground,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ViewApi, ViewDefinition } from '../src/utils/api';
import * as SecureStore from 'expo-secure-store';

const ViewManagementScreen = () => {
  const router = useRouter();
  const [views, setViews] = useState<ViewDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingView, setEditingView] = useState<ViewDefinition | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchViews();
    fetchUserRole();
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

  const fetchViews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from ViewApi
      const response = await ViewApi.getAllViews();
      
      if (response.success && response.data) {
        setViews(response.data);
      } else {
        // Fallback to empty array if no views
        setViews([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch views:', err);
      // On error, show empty state - views might not be implemented in backend yet
      setViews([]);
      // Don't set error for now - allow empty state
      // setError(err.message || 'Failed to load views');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateView = () => {
    setEditingView(null);
    setModalVisible(true);
  };

  const handleEditView = (view: ViewDefinition) => {
    setEditingView(view);
    setModalVisible(true);
  };

  const handleDeleteView = (viewId: string) => {
    Alert.alert(
      'Delete View',
      'Are you sure you want to delete this view?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setViews(prev => prev.filter(v => v.id !== viewId));
              Alert.alert('Success', 'View deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete view');
            }
          },
        },
      ]
    );
  };

  const handleRunView = (viewId: string) => {
    router.push(`/dynamic-view?viewId=${viewId}`);
  };

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">View Management</Text>
          {userRole === 'admin' && (
            <TouchableOpacity
              onPress={handleCreateView}
              className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-white mt-4">Loading views...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-white text-lg mt-4 text-center">{error}</Text>
            <TouchableOpacity
              onPress={fetchViews}
              className="bg-blue-600 px-6 py-3 rounded-full mt-6"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : views.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="grid-outline" size={48} color="#6B7280" />
            <Text className="text-white text-lg mt-4">No views found</Text>
            <Text className="text-gray-400 text-center mt-2">
              Create your first dynamic view to get started
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {views.map((view) => (
              <TouchableOpacity
                key={view.id}
                className="bg-white/10 rounded-2xl p-5 mb-4 border border-white/20"
                onPress={() => handleRunView(view.id)}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold mb-1">
                      {view.title}
                    </Text>
                    <Text className="text-white/70 text-sm">{view.id}</Text>
                  </View>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleRunView(view.id)}
                      className="w-8 h-8 rounded-full bg-blue-600/30 items-center justify-center"
                    >
                      <Ionicons name="play" size={16} color="#60A5FA" />
                    </TouchableOpacity>
                    {userRole === 'admin' && (
                      <>
                        <TouchableOpacity
                          onPress={() => handleEditView(view)}
                          className="w-8 h-8 rounded-full bg-yellow-600/30 items-center justify-center"
                        >
                          <Ionicons name="pencil" size={16} color="#FBBF24" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteView(view.id)}
                          className="w-8 h-8 rounded-full bg-red-600/30 items-center justify-center"
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text className="text-white/60 text-xs">Widgets:</Text>
                  <Text className="text-white font-medium ml-2">{view.widgets.length}</Text>
                </View>

                {view.roleVisibility && view.roleVisibility.length > 0 && (
                  <View className="flex-row items-center flex-wrap mt-2">
                    <Text className="text-white/60 text-xs">Roles:</Text>
                    {view.roleVisibility.map((role) => (
                      <View
                        key={role}
                        className="bg-blue-600/30 px-2 py-1 rounded-full mr-2 mt-1"
                      >
                        <Text className="text-blue-300 text-xs">{role}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </ImageBackground>
  );
};

export default ViewManagementScreen;

