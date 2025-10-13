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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DataManagementScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSchema, setSelectedSchema] = useState('product');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Mock data based on API responses
  const schemas = [
    { name: 'product', displayName: 'Product', fieldCount: 4 },
    { name: 'customer', displayName: 'Customer', fieldCount: 5 },
    { name: 'order', displayName: 'Order', fieldCount: 6 },
    { name: 'invoice', displayName: 'Invoice', fieldCount: 7 }
  ];

  const mockRecords = [
    {
      _id: "68d8ff661b79091dc833e3f6",
      name: "iPhone 15 Pro",
      price: 999,
      category: "Electronics",
      inStock: true,
      createdAt: "2025-09-28T09:27:02.049Z",
      updatedAt: "2025-09-28T09:27:02.050Z"
    },
    {
      _id: "68d8ff661b79091dc833e3f7",
      name: "MacBook Pro",
      price: 1999,
      category: "Electronics",
      inStock: false,
      createdAt: "2025-09-28T08:15:30.123Z",
      updatedAt: "2025-09-28T08:15:30.123Z"
    },
    {
      _id: "68d8ff661b79091dc833e3f8",
      name: "AirPods Pro",
      price: 249,
      category: "Accessories",
      inStock: true,
      createdAt: "2025-09-28T07:45:15.456Z",
      updatedAt: "2025-09-28T07:45:15.456Z"
    },
    {
      _id: "68d8ff661b79091dc833e3f9",
      name: "iPad Air",
      price: 599,
      category: "Electronics",
      inStock: true,
      createdAt: "2025-09-27T16:30:45.789Z",
      updatedAt: "2025-09-27T16:30:45.789Z"
    }
  ];

  const filteredRecords = mockRecords.filter(record =>
    record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRecord = () => {
    setShowCreateModal(true);
  };

  const handleEditRecord = (record: any) => {
    Alert.alert('Edit Record', `Edit ${record.name}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => console.log('Edit record:', record._id) }
    ]);
  };

  const handleDeleteRecord = (record: any) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete "${record.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => console.log('Delete record:', record._id)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const RecordCard = ({ record, index }: { record: any; index: number }) => {
    const gradients = [
      ['#4F46E5', '#7C3AED'],
      ['#7C3AED', '#EC4899'],
      ['#059669', '#0891B2'],
      ['#DC2626', '#EA580C'],
      ['#7C2D12', '#92400E']
    ];
    const gradient = gradients[index % gradients.length];

    return (
      <View className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700/50">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold mb-1">
              {record.name}
            </Text>
            <Text className="text-gray-400 text-sm mb-2">{record.category}</Text>
            <View className="flex-row items-center mb-2">
              <Text className="text-green-400 font-bold text-lg">
                {formatPrice(record.price)}
              </Text>
              <View className={`ml-3 px-2 py-1 rounded-full ${record.inStock ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Text className={`text-xs font-medium ${record.inStock ? 'text-green-400' : 'text-red-400'}`}>
                  {record.inStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity 
              onPress={() => handleEditRecord(record)}
              className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center"
            >
              <Ionicons name="pencil" size={14} color="#60A5FA" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteRecord(record)}
              className="w-8 h-8 rounded-full bg-red-500/20 items-center justify-center"
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              Created {formatDate(record.createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="refresh-outline" size={14} color="#6B7280" />
            <Text className="text-gray-400 text-xs ml-1">
              Updated {formatDate(record.updatedAt)}
            </Text>
          </View>
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
      <Text className="text-white font-medium mb-3">Select Schema</Text>
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
                {schema.fieldCount} fields
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const CreateRecordModal = () => (
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
          <Text className="text-white text-lg font-semibold">Create Record</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-lg font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="space-y-6">
            <View>
              <Text className="text-white font-medium mb-2">Name</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter product name"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Price</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter price"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">Category</Text>
              <TextInput
                className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                placeholder="Enter category"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View>
              <Text className="text-white font-medium mb-2">In Stock</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity className="bg-green-500/20 px-4 py-3 rounded-xl flex-1">
                  <Text className="text-green-400 font-medium text-center">Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-800 px-4 py-3 rounded-xl flex-1">
                  <Text className="text-gray-400 font-medium text-center">No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
        <View className="flex-row justify-between items-center px-6 pt-14 pb-6">
          <TouchableOpacity onPress={() => setShowFilterModal(false)}>
            <Text className="text-blue-500 text-lg">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-semibold">Filter Records</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-lg font-semibold">Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6">
          <View className="space-y-6">
            <View>
              <Text className="text-white font-medium mb-3">Price Range</Text>
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Min Price</Text>
                  <TextInput
                    className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                    placeholder="$0"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Max Price</Text>
                  <TextInput
                    className="bg-gray-800 rounded-xl px-4 py-3 text-white"
                    placeholder="$1000"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View>
              <Text className="text-white font-medium mb-3">Category</Text>
              <View className="space-y-2">
                {['Electronics', 'Accessories', 'Clothing', 'Books'].map((category) => (
                  <TouchableOpacity key={category} className="flex-row items-center py-2">
                    <View className="w-5 h-5 rounded border border-gray-600 mr-3" />
                    <Text className="text-gray-400">{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-white font-medium mb-3">Stock Status</Text>
              <View className="space-y-2">
                <TouchableOpacity className="flex-row items-center py-2">
                  <View className="w-5 h-5 rounded border border-gray-600 mr-3" />
                  <Text className="text-gray-400">In Stock</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center py-2">
                  <View className="w-5 h-5 rounded border border-gray-600 mr-3" />
                  <Text className="text-gray-400">Out of Stock</Text>
                </TouchableOpacity>
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
          
          <Text className="text-white text-lg font-semibold">Data Management</Text>
          
          <View className="flex-row space-x-2">
            <TouchableOpacity 
              onPress={() => setShowFilterModal(true)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="filter-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleCreateRecord}
              className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
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
                placeholder="Search records..."
                placeholderTextColor="#6B7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Tab Navigation */}
          <View className="flex-row mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TabButton title="All Records" index={0} onPress={setActiveTab} />
              <TabButton title="In Stock" index={1} onPress={setActiveTab} />
              <TabButton title="Out of Stock" index={2} onPress={setActiveTab} />
              <TabButton title="Recently Added" index={3} onPress={setActiveTab} />
            </ScrollView>
          </View>

          {/* Record Stats */}
          <View className="flex-row justify-between mb-6">
            <View className="bg-gray-800/50 rounded-xl p-4 flex-1 mr-2 border border-gray-700/50">
              <Text className="text-gray-400 text-sm">Total Records</Text>
              <Text className="text-white text-2xl font-bold">{mockRecords.length}</Text>
            </View>
            <View className="bg-gray-800/50 rounded-xl p-4 flex-1 ml-2 border border-gray-700/50">
              <Text className="text-gray-400 text-sm">In Stock</Text>
              <Text className="text-white text-2xl font-bold">
                {mockRecords.filter(r => r.inStock).length}
              </Text>
            </View>
          </View>

          {/* Records List */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-semibold">
                {selectedSchema.charAt(0).toUpperCase() + selectedSchema.slice(1)} Records
              </Text>
              <Text className="text-gray-400 text-sm">
                {filteredRecords.length} records
              </Text>
            </View>

            {filteredRecords.length === 0 ? (
              <View className="bg-gray-800/50 rounded-xl p-8 border border-gray-700/50 items-center">
                <Ionicons name="server-outline" size={48} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">No records found</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first record to get started'}
                </Text>
              </View>
            ) : (
              filteredRecords.map((record, index) => (
                <RecordCard key={record._id} record={record} index={index} />
              ))
            )}
          </View>
        </ScrollView>

        <CreateRecordModal />
        <FilterModal />
      </View>
    </ImageBackground>
  );
};

export default DataManagementScreen;

