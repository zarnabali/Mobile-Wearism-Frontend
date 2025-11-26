import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import BackgroundImage from './components/BackgroundImage';
import { SchemaApi, Schema, SchemasResponse } from '../src/utils/api';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_SPACING = 16;

interface MenuItem {
  id: number;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  gradient: readonly [string, string];
}

interface SchemaCardProps {
  schema: Schema;
  index: number;
  onPress?: () => void;
}

const SchemaCard: React.FC<SchemaCardProps> = ({ schema, index, onPress }) => {
  const propertyCount = schema.jsonSchema?.properties ? Object.keys(schema.jsonSchema.properties).length : 0;
  const requiredFields = schema.jsonSchema?.required?.length || 0;
  const createdAt = new Date(schema.createdAt).toLocaleDateString();
  
  // Get widget types from fieldMapping if available
  const fieldMapping = (schema as any).fieldMapping || {};
  const hasEmailField = Object.values(fieldMapping).includes('email_field');
  const hasPhoneField = Object.values(fieldMapping).includes('phone_field');
  const hasLocationField = Object.values(fieldMapping).includes('location_field');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        width: CARD_WIDTH,
        marginRight: CARD_SPACING,
        marginLeft: index === 0 ? CARD_SPACING : 0,
      }}
    >
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          minHeight: 320,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Schema Header */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="bg-blue-500/20 px-3 py-1 rounded-full mr-2">
                <Text className="text-blue-400 text-xs font-bold uppercase">
                  {schema.name}
                </Text>
              </View>
              {schema.isActive ? (
                <View className="bg-green-500/20 px-2 py-1 rounded-full">
                  <Text className="text-green-400 text-xs font-semibold">Active</Text>
                </View>
              ) : (
                <View className="bg-red-500/20 px-2 py-1 rounded-full">
                  <Text className="text-red-400 text-xs font-semibold">Inactive</Text>
                </View>
              )}
            </View>
            <Text className="text-white text-xl font-bold mb-1">
              {schema.displayName}
            </Text>
            {schema.description && (
              <Text className="text-white/70 text-sm" numberOfLines={2}>
                {schema.description}
              </Text>
            )}
          </View>
          <Ionicons name="library-outline" size={32} color="#60A5FA" />
        </View>

        {/* Divider */}
        <View className="h-px bg-white/10 my-4" />

        {/* Schema Stats */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="text-white/50 text-xs mb-1">Properties</Text>
              <Text className="text-white text-lg font-bold">{propertyCount}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/50 text-xs mb-1">Required Fields</Text>
              <Text className="text-white text-lg font-bold">{requiredFields}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white/50 text-xs mb-1">Version</Text>
              <Text className="text-white text-lg font-bold">{schema.version}</Text>
            </View>
          </View>
        </View>

        {/* Widget Types */}
        {(hasEmailField || hasPhoneField || hasLocationField) && (
          <View className="mb-4">
            <Text className="text-white/50 text-xs mb-2">Widget Types</Text>
            <View className="flex-row flex-wrap">
              {hasEmailField && (
                <View className="bg-blue-500/20 px-2 py-1 rounded mr-2 mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="mail-outline" size={12} color="#60A5FA" />
                    <Text className="text-blue-400 text-xs ml-1">Email</Text>
                  </View>
                </View>
              )}
              {hasPhoneField && (
                <View className="bg-green-500/20 px-2 py-1 rounded mr-2 mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="call-outline" size={12} color="#10B981" />
                    <Text className="text-green-400 text-xs ml-1">Phone</Text>
                  </View>
                </View>
              )}
              {hasLocationField && (
                <View className="bg-purple-500/20 px-2 py-1 rounded mr-2 mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={12} color="#8B5CF6" />
                    <Text className="text-purple-400 text-xs ml-1">Location</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tenant & Date Info */}
        <View className="mt-auto pt-4 border-t border-white/10">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="business-outline" size={14} color="#94A3B8" />
              <Text className="text-white/60 text-xs ml-2">
                {schema.tenantId || 'System'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text className="text-white/60 text-xs ml-2">{createdAt}</Text>
            </View>
          </View>
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          onPress={onPress}
          className="mt-4 bg-white/10 rounded-xl py-3 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Text className="text-white font-semibold mr-2">View Details</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const SuperAdminMenu = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkSuperAdminStatus();
    fetchSchemas();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isAdmin = user.role === 'system_admin' || user.isSystemAdmin === true;
        setIsSuperAdmin(isAdmin);
        
        if (!isAdmin) {
          router.replace('/menu');
        }
      } else {
        router.replace('/login');
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      router.replace('/login');
    }
  };

  const fetchSchemas = async () => {
    try {
      setError(null);
      const response = await SchemaApi.getAllSchemas();
      if (response.success && response.data) {
        setSchemas(response.data);
      } else {
        setError('Failed to load schemas');
      }
    } catch (err: any) {
      console.error('Error fetching schemas:', err);
      setError(err?.message || 'Failed to load schemas');
      Alert.alert('Error', err?.message || 'Failed to load schemas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchemas();
  };

  const handleSchemaPress = (schema: Schema) => {
    router.push({
      pathname: '/schema-detail',
      params: { schemaName: schema.name },
    });
  };

  const superAdminFeatures: MenuItem[] = [
    {
      id: 1,
      title: 'Action Controls',
      description: 'Configure email, phone, and location actions',
      icon: 'settings-outline',
      route: '/action-controls',
      color: '#7C3AED',
      gradient: ['#4F46E5', '#7C3AED'] as const,
    },
    {
      id: 2,
      title: 'View Management',
      description: 'Create and manage dynamic views',
      icon: 'grid-outline',
      route: '/view-management',
      color: '#EC4899',
      gradient: ['#7C3AED', '#EC4899'] as const,
    },
    {
      id: 3,
      title: 'Schema Management',
      description: 'Manage data schemas',
      icon: 'library-outline',
      route: '/schema-management',
      color: '#0891B2',
      gradient: ['#059669', '#0891B2'] as const,
    },
    {
      id: 4,
      title: 'Tenant Management',
      description: 'Manage tenants and users',
      icon: 'business-outline',
      route: '/tenant-management',
      color: '#EA580C',
      gradient: ['#DC2626', '#EA580C'] as const,
    },
    {
      id: 5,
      title: 'System Health',
      description: 'Monitor system status',
      icon: 'pulse-outline',
      route: '/system-health',
      color: '#92400E',
      gradient: ['#7C2D12', '#92400E'] as const,
    },
    {
      id: 6,
      title: 'Audit Trail',
      description: 'View audit logs',
      icon: 'time-outline',
      route: '/audit-trail',
      color: '#3B82F6',
      gradient: ['#1E40AF', '#3B82F6'] as const,
    },
  ];

  return (
    <BackgroundImage>
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View className=" pt-12 pb-8">
          {/* Header */}
          <View className="mb-6 pt-4 px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-white text-4xl font-bold mb-2">Super Admin</Text>
                <Text className="text-white/80 text-base">
                  Platform Configuration & Management
                </Text>
              </View>
              <TouchableOpacity
                onPress={onRefresh}
                className="bg-white/10 p-3 rounded-full"
                disabled={refreshing}
              >
                <Ionicons
                  name="refresh"
                  size={24}
                  color="white"
                  style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Schema Cards Slider */}
          <View className="mb-6">
            <View className="flex-row px-4 items-center justify-between mb-4">
              <View>
                <Text className="text-white text-2xl font-bold">All Schemas</Text>
                <Text className="text-white/60 text-sm">
                  {schemas.length} {schemas.length === 1 ? 'schema' : 'schemas'} available
                </Text>
              </View>
              {schemas.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/schema-management')}
                  className="flex-row items-center bg-white/10 px-4 py-2 rounded-full"
                >
                  <Text className="text-white text-sm font-semibold mr-2">View All</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#60A5FA" />
                <Text className="text-white/60 mt-4">Loading schemas...</Text>
              </View>
            ) : error ? (
              <View className="py-12 items-center justify-center bg-red-500/10 rounded-2xl border border-red-500/20">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="text-red-400 mt-4 text-center">{error}</Text>
                <TouchableOpacity
                  onPress={fetchSchemas}
                  className="mt-4 bg-red-500/20 px-6 py-3 rounded-full"
                >
                  <Text className="text-red-400 font-semibold">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : schemas.length === 0 ? (
              <View className="py-12 items-center justify-center bg-white/5 rounded-2xl border border-white/10">
                <Ionicons name="library-outline" size={48} color="#94A3B8" />
                <Text className="text-white/60 mt-4 text-center">
                  No schemas found
                </Text>
                <Text className="text-white/40 text-sm mt-2 text-center">
                  Create your first schema to get started
                </Text>
              </View>
            ) : (
              <FlatList
                data={schemas}
                renderItem={({ item, index }) => (
                  <SchemaCard
                    schema={item}
                    index={index}
                    onPress={() => handleSchemaPress(item)}
                  />
                )}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                contentContainerStyle={{
                  paddingRight: CARD_SPACING,
                }}
                pagingEnabled={false}
                snapToAlignment="start"
              />
            )}
          </View>

          {/* Feature Grid */}
          <View className="mb-6 px-4">
            <Text className="text-white text-2xl font-bold mb-4">Quick Actions</Text>
            <View className="flex-row flex-wrap justify-between">
              {superAdminFeatures.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  onPress={() => router.push(feature.route)}
                  className="w-[48%] mb-4"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={feature.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      padding: 20,
                      minHeight: 140,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                    }}
                  >
                    <View className="items-center">
                      <View
                        className="w-14 h-14 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        <Ionicons name={feature.icon as any} size={28} color="white" />
                      </View>
                      <Text className="text-white text-lg font-bold text-center mb-1">
                        {feature.title}
                      </Text>
                      <Text className="text-white/80 text-xs text-center">
                        {feature.description}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Card */}
          <View className="mb-6 px-4">
            <LinearGradient
              colors={['#1E293B', '#334155'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text className="text-white text-xl font-bold mb-4">System Overview</Text>
              <View className="flex-row justify-between">
                <View className="flex-1 items-center">
                  <Text className="text-white/50 text-xs mb-1">Total Schemas</Text>
                  <Text className="text-white text-3xl font-bold">{schemas.length}</Text>
                </View>
                <View className="w-px bg-white/10 mx-4" />
                <View className="flex-1 items-center">
                  <Text className="text-white/50 text-xs mb-1">Active Schemas</Text>
                  <Text className="text-white text-3xl font-bold">
                    {schemas.filter((s) => s.isActive).length}
                  </Text>
                </View>
                <View className="w-px bg-white/10 mx-4" />
                <View className="flex-1 items-center">
                  <Text className="text-white/50 text-xs mb-1">Inactive</Text>
                  <Text className="text-white text-3xl font-bold">
                    {schemas.filter((s) => !s.isActive).length}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

export default SuperAdminMenu;
