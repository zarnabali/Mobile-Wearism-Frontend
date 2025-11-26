import React, { useState } from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextAreaWidgetProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  description?: string;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
}

const TextAreaWidget: React.FC<TextAreaWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  description,
  maxLength,
  rows = 4,
  placeholder,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = value?.length || 0;
  const showCounter = maxLength && maxLength > 0;
  const lineCount = (value?.match(/\n/g) || []).length + 1;

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
      <View className={`bg-gray-800/60 rounded-xl border ${
        error ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
      }`}>
        <RNTextInput
          className="px-4 py-4 text-white text-base"
          placeholderTextColor="rgba(156, 163, 175, 0.6)"
          placeholder={placeholder || 'Enter your text here...'}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          numberOfLines={rows}
          maxLength={maxLength}
          textAlignVertical="top"
          style={{ minHeight: rows * 24 }}
          {...textInputProps}
        />
        {(showCounter || lineCount > 1) && (
          <View className="px-4 py-2 border-t border-gray-700/50 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-xs ml-1">
                {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </Text>
            </View>
            {showCounter && (
              <Text className={`text-xs ${characterCount > maxLength ? 'text-red-400' : 'text-gray-500'}`}>
                {characterCount}/{maxLength}
              </Text>
            )}
          </View>
        )}
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

export default TextAreaWidget;
