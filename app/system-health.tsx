import React, { useState } from 'react';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SystemHealthScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Mock system data based on API responses
  const systemInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Toolvio Dynamic Backend',
    version: '1.0.0',
    environment: 'development',
    uptime: 86400, // 24 hours in seconds
    memory: {
      heapTotal: 67108864,
      heapUsed: 33554432,
      external: 16777216,
      rss: 83886080
    },
    database: {
      status: 'connected',
      host: 'localhost:27017',
      name: 'toolvio_db'
    }
  };

  const databaseStats = {
    database: {
      name: 'toolvio_db',
      collections: 15,
      dataSize: 1048576,
      storageSize: 2097152,
      indexes: 25,
      indexSize: 524288
    },
    collections: 15,
    schemas: {
      total: 8,
      active: 7
    },
    dynamicModels: {
      count: 12,
      models: [
        { name: 'product', collectionName: 'dynamic_product', documentCount: 150 },
        { name: 'customer', collectionName: 'dynamic_customer', documentCount: 89 },
        { name: 'order', collectionName: 'dynamic_order', documentCount: 234 },
        { name: 'invoice', collectionName: 'dynamic_invoice', documentCount: 67 }
      ]
    },
    connection: {
      host: 'localhost',
      port: 27017,
      name: 'toolvio_db',
      readyState: 1
    }
  };

  const apiStats = {
    endpoints: {
      schemas: {
        base: '/api/schemas',
        operations: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      data: {
        base: '/api/data',
        operations: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      },
      system: {
        base: '/health',
        operations: ['GET']
      }
    },
    features: [
      'Dynamic schema creation',
      'JSON Schema validation',
      'Dynamic CRUD operations',
      'Hot schema reloading',
      'Bulk operations',
      'Search and filtering',
      'Pagination',
      'Error handling'
    ],
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'OK':
        return '#059669';
      case 'disconnected':
        return '#DC2626';
      default:
        return '#6B7280';
    }
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

  const MetricCard = ({ title, value, subtitle, color, icon }: { 
    title: string; value: string; subtitle?: string; color: string; icon: string 
  }) => (
    <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: color + '20' }}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
        <Text className="text-white text-xl font-bold">{value}</Text>
      </View>
      <Text className="text-white font-medium mb-1">{title}</Text>
      {subtitle && <Text className="text-gray-400 text-sm">{subtitle}</Text>}
    </View>
  );

  const StatusIndicator = ({ label, status, details }: { 
    label: string; status: string; details?: string 
  }) => {
    const statusColor = getStatusColor(status);
    
    return (
      <View className="flex-row justify-between items-center py-3">
        <Text className="text-gray-400">{label}</Text>
        <View className="flex-row items-center">
          <View 
            className="w-2 h-2 rounded-full mr-2"
            style={{ backgroundColor: statusColor }}
          />
          <Text className="text-white text-sm font-medium capitalize">{status}</Text>
          {details && <Text className="text-gray-400 text-sm ml-2">({details})</Text>}
        </View>
      </View>
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
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">System Health</Text>
          
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="settings-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="Overview" index={0} onPress={setActiveTab} />
              <TabButton title="Database" index={1} onPress={setActiveTab} />
              <TabButton title="API" index={2} onPress={setActiveTab} />
              <TabButton title="Performance" index={3} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {activeTab === 0 && (
            <View>
              {/* System Status */}
              <LinearGradient
                colors={['#059669', '#0891B2']}
                style={{ borderRadius: 16, padding: 16, marginBottom: 20 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-white text-xl font-semibold">System Status</Text>
                    <Text className="text-white/70 text-sm">{systemInfo.service}</Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-green-500/30 px-3 py-1 rounded-full mb-2">
                      <Text className="text-green-200 text-sm font-medium uppercase">
                        {systemInfo.status}
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">
                      v{systemInfo.version}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={16} color="#ffffff70" />
                    <Text className="text-white/70 text-sm ml-2">
                      Uptime: {formatUptime(systemInfo.uptime)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="server-outline" size={16} color="#ffffff70" />
                    <Text className="text-white/70 text-sm ml-2 capitalize">
                      {systemInfo.environment}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Key Metrics */}
              <View className="grid grid-cols-2 gap-4 mb-6">
                <MetricCard
                  title="Memory Usage"
                  value={formatBytes(systemInfo.memory.heapUsed)}
                  subtitle={`of ${formatBytes(systemInfo.memory.heapTotal)}`}
                  color="#4F46E5"
                  icon="hardware-chip-outline"
                />
                <MetricCard
                  title="Active Schemas"
                  value={databaseStats.schemas.active.toString()}
                  subtitle={`of ${databaseStats.schemas.total}`}
                  color="#059669"
                  icon="library-outline"
                />
                <MetricCard
                  title="Collections"
                  value={databaseStats.collections.toString()}
                  subtitle="Total collections"
                  color="#EA580C"
                  icon="folder-outline"
                />
                <MetricCard
                  title="Dynamic Models"
                  value={databaseStats.dynamicModels.count.toString()}
                  subtitle="Active models"
                  color="#7C3AED"
                  icon="cube-outline"
                />
              </View>

              {/* System Health Checks */}
              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Text className="text-white font-semibold mb-4">Health Checks</Text>
                <View className="divide-y divide-gray-700">
                  <StatusIndicator 
                    label="Database Connection" 
                    status={systemInfo.database.status}
                    details={systemInfo.database.host}
                  />
                  <StatusIndicator 
                    label="API Server" 
                    status="OK"
                    details="Port 3000"
                  />
                  <StatusIndicator 
                    label="Memory Usage" 
                    status="Healthy"
                    details={`${Math.round((systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100)}%`}
                  />
                  <StatusIndicator 
                    label="Disk Space" 
                    status="Available"
                    details="75% free"
                  />
                </View>
              </View>
            </View>
          )}

          {activeTab === 1 && (
            <View>
              {/* Database Overview */}
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={{ borderRadius: 16, padding: 16, marginBottom: 20 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-white text-xl font-semibold">Database Status</Text>
                    <Text className="text-white/70 text-sm">{databaseStats.database.name}</Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-green-500/30 px-3 py-1 rounded-full mb-2">
                      <Text className="text-green-200 text-sm font-medium">
                        Connected
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">
                      {databaseStats.connection.host}:{databaseStats.connection.port}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Database Metrics */}
              <View className="grid grid-cols-2 gap-4 mb-6">
                <MetricCard
                  title="Data Size"
                  value={formatBytes(databaseStats.database.dataSize)}
                  subtitle="Total data"
                  color="#059669"
                  icon="server-outline"
                />
                <MetricCard
                  title="Storage Size"
                  value={formatBytes(databaseStats.database.storageSize)}
                  subtitle="Allocated space"
                  color="#EA580C"
                  icon="hardware-chip-outline"
                />
                <MetricCard
                  title="Indexes"
                  value={databaseStats.database.indexes.toString()}
                  subtitle="Total indexes"
                  color="#7C3AED"
                  icon="list-outline"
                />
                <MetricCard
                  title="Index Size"
                  value={formatBytes(databaseStats.database.indexSize)}
                  subtitle="Index storage"
                  color="#DC2626"
                  icon="bookmark-outline"
                />
              </View>

              {/* Dynamic Models */}
              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Text className="text-white font-semibold mb-4">Dynamic Models</Text>
                {databaseStats.dynamicModels.models.map((model, index) => (
                  <View key={model.name} className="flex-row justify-between items-center py-2">
                    <View>
                      <Text className="text-white font-medium capitalize">{model.name}</Text>
                      <Text className="text-gray-400 text-sm">{model.collectionName}</Text>
                    </View>
                    <Text className="text-gray-400 text-sm">{model.documentCount} docs</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 2 && (
            <View>
              {/* API Overview */}
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                style={{ borderRadius: 16, padding: 16, marginBottom: 20 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-white text-xl font-semibold">API Status</Text>
                    <Text className="text-white/70 text-sm">Toolvio Backend API</Text>
                  </View>
                  <View className="items-end">
                    <View className="bg-green-500/30 px-3 py-1 rounded-full mb-2">
                      <Text className="text-green-200 text-sm font-medium">
                        Operational
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">
                      v{apiStats.version}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* API Endpoints */}
              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 mb-6">
                <Text className="text-white font-semibold mb-4">Available Endpoints</Text>
                {Object.entries(apiStats.endpoints).map(([name, endpoint]) => (
                  <View key={name} className="py-3 border-b border-gray-700 last:border-b-0">
                    <Text className="text-white font-medium capitalize mb-2">{name}</Text>
                    <Text className="text-gray-400 text-sm mb-2">{endpoint.base}</Text>
                    <View className="flex-row flex-wrap">
                      {endpoint.operations.map((operation) => (
                        <View key={operation} className="bg-blue-500/20 px-2 py-1 rounded mr-2 mb-1">
                          <Text className="text-blue-400 text-xs font-medium">{operation}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              {/* Features */}
              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Text className="text-white font-semibold mb-4">API Features</Text>
                <View className="flex-row flex-wrap">
                  {apiStats.features.map((feature) => (
                    <View key={feature} className="bg-green-500/20 px-3 py-2 rounded-full mr-2 mb-2">
                      <Text className="text-green-400 text-sm font-medium">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 3 && (
            <View>
              {/* Performance Metrics */}
              <View className="grid grid-cols-2 gap-4 mb-6">
                <MetricCard
                  title="Response Time"
                  value="45ms"
                  subtitle="Average"
                  color="#059669"
                  icon="speedometer-outline"
                />
                <MetricCard
                  title="Requests/min"
                  value="1,234"
                  subtitle="Current rate"
                  color="#4F46E5"
                  icon="pulse-outline"
                />
                <MetricCard
                  title="Error Rate"
                  value="0.2%"
                  subtitle="Last 24h"
                  color="#EA580C"
                  icon="warning-outline"
                />
                <MetricCard
                  title="CPU Usage"
                  value="35%"
                  subtitle="Current"
                  color="#7C3AED"
                  icon="hardware-chip-outline"
                />
              </View>

              {/* Performance History */}
              <View className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <Text className="text-white font-semibold mb-4">Performance History</Text>
                <View className="space-y-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Last 1 hour</Text>
                    <Text className="text-white">1,234 requests</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Last 24 hours</Text>
                    <Text className="text-white">28,456 requests</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Last 7 days</Text>
                    <Text className="text-white">198,234 requests</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-400">Peak requests/min</Text>
                    <Text className="text-white">2,456</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default SystemHealthScreen;

