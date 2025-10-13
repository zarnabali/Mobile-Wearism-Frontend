import React, { useState, useEffect } from 'react';
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

interface AuditLog {
  _id: string;
  documentId: string;
  schemaName: string;
  operation: string;
  changes: any;
  userId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata: any;
}

const AuditScreen = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string>('all');
  const [selectedOperation, setSelectedOperation] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    loadAuditLogs();
  }, [selectedSchema, selectedOperation]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const token = await getStoredToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      let url = 'http://localhost:3000/api/audit/schema/all';
      const params = new URLSearchParams();
      
      if (selectedSchema !== 'all') {
        url = `http://localhost:3000/api/audit/schema/${selectedSchema}`;
      }
      
      if (selectedOperation !== 'all') {
        params.append('operation', selectedOperation);
      }
      
      params.append('page', '1');
      params.append('limit', '50');

      const response = await fetch(`${url}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data?.auditLogs || []);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAuditLogs();
    setRefreshing(false);
  };

  const getStoredToken = async () => {
    // Implement token storage retrieval
    return null;
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'CREATE': return '#059669';
      case 'UPDATE': return '#F59E0B';
      case 'DELETE': return '#DC2626';
      case 'READ': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'CREATE': return 'add-circle';
      case 'UPDATE': return 'create';
      case 'DELETE': return 'trash';
      case 'READ': return 'eye';
      default: return 'document';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const AuditLogCard = ({ log }: { log: AuditLog }) => {
    return (
      <View className="bg-gray-900/50 rounded-2xl p-4 mb-3 border border-gray-700/50">
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View 
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: getOperationColor(log.operation) + '20' }}
            >
              <Ionicons 
                name={getOperationIcon(log.operation) as any} 
                size={16} 
                color={getOperationColor(log.operation)} 
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-medium text-base">
                {log.operation} - {log.schemaName}
              </Text>
              <Text className="text-gray-400 text-sm">
                Document ID: {log.documentId}
              </Text>
            </View>
          </View>
          <Text className="text-gray-500 text-xs">
            {formatTimestamp(log.timestamp)}
          </Text>
        </View>

        <View className="border-t border-gray-700/50 pt-3">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-400 text-sm">User ID</Text>
            <Text className="text-white text-sm">{log.userId}</Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-400 text-sm">IP Address</Text>
            <Text className="text-white text-sm">{log.ipAddress}</Text>
          </View>
          {log.metadata?.reason && (
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400 text-sm">Reason</Text>
              <Text className="text-white text-sm">{log.metadata.reason}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const FilterButton = ({ 
    title, 
    isActive, 
    onPress 
  }: { 
    title: string; 
    isActive: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 ${
        isActive ? 'bg-blue-600' : 'bg-gray-800'
      }`}
    >
      <Text className={`text-sm font-medium ${
        isActive ? 'text-white' : 'text-gray-400'
      }`}>
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
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          
          <Text className="text-white text-lg font-semibold">Audit Trail</Text>
          
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="download-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
        >
          {/* Stats Cards */}
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 mr-2">
              <View className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
                <Text className="text-gray-400 text-sm mb-1">Total Logs</Text>
                <Text className="text-white text-2xl font-bold">{auditLogs.length}</Text>
              </View>
            </View>
            <View className="flex-1 ml-2">
              <View className="bg-gray-900/50 rounded-2xl p-4 border border-gray-700/50">
                <Text className="text-gray-400 text-sm mb-1">Today</Text>
                <Text className="text-white text-2xl font-bold">
                  {auditLogs.filter(log => {
                    const today = new Date();
                    const logDate = new Date(log.timestamp);
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </Text>
              </View>
            </View>
          </View>

          {/* Filters */}
          <View className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">Filters</Text>
            
            <View className="mb-4">
              <Text className="text-gray-400 text-sm mb-2">Schema</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterButton
                  title="All"
                  isActive={selectedSchema === 'all'}
                  onPress={() => setSelectedSchema('all')}
                />
                <FilterButton
                  title="Products"
                  isActive={selectedSchema === 'products'}
                  onPress={() => setSelectedSchema('products')}
                />
                <FilterButton
                  title="Users"
                  isActive={selectedSchema === 'users'}
                  onPress={() => setSelectedSchema('users')}
                />
              </ScrollView>
            </View>

            <View>
              <Text className="text-gray-400 text-sm mb-2">Operation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterButton
                  title="All"
                  isActive={selectedOperation === 'all'}
                  onPress={() => setSelectedOperation('all')}
                />
                <FilterButton
                  title="CREATE"
                  isActive={selectedOperation === 'CREATE'}
                  onPress={() => setSelectedOperation('CREATE')}
                />
                <FilterButton
                  title="UPDATE"
                  isActive={selectedOperation === 'UPDATE'}
                  onPress={() => setSelectedOperation('UPDATE')}
                />
                <FilterButton
                  title="DELETE"
                  isActive={selectedOperation === 'DELETE'}
                  onPress={() => setSelectedOperation('DELETE')}
                />
              </ScrollView>
            </View>
          </View>

          {/* Audit Logs */}
          {loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-white text-lg">Loading audit logs...</Text>
            </View>
          ) : auditLogs.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="time-outline" size={64} color="#6B7280" />
              <Text className="text-white text-lg font-semibold mt-4">No Audit Logs</Text>
              <Text className="text-gray-400 text-sm text-center mt-2">
                No audit logs found for the selected filters
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-white text-lg font-semibold mb-4">Recent Activity</Text>
              {auditLogs.map((log) => (
                <AuditLogCard key={log._id} log={log} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default AuditScreen;
