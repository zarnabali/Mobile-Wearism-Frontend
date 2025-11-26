import React, { useState } from 'react';
import { View, Text, TextInput as RNTextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumberInputWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  description?: string;
  min?: number;
  max?: number;
  isInteger?: boolean;
  placeholder?: string;
  step?: number;
}

const NumberInputWidget: React.FC<NumberInputWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  description,
  min,
  max,
  isInteger = false,
  placeholder,
  step = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleIncrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue + step;
    if (max === undefined || newValue <= max) {
      onChangeText(isInteger ? Math.round(newValue).toString() : newValue.toString());
    }
  };

  const handleDecrement = () => {
    const currentValue = parseFloat(value) || 0;
    const newValue = currentValue - step;
    if (min === undefined || newValue >= min) {
      onChangeText(isInteger ? Math.round(newValue).toString() : newValue.toString());
    }
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
          {(min !== undefined || max !== undefined) && (
            <Text className="text-gray-500 text-xs mt-1">
              Range: {min ?? '-∞'} to {max ?? '∞'}
            </Text>
          )}
        </View>
      )}
      <View className={`flex-row items-center bg-gray-800/60 rounded-xl border ${
        error ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
      }`}>
        <View className="pl-4">
          <Ionicons name="calculator-outline" size={20} color={error ? '#EF4444' : isFocused ? '#60A5FA' : '#34D399'} />
        </View>
        <RNTextInput
          className="flex-1 px-4 py-4 text-white text-base"
          placeholderTextColor="rgba(156, 163, 175, 0.6)"
          placeholder={placeholder || (isInteger ? 'Enter integer' : 'Enter number')}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={isInteger ? 'number-pad' : 'numeric'}
        />
        <View className="flex-row mr-2">
          <TouchableOpacity
            onPress={handleDecrement}
            className="w-10 h-10 bg-gray-700/50 rounded-lg items-center justify-center mr-2 border border-gray-600/50"
            activeOpacity={0.7}
            disabled={min !== undefined && (parseFloat(value) || 0) <= min}
          >
            <Ionicons name="remove" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleIncrement}
            className="w-10 h-10 bg-blue-600/30 rounded-lg items-center justify-center border border-blue-500/30"
            activeOpacity={0.7}
            disabled={max !== undefined && (parseFloat(value) || 0) >= max}
          >
            <Ionicons name="add" size={20} color="#60A5FA" />
          </TouchableOpacity>
        </View>
      </View>
      {error && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-red-400 text-xs ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
};

export default NumberInputWidget;
