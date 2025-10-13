import React, { useState, useRef, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SchemaApi, Schema } from '../src/utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SchemaManagementScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const filteredSchemas = schemas.filter(schema => {
    // Filter by search query
    const matchesSearch = schema.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schema.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by active tab
    let matchesTab = true;
    if (activeTab === 1) { // Active tab
      matchesTab = schema.isActive;
    } else if (activeTab === 2) { // Inactive tab
      matchesTab = !schema.isActive;
    }
    
    return matchesSearch && matchesTab;
  });

  const handleCreateSchema = () => {
    router.push('/schema-generator');
  };

  const handleSchemaPress = (schema: any) => {
    router.push(`/schema-detail?schemaName=${schema.name}`);
  };

  const handleEditSchema = (schema: any) => {
    // Navigate to edit schema page
    console.log('Edit schema:', schema.name);
  };

  const handleDeleteSchema = (schema: any) => {
    Alert.alert(
      "Delete Schema",
      `Are you sure you want to delete "${schema.displayName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => console.log('Delete schema:', schema.name)
        }
      ]
    );
  };

  const getFieldCount = (jsonSchema: any) => {
    return Object.keys(jsonSchema?.properties || {}).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: '2-digit'
    });
  };

  const getGradientColors = (index: number) => {
    const gradients = [
      ['#4F46E5', '#7C3AED'],
      ['#7C3AED', '#EC4899'],
      ['#059669', '#0891B2'],
      ['#DC2626', '#EA580C'],
      ['#7C2D12', '#92400E'],
      ['#1E40AF', '#3B82F6'],
      ['#7C3AED', '#A855F7']
    ];
    return gradients[index % gradients.length];
  };

  const SchemaCard = ({ schema, index }: { schema: Schema; index: number }) => {
    const fieldCount = getFieldCount(schema.jsonSchema);
    const gradient = getGradientColors(index);

    return (
      <TouchableOpacity
        onPress={() => handleSchemaPress(schema)}
        className="mb-4"
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradient as any}
          style={{ borderRadius: 16, padding: 16 }}
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                {schema.displayName}
              </Text>
              <Text className="text-white/70 text-sm mb-2">
                {schema.description}
              </Text>
              <Text className="text-white/60 text-xs">
                Collection: {schema.collectionName}
              </Text>
            </View>
            <View className="flex-row space-x-2">
             
              <TouchableOpacity 
                onPress={() => handleDeleteSchema(schema)}
                className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Ionicons name="layers-outline" size={16} color="#ffffff70" />
              <Text className="text-white/70 text-sm ml-1">{fieldCount} fields</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="code-outline" size={16} color="#ffffff70" />
              <Text className="text-white/70 text-sm ml-1">v{schema.version}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#ffffff70" />
              <Text className="text-white/70 text-xs ml-1">
                {formatDate(schema.createdAt)}
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${schema.isActive ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
              <Text className={`text-xs font-medium ${schema.isActive ? 'text-green-200' : 'text-red-200'}`}>
                {schema.isActive ? 'Active' : 'Inactive'}
              </Text>
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

  const CreateSchemaModal = () => (
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
          <Text className="text-white text-lg font-semibold">Create Schema</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-lg font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="space-y-6">
            <View>
              <Text className="text-white font-medium mb-2">Schema Name</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter schema name (e.g., product)"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Display Name</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter display name (e.g., Product)"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Description</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter schema description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">JSON Schema</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white font-mono text-sm"
                placeholder={`{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "price": { "type": "number", "minimum": 0 }
  },
  "required": ["name", "price"]
}`}
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={10}
              />
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
          
          <Text className="text-white text-lg font-semibold">Schema Management</Text>
          
          <TouchableOpacity 
            onPress={handleCreateSchema}
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
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchSchemas}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
        >
          {/* Search Bar */}
          <View className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-700">
            <View className="flex-row items-center">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 text-white ml-3"
                placeholder="Search schemas..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="All Schemas" index={0} onPress={setActiveTab} />
              <TabButton title="Active" index={1} onPress={setActiveTab} />
              <TabButton title="Inactive" index={2} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {/* Schema Stats */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-gray-800/50 rounded-xl p-4 flex-1 mr-2 border border-gray-700/50">
              <Text className="text-gray-400 text-sm">Total Schemas</Text>
              <Text className="text-white text-2xl font-bold">{schemas.length}</Text>
            </View>
            <View className="bg-gray-800/50 rounded-xl p-4 flex-1 ml-2 border border-gray-700/50">
              <Text className="text-gray-400 text-sm">Active Schemas</Text>
              <Text className="text-white text-2xl font-bold">
                {schemas.filter(s => s.isActive).length}
              </Text>
            </View>
          </View>

          {/* Schema List */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                {activeTab === 0 ? 'All Schemas' : activeTab === 1 ? 'Active Schemas' : 'Inactive Schemas'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {loading ? 'Loading...' : `${filteredSchemas.length} schemas`}
              </Text>
            </View>

            {loading ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
                <Text className="text-white text-lg mb-2">Loading schemas...</Text>
                <Text className="text-gray-400 text-sm">Fetching your schema data</Text>
              </View>
            ) : error ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
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
            ) : filteredSchemas.length === 0 ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
                <Ionicons name="library-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">
                  {searchQuery ? 'No schemas found' : schemas.length === 0 ? 'No schemas created yet' : 'No schemas match your filter'}
                </Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first schema to get started'}
                </Text>
                {!searchQuery && schemas.length === 0 && (
                  <TouchableOpacity 
                    onPress={handleCreateSchema}
                    className="bg-blue-600 px-6 py-3 rounded-full mt-4"
                  >
                    <Text className="text-white font-semibold">Create Schema</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredSchemas.map((schema, index) => (
                <SchemaCard key={schema._id} schema={schema} index={index} />
              ))
            )}
          </View>
        </ScrollView>

        <CreateSchemaModal />
      </View>
    </ImageBackground>
  );
};

export default SchemaManagementScreen;

