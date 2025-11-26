import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WidgetActionButtonsProps {
  fieldName: string;
  fieldValue: string;
  widgetType: 'email_field' | 'phone_field' | 'location_field';
  widgetPermissions?: {
    email?: { send?: boolean };
    phone?: { call?: boolean; sms?: boolean };
    location?: { viewMap?: boolean; getDirections?: boolean };
  };
}

const WidgetActionButtons: React.FC<WidgetActionButtonsProps> = ({
  fieldName,
  fieldValue,
  widgetType,
  widgetPermissions,
}) => {
  const handleEmailAction = () => {
    if (widgetPermissions?.email?.send !== false) {
      Linking.openURL(`mailto:${fieldValue}`).catch(() => {
        Alert.alert('Error', 'Could not open email client');
      });
    }
  };

  const handlePhoneCall = () => {
    if (widgetPermissions?.phone?.call !== false) {
      Linking.openURL(`tel:${fieldValue}`).catch(() => {
        Alert.alert('Error', 'Could not open phone dialer');
      });
    }
  };

  const handlePhoneSMS = () => {
    if (widgetPermissions?.phone?.sms !== false) {
      Linking.openURL(`sms:${fieldValue}`).catch(() => {
        Alert.alert('Error', 'Could not open messaging app');
      });
    }
  };

  const handleViewMap = () => {
    if (widgetPermissions?.location?.viewMap !== false) {
      const encodedAddress = encodeURIComponent(fieldValue);
      Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`).catch(() => {
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const handleGetDirections = () => {
    if (widgetPermissions?.location?.getDirections !== false) {
      const encodedAddress = encodeURIComponent(fieldValue);
      Linking.openURL(`https://maps.google.com/maps?daddr=${encodedAddress}`).catch(() => {
        Alert.alert('Error', 'Could not open maps for directions');
      });
    }
  };

  if (widgetType === 'email_field') {
    return (
      <View className="flex-row items-center ml-2">
        {widgetPermissions?.email?.send !== false && (
          <TouchableOpacity
            onPress={handleEmailAction}
            className="bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/30 flex-row items-center"
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={14} color="#60A5FA" />
            <Text className="text-blue-400 text-xs font-semibold ml-1.5" numberOfLines={1}>
              Send
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (widgetType === 'phone_field') {
    return (
      <View className="flex-row items-center ml-2 flex-wrap">
        {widgetPermissions?.phone?.call !== false && (
          <TouchableOpacity
            onPress={handlePhoneCall}
            className="bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/30 flex-row items-center mr-2 mb-1"
            activeOpacity={0.7}
          >
            <Ionicons name="call-outline" size={14} color="#34D399" />
            <Text className="text-green-400 text-xs font-semibold ml-1.5" numberOfLines={1}>
              Call
            </Text>
          </TouchableOpacity>
        )}
        {widgetPermissions?.phone?.sms !== false && (
          <TouchableOpacity
            onPress={handlePhoneSMS}
            className="bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 flex-row items-center mb-1"
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#A855F7" />
            <Text className="text-purple-400 text-xs font-semibold ml-1.5" numberOfLines={1}>
              SMS
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (widgetType === 'location_field') {
    return (
      <View className="flex-row items-center ml-2 flex-wrap">
        {widgetPermissions?.location?.viewMap !== false && (
          <TouchableOpacity
            onPress={handleViewMap}
            className="bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/30 flex-row items-center mr-2 mb-1"
            activeOpacity={0.7}
          >
            <Ionicons name="map-outline" size={14} color="#FB923C" />
            <Text className="text-orange-400 text-xs font-semibold ml-1.5" numberOfLines={1}>
              View
            </Text>
          </TouchableOpacity>
        )}
        {widgetPermissions?.location?.getDirections !== false && (
          <TouchableOpacity
            onPress={handleGetDirections}
            className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30 flex-row items-center mb-1"
            activeOpacity={0.7}
          >
            <Ionicons name="navigate-outline" size={14} color="#F87171" />
            <Text className="text-red-400 text-xs font-semibold ml-1.5" numberOfLines={1}>
              Directions
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
};

export default WidgetActionButtons;

