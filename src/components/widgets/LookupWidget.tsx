import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '../../utils/api';

const { height: screenHeight } = Dimensions.get('window');

interface LookupOption {
  label?: string;
  value: string;
  description?: string;
  icon?: string;
  [key: string]: any; // Allow additional fields
}

interface LookupWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  description?: string;
  endpoint?: string; // API endpoint to fetch options
  displayField?: string; // Field to display (default: 'name')
  valueField?: string; // Field to use as value (default: 'id')
  searchable?: boolean;
  options?: LookupOption[]; // Static options
  onSelect?: (item: any) => void;
  debounceMs?: number; // Debounce search delay
  minSearchLength?: number; // Minimum characters before search
}

const LookupWidget: React.FC<LookupWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = 'Search or select...',
  description,
  endpoint,
  displayField = 'name',
  valueField = 'id',
  searchable = true,
  options: staticOptions,
  onSelect,
  debounceMs = 300,
  minSearchLength = 2,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize options
  useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    } else if (showModal && endpoint) {
      fetchOptions();
    }
  }, [showModal, staticOptions]);

  // Find selected item
  useEffect(() => {
    if (value && options.length > 0) {
      const found = options.find((opt) => String(opt[valueField]) === String(value));
      if (found) {
        setSelectedItem(found);
      }
    }
  }, [value, options, valueField]);

  const fetchOptions = async (query?: string) => {
    if (!endpoint) return;

    setLoading(true);
    try {
      const url = query ? `${endpoint}?q=${encodeURIComponent(query)}` : endpoint;
      const response = await apiFetch<any>(url, { method: 'GET' });
      const data = Array.isArray(response) ? response : response?.data || [];
      setOptions(data);
    } catch (err: any) {
      console.error('Failed to fetch options:', err);
      Alert.alert('Error', 'Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);

    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // If endpoint exists and query is long enough, debounce backend search
    if (endpoint && query.length >= minSearchLength) {
      const timeout = setTimeout(() => {
        fetchOptions(query);
      }, debounceMs);
      setDebounceTimeout(timeout);
    }
  }, [endpoint, debounceMs, minSearchLength, debounceTimeout]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    
    // If using backend search, don't filter (backend handles it)
    if (endpoint) return options;
    
    // Client-side filtering for static options
    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const displayValue = String(option[displayField] || option.label || '').toLowerCase();
      const desc = String(option.description || '').toLowerCase();
      return displayValue.includes(query) || desc.includes(query);
    });
  }, [options, searchQuery, displayField, endpoint]);

  const handleSelect = (item: any) => {
    const selectedValue = item[valueField] || item.value;
    onChangeText(String(selectedValue));
    setSelectedItem(item);
    if (onSelect) {
      onSelect(item);
    }
    setShowModal(false);
    setSearchQuery('');
  };

  const handleClear = (e: any) => {
    e?.stopPropagation();
    onChangeText('');
    setSelectedItem(null);
  };

  const displayValue = selectedItem
    ? selectedItem[displayField] || selectedItem.label || value
    : value || '';

  return (
    <>
      <View className="mb-5">
        {label && (
          <View className="mb-2">
            <Text className="text-white text-base font-semibold">
              {label}
              {required && <Text className="text-red-400"> *</Text>}
            </Text>
            {description && (
              <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>
                {description}
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-row items-center bg-gray-800/60 rounded-xl px-4 py-4 border ${
            error ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
          }`}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={error ? '#EF4444' : displayValue ? '#60A5FA' : '#9CA3AF'} 
          />
          <View className="flex-1 ml-3">
            <Text className={`text-base ${displayValue ? 'text-white' : 'text-gray-500'}`} numberOfLines={1}>
              {displayValue || placeholder}
            </Text>
            {selectedItem?.description && (
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                {selectedItem.description}
              </Text>
            )}
          </View>
          {selectedItem ? (
            <TouchableOpacity
              onPress={handleClear}
              className="ml-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        {error && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="alert-circle" size={14} color="#EF4444" />
            <Text className="text-red-400 text-xs ml-1">{error}</Text>
          </View>
        )}
      </View>

      {/* Lookup Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          setSearchQuery('');
        }}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => {
                setShowModal(false);
                setSearchQuery('');
              }}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <View className="flex-1 mx-4">
              <Text className="text-white text-xl font-bold text-center">{label || 'Select Option'}</Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                {filteredOptions.length} option{filteredOptions.length !== 1 ? 's' : ''} available
              </Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Search Bar */}
          {searchable && (
            <View className="px-6 py-4 bg-gray-900/50">
              <View className="flex-row items-center bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50">
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <RNTextInput
                  className="flex-1 ml-3 text-white text-base"
                  placeholder={endpoint ? `Type at least ${minSearchLength} characters...` : 'Search...'}
                  placeholderTextColor="rgba(156, 163, 175, 0.6)"
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => handleSearchChange('')}>
                    <Ionicons name="close-circle" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>
              {endpoint && searchQuery.length > 0 && searchQuery.length < minSearchLength && (
                <Text className="text-gray-500 text-xs mt-2">
                  Type {minSearchLength - searchQuery.length} more character{minSearchLength - searchQuery.length !== 1 ? 's' : ''} to search
                </Text>
              )}
            </View>
          )}

          {/* Options List */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#60A5FA" />
              <Text className="text-gray-400 mt-4">Loading options...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => String(item[valueField] || item.value || index)}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const isSelected = String(item[valueField] || item.value) === String(value);
                const itemIcon = item.icon;
                const itemDisplay = item[displayField] || item.label || String(item[valueField] || item.value);
                const itemDesc = item.description;

                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`py-4 px-4 rounded-xl mb-2 border ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500/50' 
                        : 'bg-gray-800/50 border-gray-700/50'
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        {itemIcon && (
                          <View className="mr-3">
                            <Ionicons 
                              name={itemIcon as any} 
                              size={22} 
                              color={isSelected ? '#60A5FA' : '#9CA3AF'} 
                            />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className={`text-base font-medium ${
                            isSelected ? 'text-blue-400' : 'text-white'
                          }`} numberOfLines={1}>
                            {itemDisplay}
                          </Text>
                          {itemDesc && (
                            <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                              {itemDesc}
                            </Text>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <View className="ml-3">
                          <Ionicons name="checkmark-circle" size={24} color="#60A5FA" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View className="py-12 items-center">
                  <Ionicons name="search-outline" size={64} color="#6B7280" />
                  <Text className="text-gray-400 text-lg font-medium mt-4">No options found</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2 px-6">
                    {searchQuery 
                      ? `No results for "${searchQuery}"`
                      : 'No options available'}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </>
  );
};

export default LookupWidget;
