import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ImageBackground,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AuditTrailScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSchema, setSelectedSchema] = useState('product');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock audit data based on API responses
  const auditLogs = [
    {
      _id: "68d8ff661b79091dc833e3f1",
      documentId: "68d8ff661b79091dc833e3f6",
      schemaName: "product",
      operation: "CREATE",
      userId: "68aa266d02d452e89f6185a4",
      username: "admin",
      changes: {
        before: null,
        after: {
          name: "iPhone 15 Pro",
          price: 999,
          category: "Electronics",
          inStock: true
        }
      },
      timestamp: "2025-09-28T09:27:02.049Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      metadata: {
        reason: "Product creation"
      }
    },
    {
      _id: "68d8ff661b79091dc833e3f2",
      documentId: "68d8ff661b79091dc833e3f6",
      schemaName: "product",
      operation: "UPDATE",
      userId: "68aa266d02d452e89f6185a4",
      username: "admin",
      changes: {
        before: {
          name: "iPhone 15 Pro",
          price: 999,
          category: "Electronics",
          inStock: true
        },
        after: {
          name: "iPhone 15 Pro",
          price: 1099,
          category: "Electronics",
          inStock: true
        }
      },
      timestamp: "2025-09-28T10:15:30.123Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      metadata: {
        reason: "Price update"
      }
    },
    {
      _id: "68d8ff661b79091dc833e3f3",
      documentId: "68d8ff661b79091dc833e3f7",
      schemaName: "product",
      operation: "CREATE",
      userId: "68aa266d02d452e89f6185a4",
      username: "admin",
      changes: {
        before: null,
        after: {
          name: "MacBook Pro",
          price: 1999,
          category: "Electronics",
          inStock: false
        }
      },
      timestamp: "2025-09-28T08:15:30.123Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      metadata: {
        reason: "Product creation"
      }
    },
    {
      _id: "68d8ff661b79091dc833e3f4",
      documentId: "68d8ff661b79091dc833e3f8",
      schemaName: "product",
      operation: "DELETE",
      userId: "68aa266d02d452e89f6185a4",
      username: "admin",
      changes: {
        before: {
          name: "AirPods Pro",
          price: 249,
          category: "Accessories",
          inStock: true
        },
        after: null
      },
      timestamp: "2025-09-28T07:45:15.456Z",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0...",
      metadata: {
        reason: "Product discontinued"
      }
    }
  ];

  const schemas = [
    { name: 'product', displayName: 'Product', recordCount: 3 },
    { name: 'customer', displayName: 'Customer', recordCount: 5 },
    { name: 'order', displayName: 'Order', recordCount: 2 },
    { name: 'invoice', displayName: 'Invoice', recordCount: 1 }
  ];

  const filteredLogs = auditLogs.filter(log =>
    log.schemaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRevert = (log: any) => {
    Alert.alert(
      'Revert Changes',
      `Are you sure you want to revert the ${log.operation.toLowerCase()} operation on ${log.schemaName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revert', 
          style: 'destructive',
          onPress: () => console.log('Revert operation:', log._id)
        }
      ]
    );
  };

  const handleViewChanges = (log: any) => {
    Alert.alert(
      'View Changes',
      'Show detailed changes modal',
      [
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE': return '#059669';
      case 'UPDATE': return '#EA580C';
      case 'DELETE': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE': return 'add-circle-outline';
      case 'UPDATE': return 'pencil-outline';
      case 'DELETE': return 'trash-outline';
      default: return 'ellipse-outline';
    }
  };

  const AuditLogCard = ({ log, index }: { log: any; index: number }) => {
    const gradients = [
      ['#4F46E5', '#7C3AED'],
      ['#7C3AED', '#EC4899'],
      ['#059669', '#0891B2'],
      ['#DC2626', '#EA580C'],
      ['#7C2D12', '#92400E']
    ];
    const gradient = gradients[index % gradients.length];
    const operationColor = getOperationColor(log.operation);

    return (
      <View className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700/50">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: operationColor + '20' }}
              >
                <Ionicons 
                  name={getOperationIcon(log.operation) as any} 
                  size={16} 
                  color={operationColor} 
                />
              </View>
              <View>
                <Text className="text-white font-semibold capitalize">
                  {log.operation.toLowerCase()} Operation
                </Text>
                <Text className="text-gray-400 text-sm">
                  {log.schemaName} • {log.username}
                </Text>
              </View>
            </View>
            
            {log.changes.after && (
              <View className="bg-green-500/10 rounded-lg p-3 mb-2">
                <Text className="text-green-400 text-xs font-medium mb-1">After</Text>
                <Text className="text-white text-sm">
                  {typeof log.changes.after === 'object' 
                    ? JSON.stringify(log.changes.after, null, 2).substring(0, 100) + '...'
                    : log.changes.after
                  }
                </Text>
              </View>
            )}
            
            {log.changes.before && (
              <View className="bg-red-500/10 rounded-lg p-3 mb-2">
                <Text className="text-red-400 text-xs font-medium mb-1">Before</Text>
                <Text className="text-white text-sm">
                  {typeof log.changes.before === 'object' 
                    ? JSON.stringify(log.changes.before, null, 2).substring(0, 100) + '...'
                    : log.changes.before
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              {formatDate(log.timestamp)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="globe-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">{log.ipAddress}</Text>
          </View>
        </View>

        {log.metadata?.reason && (
          <View className="bg-gray-700/30 rounded-lg p-2 mb-3">
            <Text className="text-gray-300 text-xs">
              <Text className="font-medium">Reason: </Text>
              {log.metadata.reason}
            </Text>
          </View>
        )}

        <View className="flex-row space-x-2">
          <TouchableOpacity 
            onPress={() => handleViewChanges(log)}
            className="flex-1 bg-blue-500/20 py-2 px-4 rounded-lg"
          >
            <Text className="text-blue-400 text-center text-sm font-medium">View Details</Text>
          </TouchableOpacity>
          {(log.operation === 'UPDATE' || log.operation === 'DELETE') && (
            <TouchableOpacity 
              onPress={() => handleRevert(log)}
              className="flex-1 bg-orange-500/20 py-2 px-4 rounded-lg"
            >
              <Text className="text-orange-400 text-center text-sm font-medium">Revert</Text>
            </TouchableOpacity>
          )}
        </View>
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

  const SchemaSelector = () => (
    <View className="mb-6">
      <Text className="text-white font-medium mb-3">Filter by Schema</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row space-x-3">
          {schemas.map((schema) => (
            <TouchableOpacity
              key={schema.name}
              onPress={() => setSelectedSchema(schema.name)}
              className={`px-4 py-3 rounded-xl border ${
                selectedSchema === schema.name 
                  ? 'bg-blue-600 border-blue-500' 
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <Text className={`font-medium ${selectedSchema === schema.name ? 'text-white' : 'text-gray-400'}`}>
                {schema.displayName}
              </Text>
              <Text className={`text-xs ${selectedSchema === schema.name ? 'text-blue-200' : 'text-gray-500'}`}>
                {schema.recordCount} records
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
          
          <Text className="text-white text-lg font-semibold">Audit Trail</Text>
          
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <SchemaSelector />

          {/* Search Bar */}
          <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-700">
            <View className="flex-row items-center">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 text-white ml-3"
                placeholder="Search audit logs..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="All Operations" index={0} onPress={setActiveTab} />
              <TabButton title="Creates" index={1} onPress={setActiveTab} />
              <TabButton title="Updates" index={2} onPress={setActiveTab} />
              <TabButton title="Deletes" index={3} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {/* Audit Stats */}
          <View className="flex-row justify-between mb-6 space-x-3">
            <StatsCard
              title="Total Operations"
              value={auditLogs.length}
              color="#4F46E5"
              icon="list-outline"
            />
            <StatsCard
              title="Creates"
              value={auditLogs.filter(l => l.operation === 'CREATE').length}
              color="#059669"
              icon="add-circle-outline"
            />
            <StatsCard
              title="Updates"
              value={auditLogs.filter(l => l.operation === 'UPDATE').length}
              color="#EA580C"
              icon="pencil-outline"
            />
            <StatsCard
              title="Deletes"
              value={auditLogs.filter(l => l.operation === 'DELETE').length}
              color="#DC2626"
              icon="trash-outline"
            />
          </View>

          {/* Audit Logs */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">Recent Activity</Text>
              <Text className="text-gray-400 text-sm">
                {filteredLogs.length} operations
              </Text>
            </View>

            {filteredLogs.length === 0 ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
                <Ionicons name="time-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">No audit logs found</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  {searchQuery ? 'Try adjusting your search terms' : 'Activity will appear here as you make changes'}
                </Text>
              </View>
            ) : (
              filteredLogs.map((log, index) => (
                <AuditLogCard key={log._id} log={log} index={index} />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default AuditTrailScreen;

