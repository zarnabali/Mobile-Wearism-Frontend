import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonWidgetProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

const ButtonWidget: React.FC<ButtonWidgetProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-700';
      case 'danger':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <TouchableOpacity
      className={`${getVariantStyles()} py-4 rounded-full ${
        disabled || loading ? 'opacity-50' : ''
      }`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text className="text-white text-center text-lg font-semibold">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ButtonWidget;

