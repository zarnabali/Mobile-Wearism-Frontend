import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { AuthApi, TenantApi, UserProfile, TenantInfo } from '../src/utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ProfileScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [tenantData, setTenantData] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user profile and tenant data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile first
      const profileResponse = await AuthApi.getProfile();
      setUserData(profileResponse.data);
      
      // Initialize edit form with current data
      setEditForm({
        firstName: profileResponse.data.firstName,
        lastName: profileResponse.data.lastName,
        email: profileResponse.data.email,
      });

      // Then fetch tenant info using the user's tenantId
      if (profileResponse.data.tenantId) {
        try {
          const tenantResponse = await AuthApi.getTenantInfo();
          console.log('Tenant response:', tenantResponse);
          setTenantData(tenantResponse.data);
        } catch (tenantErr: any) {
          console.error('Failed to fetch tenant data:', tenantErr);
          // Don't fail the whole request if tenant fetch fails
          setTenantData(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch profile data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userData) return;

    try {
      setLoading(true);
      await AuthApi.updateProfile(editForm);
      
      // Refresh profile data
      await fetchProfileData();
      setEditModalVisible(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await AuthApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordModalVisible(false);
      
      Alert.alert('Success', 'Password changed successfully');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      Alert.alert('Error', err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear stored auth data
              await SecureStore.deleteItemAsync('auth_token');
              await SecureStore.deleteItemAsync('auth_user');
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
            router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'professional': return ['#4F46E5', '#7C3AED'];
      case 'basic': return ['#059669', '#0891B2'];
      case 'trial': return ['#DC2626', '#EA580C'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'system_admin': return '#DC2626';
      case 'admin': return '#4F46E5';
      case 'office': return '#059669';
      case 'technician': return '#EA580C';
      case 'customer': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'system_admin': return 'System Administrator - Full system access and tenant management';
      case 'admin': return 'Tenant Administrator - Manage tenant users, schemas, and settings';
      case 'office': return 'Office Staff - Manage jobs, customers, and invoices';
      case 'technician': return 'Technician - Complete jobs and update status';
      case 'customer': return 'Customer - View jobs and invoices';
      default: return 'User - Basic access permissions';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'system_admin': return 'shield-checkmark-outline';
      case 'admin': return 'settings-outline';
      case 'office': return 'business-outline';
      case 'technician': return 'construct-outline';
      case 'customer': return 'person-outline';
      default: return 'person-circle-outline';
    }
  };

  const PermissionCard = ({ category, permissions }: { category: string; permissions: any }) => {
    const getCategoryIcon = (cat: string) => {
      switch (cat) {
        case 'system': return 'settings-outline';
        case 'schemas': return 'library-outline';
        case 'data': return 'server-outline';
        case 'audit': return 'time-outline';
        case 'users': return 'people-outline';
        case 'jobs': return 'briefcase-outline';
        case 'customers': return 'person-outline';
        case 'invoices': return 'receipt-outline';
        case 'reports': return 'bar-chart-outline';
        case 'sync': return 'sync-outline';
        default: return 'ellipse-outline';
      }
    };

    const enabledCount = Object.values(permissions).filter(Boolean).length;
    const totalCount = Object.keys(permissions).length;

    return (
      <View className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-lg bg-blue-500/20 items-center justify-center mr-3">
              <Ionicons name={getCategoryIcon(category) as any} size={16} color="#60A5FA" />
            </View>
            <Text className="text-white font-medium capitalize">{category}</Text>
          </View>
          <View className="bg-green-500/20 px-2 py-1 rounded-full">
            <Text className="text-green-400 text-xs font-medium">
              {enabledCount}/{totalCount}
            </Text>
          </View>
        </View>
        
        <View className="flex-row flex-wrap">
          {Object.entries(permissions).map(([permission, enabled]) => (
            <View key={permission} className="mr-2 mb-2">
              <View className={`px-2 py-1 rounded-full ${enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                <Text className={`text-xs font-medium ${enabled ? 'text-green-400' : 'text-gray-400'}`}>
                  {permission}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const UsageCard = ({ title, used, total, unit, color }: { 
    title: string; used: number; total: number; unit: string; color: string 
  }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    
    return (
      <View className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-medium">{title}</Text>
          <Text className="text-gray-400 text-sm">{used} / {total} {unit}</Text>
        </View>
        
        <View className="h-2 bg-gray-700 rounded-full mb-2">
          <View 
            className="h-2 rounded-full"
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: color
            }}
          />
        </View>
        
        <Text className="text-gray-400 text-xs">{percentage.toFixed(1)}% used</Text>
      </View>
    );
  };

  const TabButton = ({ title, index, onPress }: { title: string; index: number; onPress: (index: number) => void }) => (
    <TouchableOpacity
      onPress={() => onPress(index)}
      className={`px-4 py-2 rounded-full mr-2 ${activeTab === index ? 'bg-blue-600' : 'bg-gray-800'}`}
    >
      <Text className={`font-medium ${activeTab === index ? 'text-white' : 'text-gray-400'}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../assets/background/img5.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Profile</Text>
          
          <TouchableOpacity 
            onPress={handleLogout}
            className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {loading ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-white text-lg">Loading profile...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-red-400 text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={fetchProfileData}
                className="bg-blue-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : userData ? (
            <>
          {/* User Info Card */}
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mr-4">
                    <Ionicons 
                      name={getRoleIcon(userData.role) as any} 
                      size={24} 
                      color={getRoleColor(userData.role)} 
                    />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-semibold">
                  {userData.firstName} {userData.lastName}
                </Text>
                <Text className="text-white/70 text-sm">{userData.email}</Text>
                    
                    
                    
                
              </View>
            </View>
            
            <View className="border-t border-white/20 pt-4">
              <Text className="text-white/70 text-sm mb-2">Tenant</Text>
                  <Text className="text-white font-medium">
                    {tenantData ? tenantData.displayName : userData.tenantId || 'Loading...'}
                  </Text>
                  <Text className="text-white/60 text-xs">
                    {tenantData ? tenantData.description : 'Tenant information loading...'}
                  </Text>
            </View>
          </LinearGradient>

          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="Overview" index={0} onPress={setActiveTab} />
              <TabButton title="Permissions" index={1} onPress={setActiveTab} />
              <TabButton title="Usage" index={2} onPress={setActiveTab} />
              <TabButton title="Settings" index={3} onPress={setActiveTab} />
                  <TabButton title="Help" index={4} onPress={setActiveTab} />
                  <TabButton title="Terms" index={5} onPress={setActiveTab} />
                  <TabButton title="About" index={6} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {/* Tab Content */}
          {activeTab === 0 && (
            <View>
                  {/* Role Information */}
                  <View className="mb-6">
                    <Text className="text-white text-lg font-semibold mb-4">Role Information</Text>
                    
                    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                      <View className="flex-row items-center mb-3">
                        <View 
                          className="w-12 h-12 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: getRoleColor(userData.role) + '20' }}
                        >
                          <Ionicons 
                            name={getRoleIcon(userData.role) as any} 
                            size={24} 
                            color={getRoleColor(userData.role)} 
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-semibold">
                            {userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Text>
                          <Text 
                            className="text-sm font-medium"
                            style={{ color: getRoleColor(userData.role) }}
                          >
                            {userData.role.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <Text className="text-gray-300 text-sm leading-relaxed">
                        {getRoleDescription(userData.role)}
                      </Text>
                      
                      <View className="mt-3 pt-3 border-t border-gray-700">
                        <Text className="text-gray-400 text-xs mb-2">Key Capabilities:</Text>
                        <View className="flex-row flex-wrap">
                          {userData.permissions && Object.entries(userData.permissions).map(([category, perms]) => {
                            const hasAnyPermission = Object.values(perms).some((p: any) => p === true);
                            if (!hasAnyPermission) return null;
                            
                            return (
                              <View key={category} className="mr-2 mb-1">
                                <View className="bg-blue-500/20 px-2 py-1 rounded-full">
                                  <Text className="text-blue-300 text-xs font-medium capitalize">
                                    {category.replace(/([A-Z])/g, ' $1').trim()}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </View>

              {/* Tenant Info */}
              <View className="mb-6">
                <Text className="text-white text-lg font-semibold mb-4">Tenant Information</Text>
                
                    {tenantData ? (
                      <>
                        <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-white font-semibold">Subscription Plan</Text>
                    <Text className="text-white/70 text-sm capitalize">{tenantData.subscriptionPlan}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-white/70 text-sm">Status</Text>
                    <View className="bg-green-500/30 px-2 py-1 rounded-full">
                      <Text className="text-green-200 text-xs font-medium capitalize">
                        {tenantData.subscriptionStatus}
                      </Text>
                    </View>
                  </View>
                        </View>

                <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                          <Text className="text-white font-medium mb-3">Tenant Details</Text>
                  <View className="space-y-2">
                            <View className="flex-row items-center">
                              <Ionicons name="business-outline" size={16} color="#6B7280" />
                              <Text className="text-gray-400 text-sm ml-2">Name: {tenantData.name}</Text>
                            </View>
                    <View className="flex-row items-center">
                      <Ionicons name="mail-outline" size={16} color="#6B7280" />
                              <Text className="text-gray-400 text-sm ml-2">{tenantData.contactEmail || 'No email'}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="call-outline" size={16} color="#6B7280" />
                              <Text className="text-gray-400 text-sm ml-2">{tenantData.contactPhone || 'No phone'}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-400 text-sm ml-2">
                        Created {new Date(tenantData.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                            <View className="flex-row items-center">
                              <Ionicons name="id-card-outline" size={16} color="#6B7280" />
                              <Text className="text-gray-400 text-sm ml-2">ID: {tenantData.tenantId}</Text>
                  </View>
                </View>
              </View>

              {/* Features */}
                        <View className="mt-6">
                <Text className="text-white text-lg font-semibold mb-4">Enabled Features</Text>
                <View className="flex-row flex-wrap">
                  {Object.entries(tenantData.settings.features).map(([feature, enabled]) => (
                    <View key={feature} className="mr-2 mb-2">
                      <View className={`px-3 py-2 rounded-full ${enabled ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                        <Text className={`text-sm font-medium ${enabled ? 'text-green-400' : 'text-gray-400'}`}>
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
                      </>
                    ) : (
                      <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="business-outline" size={48} color="#6B7280" />
                        </View>
                        <Text className="text-white text-center text-lg font-medium mt-4">
                          {userData.tenantId ? 'Loading tenant information...' : 'No tenant assigned'}
                        </Text>
                        <Text className="text-gray-400 text-center text-sm mt-2">
                          {userData.tenantId ? 'Please wait while we fetch your tenant details.' : 'Contact your administrator to assign you to a tenant.'}
                        </Text>
                        {userData.tenantId && (
                          <TouchableOpacity 
                            onPress={fetchProfileData}
                            className="bg-blue-600 px-6 py-3 rounded-full mt-4 self-center"
                          >
                            <Text className="text-white font-semibold">Retry</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
            </View>
          )}

          {activeTab === 1 && (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">User Permissions</Text>
              {Object.entries(userData.permissions).map(([category, permissions]) => (
                <PermissionCard 
                  key={category} 
                  category={category} 
                  permissions={permissions} 
                />
              ))}
            </View>
          )}

          {activeTab === 2 && (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">Usage Statistics</Text>
              
                  {tenantData ? (
                    <>
              <UsageCard
                title="Users"
                used={tenantData.usage.userCount}
                total={tenantData.settings.maxUsers}
                unit="users"
                color="#4F46E5"
              />
              
              <UsageCard
                title="Schemas"
                used={tenantData.usage.schemaCount}
                total={tenantData.settings.maxSchemas}
                unit="schemas"
                color="#059669"
              />
              
              <UsageCard
                title="Storage"
                used={tenantData.usage.storageUsedGB}
                total={tenantData.settings.maxStorageGB}
                unit="GB"
                color="#EA580C"
              />

              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Text className="text-white font-medium mb-3">API Usage</Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 text-sm">Calls this month</Text>
                  <Text className="text-white font-medium">{tenantData.usage.apiCallsThisMonth}</Text>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-gray-400 text-sm">Last updated</Text>
                  <Text className="text-gray-400 text-sm">
                    {new Date(tenantData.usage.lastUsageUpdate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
                    </>
                  ) : (
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                      <View className="flex-row items-center justify-center">
                        <Ionicons name="stats-chart-outline" size={48} color="#6B7280" />
                      </View>
                      <Text className="text-white text-center text-lg font-medium mt-4">
                        Usage data not available
                      </Text>
                      <Text className="text-gray-400 text-center text-sm mt-2">
                        Tenant information is required to display usage statistics.
                      </Text>
                      {userData.tenantId && (
                        <TouchableOpacity 
                          onPress={fetchProfileData}
                          className="bg-blue-600 px-6 py-3 rounded-full mt-4 self-center"
                        >
                          <Text className="text-white font-semibold">Retry</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
            </View>
          )}

          {activeTab === 3 && (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">Account Settings</Text>
              
              <View className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700/50">
                    <TouchableOpacity 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => setEditModalVisible(true)}
                    >
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <Text className="text-white font-medium ml-3">Edit Profile</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
                
                <View className="h-px bg-gray-700 my-2" />
                
                    <TouchableOpacity 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => setPasswordModalVisible(true)}
                    >
                  <View className="flex-row items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                    <Text className="text-white font-medium ml-3">Change Password</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
                
              </View>

              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <TouchableOpacity 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => setActiveTab(4)}
                    >
                  <View className="flex-row items-center">
                    <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                    <Text className="text-white font-medium ml-3">Help & Support</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
                
                <View className="h-px bg-gray-700 my-2" />
                
                    <TouchableOpacity 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => setActiveTab(5)}
                    >
                  <View className="flex-row items-center">
                    <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                    <Text className="text-white font-medium ml-3">Terms & Privacy</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
                
                <View className="h-px bg-gray-700 my-2" />
                
                    <TouchableOpacity 
                      className="flex-row items-center justify-between py-3"
                      onPress={() => setActiveTab(6)}
                    >
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                    <Text className="text-white font-medium ml-3">About</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          )}

              {/* Help & Support Tab */}
              {activeTab === 4 && (
                <View>
                  <Text className="text-white text-lg font-semibold mb-4">Help & Support</Text>
                  
                  <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <View className="flex-row items-center mb-4">
                      <Ionicons name="help-circle-outline" size={32} color="#60A5FA" />
                      <Text className="text-white text-xl font-semibold ml-3">Get Help</Text>
                    </View>
                    
                    <Text className="text-gray-300 text-sm leading-relaxed mb-6">
                      Need assistance with Toolivo? We're here to help you make the most of your craftsman management platform.
                    </Text>

                    <View className="space-y-4">
                      <View className="bg-gray-700/50 rounded-lg p-4 my-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="book-outline" size={20} color="#60A5FA" />
                          <Text className="text-white font-medium ml-2">Documentation</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          Comprehensive guides for schemas, audit trails, and tenant management
                        </Text>
                      </View>

                      <View className="bg-gray-700/50 rounded-lg p-4 my-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="videocam-outline" size={20} color="#60A5FA" />
                          <Text className="text-white font-medium ml-2">Video Tutorials</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          Step-by-step video guides for all platform features
                        </Text>
                      </View>

                      <View className="bg-gray-700/50 rounded-lg p-4 my-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="chatbubbles-outline" size={20} color="#60A5FA" />
                          <Text className="text-white font-medium ml-2">Live Support</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          Real-time chat support during business hours
                        </Text>
                      </View>

                      <View className="bg-gray-700/50 rounded-lg p-4 my-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="mail-outline" size={20} color="#60A5FA" />
                          <Text className="text-white font-medium ml-2">Email Support</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          support@toolivo.com - We respond within 24 hours
                        </Text>
                      </View>

                      <View className="bg-gray-700/50 rounded-lg p-4 my-1">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="call-outline" size={20} color="#60A5FA" />
                          <Text className="text-white font-medium ml-2">Phone Support</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">
                          +1 (555) 123-4567 - Mon-Fri 9AM-6PM EST
                        </Text>
                      </View>
                    </View>

                    <View className=" pt-4 ">
                      <Text className="text-gray-400 text-sm mb-3">Common Topics:</Text>
                      <View className="flex-row flex-wrap">
                        {['Schema Creation', 'User Management', 'Audit Trails', 'API Integration', 'Data Export', 'Permissions'].map((topic) => (
                          <View key={topic} className="mr-2 mb-2">
                            <View className="bg-blue-500/20 px-3 py-1 rounded-full">
                              <Text className="text-blue-300 text-xs font-medium">{topic}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Terms & Privacy Tab */}
              {activeTab === 5 && (
                <View>
                  <Text className="text-white text-lg font-semibold mb-4">Terms & Privacy</Text>
                  
                  <View className="space-y-4 ">
                    {/* Terms of Service */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="document-text-outline" size={32} color="#10B981" />
                        <Text className="text-white text-xl font-semibold ml-3">Terms of Service</Text>
                      </View>
                      
                      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                        <Text className="text-gray-300 text-sm leading-relaxed">
                          <Text className="text-white font-semibold">1. Acceptance of Terms</Text>{'\n'}
                          By accessing and using Toolivo, you accept and agree to be bound by the terms and provision of this agreement.{'\n\n'}
                          
                          <Text className="text-white font-semibold">2. Use License</Text>{'\n'}
                          Permission is granted to temporarily use Toolivo for personal and commercial purposes. This license shall automatically terminate if you violate any restrictions.{'\n\n'}
                          
                          <Text className="text-white font-semibold">3. User Accounts</Text>{'\n'}
                          You are responsible for safeguarding your account credentials and for all activities that occur under your account.{'\n\n'}
                          
                          <Text className="text-white font-semibold">4. Data Security</Text>{'\n'}
                          We implement industry-standard security measures to protect your data, including encryption, access controls, and regular security audits.{'\n\n'}
                          
                          <Text className="text-white font-semibold">5. Service Availability</Text>{'\n'}
                          We strive for 99.9% uptime but do not guarantee uninterrupted service availability.{'\n\n'}
                          
                          <Text className="text-white font-semibold">6. Limitation of Liability</Text>{'\n'}
                          Toolivo shall not be liable for any indirect, incidental, special, consequential, or punitive damages.{'\n\n'}
                          
                          <Text className="text-white font-semibold">7. Changes to Terms</Text>{'\n'}
                          We reserve the right to modify these terms at any time. Continued use constitutes acceptance of changes.
                        </Text>
        </ScrollView>
      </View>

                    {/* Privacy Policy */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="shield-checkmark-outline" size={32} color="#8B5CF6" />
                        <Text className="text-white text-xl font-semibold ml-3">Privacy Policy</Text>
                      </View>
                      
                      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                        <Text className="text-gray-300 text-sm leading-relaxed">
                          <Text className="text-white font-semibold">Information We Collect</Text>{'\n'}
                          We collect account information, usage data, and content you create to provide and improve our services.{'\n\n'}
                          
                          <Text className="text-white font-semibold">How We Use Information</Text>{'\n'}
                          Your data is used to provide services, maintain security, improve functionality, and communicate with you.{'\n\n'}
                          
                          <Text className="text-white font-semibold">Data Sharing</Text>{'\n'}
                          We do not sell your personal data. We may share data only with your consent or as required by law.{'\n\n'}
                          
                          <Text className="text-white font-semibold">Data Security</Text>{'\n'}
                          We use encryption, access controls, and security monitoring to protect your information.{'\n\n'}
                          
                          <Text className="text-white font-semibold">Your Rights</Text>{'\n'}
                          You have the right to access, update, delete, or export your data at any time.{'\n\n'}
                          
                          <Text className="text-white font-semibold">Data Retention</Text>{'\n'}
                          We retain your data as long as your account is active or as required by law.{'\n\n'}
                          
                          <Text className="text-white font-semibold">Contact Us</Text>{'\n'}
                          For privacy questions, contact us at privacy@toolivo.com
                        </Text>
                      </ScrollView>
                    </View>

                    {/* GDPR Compliance */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="globe-outline" size={32} color="#F59E0B" />
                        <Text className="text-white text-xl font-semibold ml-3">GDPR Compliance</Text>
                      </View>
                      
                      <Text className="text-gray-300 text-sm leading-relaxed mb-4">
                        Toolivo is fully compliant with the General Data Protection Regulation (GDPR) and other international privacy laws.
                      </Text>

                      <View className="space-y-3">
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text className="text-gray-300 text-sm ml-2">Right to Access - View your personal data</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text className="text-gray-300 text-sm ml-2">Right to Rectification - Correct inaccurate data</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text className="text-gray-300 text-sm ml-2">Right to Erasure - Delete your data</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text className="text-gray-300 text-sm ml-2">Right to Portability - Export your data</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text className="text-gray-300 text-sm ml-2">Data Processing Lawfulness - Clear legal basis</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* About Tab */}
              {activeTab === 6 && (
                <View>
                  <Text className="text-white text-lg font-semibold mb-4">About Toolivo</Text>
                  
                  <View className="space-y-4">
                    {/* Company Info */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="business-outline" size={32} color="#3B82F6" />
                        <Text className="text-white text-xl font-semibold ml-3">Our Mission</Text>
                      </View>
                      
                      <Text className="text-gray-300 text-sm leading-relaxed mb-4">
                        Toolivo is a comprehensive craftsman and contractor management platform designed to streamline business operations, 
                        enhance productivity, and ensure compliance through advanced technology solutions.
                      </Text>

                      <Text className="text-gray-300 text-sm leading-relaxed">
                        We empower businesses with dynamic schema management, comprehensive audit trails, multi-tenant architecture, 
                        and real-time collaboration tools to help them succeed in today's competitive market.
                      </Text>
                    </View>

                    {/* Features */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="star-outline" size={32} color="#F59E0B" />
                        <Text className="text-white text-xl font-semibold ml-3">Key Features</Text>
                      </View>
                      
                      <View className="grid grid-cols-1 gap-3">
                        {[
                          { icon: 'library-outline', title: 'Dynamic Schemas', desc: 'Create custom data structures' },
                          { icon: 'time-outline', title: 'Audit Trails', desc: 'Complete change tracking' },
                          { icon: 'people-outline', title: 'Multi-Tenant', desc: 'Isolated business environments' },
                          { icon: 'sync-outline', title: 'Real-time Sync', desc: 'Live data synchronization' },
                          { icon: 'shield-outline', title: 'Security', desc: 'Enterprise-grade protection' },
                          { icon: 'analytics-outline', title: 'Analytics', desc: 'Business intelligence insights' }
                        ].map((feature, index) => (
                          <View key={index} className="flex-row items-center p-3 bg-gray-700/30 rounded-lg">
                            <Ionicons name={feature.icon as any} size={20} color="#60A5FA" />
                            <View className="ml-3 flex-1">
                              <Text className="text-white font-medium">{feature.title}</Text>
                              <Text className="text-gray-400 text-sm">{feature.desc}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Technical Info */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="settings-outline" size={32} color="#8B5CF6" />
                        <Text className="text-white text-xl font-semibold ml-3">Technical Specifications</Text>
                      </View>
                      
                      <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">Platform Version</Text>
                          <Text className="text-white text-sm font-medium">v2.1.0</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">API Version</Text>
                          <Text className="text-white text-sm font-medium">v1.3.0</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">Database</Text>
                          <Text className="text-white text-sm font-medium">MongoDB 6.0</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">Authentication</Text>
                          <Text className="text-white text-sm font-medium">JWT + OAuth2</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">Encryption</Text>
                          <Text className="text-white text-sm font-medium">AES-256</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-300 text-sm">Compliance</Text>
                          <Text className="text-white text-sm font-medium">GDPR, SOC2</Text>
                        </View>
                      </View>
                    </View>

                    {/* Contact Info */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="mail-outline" size={32} color="#10B981" />
                        <Text className="text-white text-xl font-semibold ml-3">Contact Information</Text>
                      </View>
                      
                      <View className="space-y-3">
                        <View className="flex-row items-center">
                          <Ionicons name="mail" size={16} color="#60A5FA" />
                          <Text className="text-gray-300 text-sm ml-2">info@toolivo.com</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="call" size={16} color="#60A5FA" />
                          <Text className="text-gray-300 text-sm ml-2">+1 (555) 123-4567</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="location" size={16} color="#60A5FA" />
                          <Text className="text-gray-300 text-sm ml-2">123 Business Ave, Suite 100, Tech City, TC 12345</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="globe" size={16} color="#60A5FA" />
                          <Text className="text-gray-300 text-sm ml-2">www.toolivo.com</Text>
                        </View>
                      </View>
                    </View>

                    {/* Legal */}
                    <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 my-2">
                      <View className="flex-row items-center mb-4">
                        <Ionicons name="document-outline" size={32} color="#EF4444" />
                        <Text className="text-white text-xl font-semibold ml-3">Legal Information</Text>
                      </View>
                      
                      <View className="space-y-2">
                        <Text className="text-gray-300 text-sm">
                          <Text className="text-white font-medium">Company:</Text> Toolivo Technologies Inc.
                        </Text>
                        <Text className="text-gray-300 text-sm">
                          <Text className="text-white font-medium">Registration:</Text> #TC-2024-001234
                        </Text>
                        <Text className="text-gray-300 text-sm">
                          <Text className="text-white font-medium">Tax ID:</Text> 12-3456789
                        </Text>
                        <Text className="text-gray-300 text-sm">
                          <Text className="text-white font-medium">Copyright:</Text> © 2024 Toolivo Technologies Inc. All rights reserved.
                        </Text>
                        <Text className="text-gray-300 text-sm">
                          <Text className="text-white font-medium">Last Updated:</Text> {new Date().toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
            <TouchableOpacity 
              onPress={() => setEditModalVisible(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-semibold">Edit Profile</Text>
            
            <TouchableOpacity 
              onPress={handleUpdateProfile}
              className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
              disabled={loading}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 px-6">
            <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">First Name</Text>
                <TextInput
                  className="bg-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  placeholder="Enter your first name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={editForm.firstName}
                  onChangeText={(value) => setEditForm(prev => ({ ...prev, firstName: value }))}
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">Last Name</Text>
                <TextInput
                  className="bg-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  placeholder="Enter your last name"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={editForm.lastName}
                  onChangeText={(value) => setEditForm(prev => ({ ...prev, lastName: value }))}
                  autoCapitalize="words"
                />
              </View>

              <View className="mb-6">
                <Text className="text-white text-sm font-medium mb-2">Email Address</Text>
                <TextInput
                  className="bg-gray-700 rounded-xl px-4 py-4 text-white text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={editForm.email}
                  onChangeText={(value) => setEditForm(prev => ({ ...prev, email: value }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
            <TouchableOpacity 
              onPress={() => setPasswordModalVisible(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            <Text className="text-white text-lg font-semibold">Change Password</Text>
            
            <TouchableOpacity 
              onPress={handleChangePassword}
              className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
              disabled={loading}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 px-6">
            <View className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">Current Password</Text>
                <View className="bg-gray-700 rounded-xl px-4 py-4 flex-row items-center">
                  <TextInput
                    className="flex-1 text-white text-base"
                    placeholder="Enter current password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={passwordForm.currentPassword}
                    onChangeText={(value) => setPasswordForm(prev => ({ ...prev, currentPassword: value }))}
                    secureTextEntry={!showCurrentPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons
                      name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-white text-sm font-medium mb-2">New Password</Text>
                <View className="bg-gray-700 rounded-xl px-4 py-4 flex-row items-center">
                  <TextInput
                    className="flex-1 text-white text-base"
                    placeholder="Enter new password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={passwordForm.newPassword}
                    onChangeText={(value) => setPasswordForm(prev => ({ ...prev, newPassword: value }))}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-white text-sm font-medium mb-2">Confirm New Password</Text>
                <View className="bg-gray-700 rounded-xl px-4 py-4 flex-row items-center">
                  <TextInput
                    className="flex-1 text-white text-base"
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={passwordForm.confirmPassword}
                    onChangeText={(value) => setPasswordForm(prev => ({ ...prev, confirmPassword: value }))}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default ProfileScreen;
