import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { height: screenHeight } = Dimensions.get('window');

interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
  description?: string;
}

interface DropdownWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  options?: DropdownOption[];
  description?: string;
  placeholder?: string;
  searchable?: boolean;
}

const DropdownWidget: React.FC<DropdownWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  options = [],
  description,
  placeholder,
  searchable = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    onChangeText(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
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
        className={`bg-gray-800/60 rounded-xl px-4 py-4 flex-row items-center justify-between border ${
          error ? 'border-red-500/50' : 'border-gray-600/50'
        }`}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center flex-1">
          {selectedOption?.icon && (
            <Ionicons name={selectedOption.icon as any} size={20} color="#60A5FA" style={{ marginRight: 12 }} />
          )}
          <View className="flex-1">
            <Text className={`text-base ${value ? 'text-white' : 'text-gray-500'}`} numberOfLines={1}>
              {selectedOption?.label || placeholder || 'Select an option'}
            </Text>
            {selectedOption?.description && (
              <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                {selectedOption.description}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color={error ? '#EF4444' : '#9CA3AF'} />
      </TouchableOpacity>

      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-400 text-xs ml-1">{error}</Text>
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchQuery('');
        }}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View 
            className="bg-gray-900 rounded-t-3xl"
            style={{ maxHeight: screenHeight * 0.7 }}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-6 pt-6 pb-4 border-b border-gray-800">
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{label || 'Select Option'}</Text>
                <Text className="text-gray-400 text-sm mt-1">{options.length} options available</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            {searchable && options.length > 5 && (
              <View className="px-6 py-4">
                <View className="bg-gray-800/60 rounded-xl px-4 py-3 flex-row items-center border border-gray-700/50">
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    placeholder="Search options..."
                    placeholderTextColor="rgba(156, 163, 175, 0.6)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Options List */}
            <ScrollView className="px-6 pb-6">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className={`py-4 px-4 rounded-xl mb-2 border ${
                        isSelected 
                          ? 'bg-blue-600/20 border-blue-500/50' 
                          : 'bg-gray-800/50 border-gray-700/50'
                      }`}
                      onPress={() => handleSelect(option.value)}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          {option.icon && (
                            <View className="mr-3">
                              <Ionicons 
                                name={option.icon as any} 
                                size={22} 
                                color={isSelected ? '#60A5FA' : '#9CA3AF'} 
                              />
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className={`text-base font-medium ${
                              isSelected ? 'text-blue-400' : 'text-white'
                            }`}>
                              {option.label}
                            </Text>
                            {option.description && (
                              <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                                {option.description}
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
                })
              ) : (
                <View className="py-12 items-center">
                  <Ionicons name="search" size={48} color="#6B7280" />
                  <Text className="text-gray-400 text-lg font-medium mt-4">No options found</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Try adjusting your search query
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DropdownWidget;
