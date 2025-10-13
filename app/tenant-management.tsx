import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TenantManagementScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock tenant data based on API responses
  const tenants = [
    {
      _id: "68aa266d02d452e89f6185a0",
      tenantId: "test-tenant",
      name: "Test Company",
      displayName: "Test Company Inc.",
      description: "Test tenant for development",
      contactEmail: "admin@testcompany.com",
      contactPhone: "+1234567890",
      subscriptionPlan: "professional",
      subscriptionStatus: "trial",
      isActive: true,
      settings: {
        features: {
          auditTrail: true,
          changeStreams: true,
          offlineSync: true,
          apiRateLimit: true
        },
        maxUsers: 100,
        maxSchemas: 50,
        maxStorageGB: 10
      },
      usage: {
        userCount: 2,
        schemaCount: 0,
        storageUsedGB: 0,
        apiCallsThisMonth: 0
      },
      createdAt: "2025-08-23T20:37:01.627Z"
    },
    {
      _id: "68aa266d02d452e89f6185a1",
      tenantId: "demo-company",
      name: "Demo Company",
      displayName: "Demo Company LLC",
      description: "Demo tenant for testing",
      contactEmail: "demo@demo.com",
      contactPhone: "+1987654321",
      subscriptionPlan: "basic",
      subscriptionStatus: "active",
      isActive: true,
      settings: {
        features: {
          auditTrail: false,
          changeStreams: true,
          offlineSync: false,
          apiRateLimit: true
        },
        maxUsers: 50,
        maxSchemas: 25,
        maxStorageGB: 5
      },
      usage: {
        userCount: 5,
        schemaCount: 3,
        storageUsedGB: 1.2,
        apiCallsThisMonth: 150
      },
      createdAt: "2025-09-15T14:20:30.456Z"
    },
    {
      _id: "68aa266d02d452e89f6185a2",
      tenantId: "enterprise-corp",
      name: "Enterprise Corp",
      displayName: "Enterprise Corporation",
      description: "Enterprise tenant with full features",
      contactEmail: "admin@enterprise.com",
      contactPhone: "+1555666777",
      subscriptionPlan: "enterprise",
      subscriptionStatus: "active",
      isActive: false,
      settings: {
        features: {
          auditTrail: true,
          changeStreams: true,
          offlineSync: true,
          apiRateLimit: true
        },
        maxUsers: 500,
        maxSchemas: 200,
        maxStorageGB: 100
      },
      usage: {
        userCount: 45,
        schemaCount: 12,
        storageUsedGB: 15.8,
        apiCallsThisMonth: 2500
      },
      createdAt: "2025-09-01T09:15:45.789Z"
    }
  ];

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = () => {
    setShowCreateModal(true);
  };

  const handleEditTenant = (tenant: any) => {
    Alert.alert('Edit Tenant', `Edit ${tenant.displayName}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => console.log('Edit tenant:', tenant.tenantId) }
    ]);
  };

  const handleToggleTenantStatus = (tenant: any) => {
    const action = tenant.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Tenant`,
      `Are you sure you want to ${action} "${tenant.displayName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          style: tenant.isActive ? 'destructive' : 'default',
          onPress: () => console.log(`${action} tenant:`, tenant.tenantId)
        }
      ]
    );
  };

  const handleDeleteTenant = (tenant: any) => {
    Alert.alert(
      'Delete Tenant',
      `Are you sure you want to delete "${tenant.displayName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete tenant:', tenant.tenantId)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: '2-digit'
    });
  };

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return ['#4F46E5', '#7C3AED'];
      case 'professional': return ['#7C3AED', '#EC4899'];
      case 'basic': return ['#059669', '#0891B2'];
      case 'trial': return ['#DC2626', '#EA580C'];
      default: return ['#6B7280', '#9CA3AF'];
    }
  };

  const TenantCard = ({ tenant, index }: { tenant: any; index: number }) => {
    const subscriptionGradient = getSubscriptionColor(tenant.subscriptionPlan);

    return (
      <TouchableOpacity
        className="mb-4"
        activeOpacity={0.9}
        onPress={() => handleEditTenant(tenant)}
      >
        <LinearGradient
          colors={subscriptionGradient as any}
          style={{ borderRadius: 16, padding: 16 }}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                {tenant.displayName}
              </Text>
              <Text className="text-white/70 text-sm mb-2">
                {tenant.description}
              </Text>
              <Text className="text-white/60 text-xs">
                ID: {tenant.tenantId}
              </Text>
            </View>
            <View className="flex-row space-x-2">
              <TouchableOpacity 
                onPress={() => handleToggleTenantStatus(tenant)}
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  tenant.isActive ? 'bg-red-500/20' : 'bg-green-500/20'
                }`}
              >
                <Ionicons 
                  name={tenant.isActive ? 'pause' : 'play'} 
                  size={14} 
                  color={tenant.isActive ? '#ef4444' : '#10b981'} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteTenant(tenant)}
                className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="business-outline" size={16} color="#ffffff70" />
              <Text className="text-white/70 text-sm ml-1 capitalize">
                {tenant.subscriptionPlan} • {tenant.subscriptionStatus}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${tenant.isActive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              <Text className={`text-xs font-medium ${tenant.isActive ? 'text-green-200' : 'text-red-200'}`}>
                {tenant.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View className="grid grid-cols-3 gap-2 mb-3">
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-sm font-bold">{tenant.usage.userCount}</Text>
              <Text className="text-white/70 text-xs">Users</Text>
            </View>
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-sm font-bold">{tenant.usage.schemaCount}</Text>
              <Text className="text-white/70 text-xs">Schemas</Text>
            </View>
            <View className="bg-white/10 rounded-lg p-2">
              <Text className="text-white text-sm font-bold">{tenant.usage.storageUsedGB}GB</Text>
              <Text className="text-white/70 text-xs">Storage</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#ffffff70" />
              <Text className="text-white/70 text-xs ml-1">
                Created {formatDate(tenant.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={14} color="#ffffff70" />
              <Text className="text-white/70 text-xs ml-1">{tenant.contactEmail}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
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

  const StatsCard = ({ title, value, color, icon }: { 
    title: string; value: number; color: string; icon: string 
  }) => (
    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text className="text-white text-2xl font-bold">{value}</Text>
      </View>
      <Text className="text-gray-400 text-sm">{title}</Text>
    </View>
  );

  const CreateTenantModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text className="text-blue-500 text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Create Tenant</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-lg font-semibold">Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="space-y-6">
            <View>
              <Text className="text-white font-medium mb-2">Tenant Name</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter tenant name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Display Name</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter display name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Description</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Contact Email</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter contact email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Contact Phone</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter contact phone"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-3">Subscription Plan</Text>
              <View className="space-y-2">
                {['trial', 'basic', 'professional', 'enterprise'].map((plan) => (
                  <TouchableOpacity key={plan} className="flex-row items-center py-3">
                    <View className="w-5 h-5 rounded border border-gray-600 mr-3" />
                    <Text className="text-gray-400 capitalize">{plan}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-white font-medium mb-3">Admin User Details</Text>
              <View className="space-y-4">
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Admin username"
                  placeholderTextColor="#6B7280"
                />
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Admin email"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                />
                <TextInput
                  className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Admin password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
          
          <Text className="text-white text-lg font-semibold">Tenant Management</Text>
          
          <TouchableOpacity 
            onPress={handleCreateTenant}
            className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Search Bar */}
          <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-700">
            <View className="flex-row items-center">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 text-white ml-3"
                placeholder="Search tenants..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="All Tenants" index={0} onPress={setActiveTab} />
              <TabButton title="Active" index={1} onPress={setActiveTab} />
              <TabButton title="Inactive" index={2} onPress={setActiveTab} />
              <TabButton title="Trial" index={3} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {/* Tenant Stats */}
          <View className="flex-row justify-between mb-6 space-x-3">
            <StatsCard
              title="Total Tenants"
              value={tenants.length}
              color="#4F46E5"
              icon="business-outline"
            />
            <StatsCard
              title="Active Tenants"
              value={tenants.filter(t => t.isActive).length}
              color="#059669"
              icon="checkmark-circle-outline"
            />
            <StatsCard
              title="Trial Tenants"
              value={tenants.filter(t => t.subscriptionPlan === 'trial').length}
              color="#EA580C"
              icon="time-outline"
            />
            <StatsCard
              title="Total Users"
              value={tenants.reduce((sum, t) => sum + t.usage.userCount, 0)}
              color="#7C3AED"
              icon="people-outline"
            />
          </View>

          {/* Tenant List */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                {activeTab === 0 ? 'All Tenants' : 
                 activeTab === 1 ? 'Active Tenants' : 
                 activeTab === 2 ? 'Inactive Tenants' : 'Trial Tenants'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {filteredTenants.length} tenants
              </Text>
            </View>

            {filteredTenants.length === 0 ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
                <Ionicons name="business-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">No tenants found</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first tenant to get started'}
                </Text>
              </View>
            ) : (
              filteredTenants.map((tenant, index) => (
                <TenantCard key={tenant._id} tenant={tenant} index={index} />
              ))
            )}
          </View>
        </ScrollView>

        <CreateTenantModal />
      </View>
    </ImageBackground>
  );
};

export default TenantManagementScreen;

