import React, { useState } from 'react';
import { View, Text, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextInputWidgetProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  description?: string;
  icon?: string;
  maxLength?: number;
}

const TextInputWidget: React.FC<TextInputWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  description,
  icon,
  maxLength,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = value?.length || 0;
  const showCounter = maxLength && maxLength > 0;

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
      <View className={`flex-row items-center bg-gray-800/60 rounded-xl border ${
        error ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
      }`}>
        {icon && (
          <View className="pl-4">
            <Ionicons name={icon as any} size={20} color={error ? '#EF4444' : isFocused ? '#60A5FA' : '#9CA3AF'} />
          </View>
        )}
        <RNTextInput
          className="flex-1 px-4 py-4 text-white text-base"
          placeholderTextColor="rgba(156, 163, 175, 0.6)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          {...textInputProps}
        />
        {showCounter && (
          <View className="pr-4">
            <Text className={`text-xs ${characterCount > maxLength ? 'text-red-400' : 'text-gray-500'}`}>
              {characterCount}/{maxLength}
            </Text>
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

export default TextInputWidget;
