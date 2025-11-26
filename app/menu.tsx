import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { SchemaApi, Schema } from '../src/utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MenuScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const scrollViewRef = useRef(null);
  const router = useRouter();

  // Check if user is super admin
  useEffect(() => {
    checkSuperAdminStatus();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const isAdmin = user.role === 'system_admin' || user.isSystemAdmin === true;
        setIsSuperAdmin(isAdmin);
        
        // Redirect super admin to super admin menu
        const loginMode = await SecureStore.getItemAsync('login_mode');
        if (isAdmin && loginMode === 'superadmin') {
          router.replace('/super-admin-menu');
        }
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
  };

  // Fetch schemas from API
  useEffect(() => {
    fetchSchemas();
  }, []);

  const fetchSchemas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await SchemaApi.getAllSchemas();
      setSchemas(response.data);
    } catch (err: any) {
      console.error('Failed to fetch schemas:', err);
      setError(err.message || 'Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  const allFeatures = [
    {
      id: 1,
      title: 'Schema Management',
      agency: 'Backend Tools',
      time: 'Dynamic',
      members: 1,
      priority: 'high',
      description: 'Create, update, delete schemas',
      icon: 'library-outline',
      route: '/schema-management',
    },
    {
      id: 2,
      title: 'Dynamic CRUD Operations',
      agency: 'Backend Tools',
      time: 'Real-time',
      members: 1,
      priority: 'high',
      description: 'Create, read, update, delete data',
      icon: 'create-outline',
      route: '/data-management',
    },
    {
      id: 3,
      title: 'Audit Trail',
      agency: 'Backend Tools',
      time: 'Historical',
      members: 1,
      priority: 'medium',
      description: 'Track changes and rollback',
      icon: 'time-outline',
      route: '/audit-trail',
    },
    {
      id: 4,
      title: 'Queue Management',
      agency: 'Backend Tools',
      time: 'Async',
      members: 1,
      priority: 'medium',
      description: 'Background job processing',
      icon: 'list-outline',
      route: '/queue-monitoring',
    },
    {
      id: 5,
      title: 'System Health',
      agency: 'Backend Tools',
      time: 'Monitoring',
      members: 1,
      priority: 'low',
      description: 'System status and metrics',
      icon: 'pulse-outline',
      route: '/system-health',
    },
    {
      id: 6,
      title: 'Tenant Management',
      agency: 'Backend Tools',
      time: 'Multi-tenant',
      members: 1,
      priority: 'high',
      description: 'Manage tenants and users',
      icon: 'business-outline',
      route: '/tenant-management',
    },
    {
      id: 7,
      title: 'View Management',
      agency: 'Dynamic Views',
      time: 'Milestone 2 & 6',
      members: 1,
      priority: 'high',
      description: 'Super Admin view management',
      icon: 'grid-outline',
      route: '/view-management',
    },
  ];

  // Simple functions
  const handleFabPress = () => {
    router.push('/schema-generator');
  };

  const handleSearchFocus = () => {
    console.log('Search focused');
  };

  const handleSearchBlur = () => {
    console.log('Search blurred');
  };

  const SchemaCard = ({ item, index }: { item: Schema; index: number }) => {
    const handleCardPress = () => {
      router.push(`/schema-detail?schemaName=${item.name}`);
    };

    // Get field count from jsonSchema properties
    const fieldCount = Object.keys(item.jsonSchema?.properties || {}).length;
    
    // Format date
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: 'short', 
        day: '2-digit' 
      });
    };

    // Generate gradient colors based on field count
    const gradients = [
      ['#4F46E5', '#7C3AED'],
      ['#7C3AED', '#EC4899'],
      ['#059669', '#0891B2'],
      ['#DC2626', '#EA580C'],
      ['#7C2D12', '#92400E']
    ];
    
    const shadowGradients = [
      ['#4F46E580', '#7C3AED30'],
      ['#7C3AED80', '#EC489930'],
      ['#05966980', '#0891B230'],
      ['#DC262680', '#EA580C30'],
      ['#7C2D1280', '#92400E30']
    ];

    const gradientIndex = index % gradients.length;
    const gradient = gradients[gradientIndex];
    const shadowGradient = shadowGradients[gradientIndex];

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleCardPress}
          className="mr-4"
          style={{ width: screenWidth * 0.65 }}
        >
          {/* Gradient Shadow */}
          <LinearGradient
            colors={shadowGradient as any}
            style={{
              position: 'absolute',
              top: 8,
              left: 4,
              right: 4,
              bottom: -8,
              borderRadius: 20,
              opacity: 0.3,
            }}
          />
          
          {/* Main Card */}
          <LinearGradient
            colors={gradient as any}
            style={{
              borderRadius: 20,
              padding: 20,
              minHeight: 160,
            }}
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold mb-1">
                  {item.displayName}
                </Text>
                <Text className="text-white/70 text-sm mb-2">
                  {item.description}
                </Text>
                <Text className="text-white/60 text-xs">
                  Tenant: {item.tenantId}
                </Text>
              </View>
              <TouchableOpacity className="w-6 h-6 rounded-full bg-white/20 items-center justify-center">
                <Ionicons name="ellipsis-vertical" size={12} color="#fff" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/70 text-sm">Fields</Text>
              <Text className="text-white font-medium">{fieldCount}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white/70 text-sm">Version</Text>
              <Text className="text-white font-medium">{item.version}</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#ffffff70" />
                <Text className="text-white/70 text-xs ml-1">
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View className={`px-2 py-1 rounded-full ${item.isActive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                <Text className={`text-xs font-medium ${item.isActive ? 'text-green-200' : 'text-red-200'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const AllFeatureItem = ({ item }: { item: any }) => {
    const handleItemPress = () => {
      if (item.route) {
        router.push(item.route);
      } else {
        console.log('Item pressed:', item.title);
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return 'bg-red-500/20 border-red-500/30';
        case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
        case 'low': return 'bg-green-500/20 border-green-500/30';
        default: return 'bg-gray-500/20 border-gray-500/30';
      }
    };

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleItemPress}
          className="bg-gray-800/50 rounded-2xl p-4 mb-3 border border-gray-700/50"
        >
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3">
                <Ionicons name={item.icon as any} size={20} color="#60A5FA" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-400 text-sm mb-1">{item.agency}</Text>
                <Text className="text-white text-base font-medium mb-1">
                  {item.title}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {item.description}
                </Text>
              </View>
            </View>
            <View className={`px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
              <Text className="text-xs font-medium text-white/70">
                {item.priority}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-2">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text className="text-gray-400 text-sm ml-2">{item.time}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text className="text-gray-400 text-sm ml-1">{item.members}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const BottomNavItem = ({ iconName, isActive, index, onPress }: { iconName: any; isActive: boolean; index: number; onPress: (index: number) => void }) => {
    const handlePress = () => {
      onPress(index);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        className="flex-1 items-center py-3"
      >
        <View className="items-center">
          <Ionicons 
            name={iconName} 
            size={24} 
            color={isActive ? "#4F46E5" : "#6B7280"} 
          />
          
          {isActive && (
            <View className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          onPress={() => router.push('/profile')}
          className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
        >
          <Ionicons name="person" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View className="flex-row space-x-4">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center ml-2">
            <Ionicons name="grid-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchSchemas}
            tintColor="#4F46E5"
            colors={['#4F46E5']}
          />
        }
      >
        {/* Greeting */}
        <View className="mb-6">
          <Text className="text-white text-lg mb-2">Welcome back, Developer</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <Text 
              className="text-2xl font-bold" 
              style={{ 
                color: '#00BFFF',
                textAlign: 'left',
                textShadowColor: '#00BFFF',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 30,
              }}
            >
              Build
            </Text>
            <Text 
              className="text-2xl font-bold" 
              style={{ 
                color: '#1E90FF',
                textAlign: 'left',
                textShadowColor: '#1E90FF',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {' '}your
            </Text>
            <Text 
              className="text-2xl font-bold" 
              style={{ 
                color: '#4169E1',
                textAlign: 'left',
                textShadowColor: '#4169E1',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {' '}backend
            </Text>
            <Text 
              className="text-2xl font-bold" 
              style={{ 
                color: '#6A5ACD',
                textAlign: 'left',
                textShadowColor: '#6A5ACD',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              {' '}instantly.
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-700">
          <View className="flex-row items-center">
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <Text className="text-gray-500 ml-3">Search schemas and features</Text>
          </View>
        </View>

        {/* User Schemas */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">
              Your Schemas ({schemas.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/schema-generator')}>
              <Text className="text-blue-500 text-sm">+ Create Schema</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
              <Text className="text-white text-lg mb-2">Loading schemas...</Text>
              <Text className="text-gray-400 text-sm">Fetching your schema data</Text>
            </View>
          ) : error ? (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text className="text-red-400 text-lg mb-2 mt-4">Failed to load schemas</Text>
              <Text className="text-gray-400 text-sm text-center mb-4">{error}</Text>
              <TouchableOpacity 
                onPress={fetchSchemas}
                className="bg-blue-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : schemas.length === 0 ? (
            <View className="bg-gray-800/50 rounded-2xl p-8 items-center">
              <Ionicons name="library-outline" size={48} color="#6B7280" />
              <Text className="text-white text-lg mb-2 mt-4">No schemas found</Text>
              <Text className="text-gray-400 text-sm text-center mb-4">
                Create your first schema to get started with dynamic data management
              </Text>
              <TouchableOpacity 
                onPress={() => router.push('/schema-generator')}
                className="bg-blue-600 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Create Schema</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              decelerationRate="fast"
              snapToInterval={screenWidth * 0.65 + 16}
              snapToAlignment="start"
              className='overflow-visible'
            >
              {schemas.map((item, index) => (
                <SchemaCard key={item._id} item={item} index={index} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* All Features */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-lg font-semibold">All Features</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">+ New Feature</Text>
            </TouchableOpacity>
          </View>

          {allFeatures.map((item) => (
            <AllFeatureItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0">
        <View
          
          style={{
            borderRadius: 25,
            marginHorizontal: 20,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <View className="bg-gray-900/70 rounded-3xl px-6 py-2 backdrop-blur-xl align-left w-[80%] border border-gray-800/50">
            <View className="flex-row items-center">
              <BottomNavItem
                iconName="home"
                isActive={activeTab === 0}
                index={0}
                onPress={setActiveTab}
              />
              <BottomNavItem
                iconName="library-outline"
                isActive={activeTab === 1}
                index={1}
                onPress={(index) => {
                  setActiveTab(index);
                  if (index === 1) {
                    router.push('/schema-management');
                  }
                }}
              />
              <BottomNavItem
                iconName="server-outline"
                isActive={activeTab === 2}
                index={2}
                onPress={(index) => {
                  setActiveTab(index);
                  if (index === 2) {
                    router.push('/data-management');
                  }
                }}
              />
              <BottomNavItem
                iconName="person-outline"
                isActive={activeTab === 3}
                index={3}
                onPress={(index) => {
                  setActiveTab(index);
                  if (index === 3) {
                    router.push('/profile');
                  }
                }}
              />
            </View>
          </View>
        </View>

        {/* Floating Action Button */}
        <View className="absolute bottom-8 right-8">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleFabPress}
            className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
            style={{
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="add-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </ImageBackground>
  );
};

export default MenuScreen;