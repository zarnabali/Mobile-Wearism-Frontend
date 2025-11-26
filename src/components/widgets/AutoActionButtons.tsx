import React from 'react';
import { TouchableOpacity, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AutoActionButtonsProps {
  email?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  autoActions?: {
    email?: boolean;
    call?: boolean;
    map?: boolean;
  };
}

const AutoActionButtons: React.FC<AutoActionButtonsProps> = ({
  email,
  phone,
  address,
  latitude,
  longitude,
  autoActions = {},
}) => {
  const handleEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address is required');
      return;
    }

    const mailtoUrl = `mailto:${email}`;
    const canOpen = await Linking.canOpenURL(mailtoUrl);
    
    if (canOpen) {
      Linking.openURL(mailtoUrl);
    } else {
      Alert.alert('Error', 'Cannot open email client');
    }
  };

  const handleCall = async () => {
    if (!phone) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    const telUrl = `tel:${phone}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    
    if (canOpen) {
      Linking.openURL(telUrl);
    } else {
      Alert.alert('Error', 'Cannot open phone dialer');
    }
  };

  const handleMap = async () => {
    let mapUrl = '';

    // If coordinates are available, use them
    if (latitude !== undefined && longitude !== undefined) {
      if (Platform.OS === 'ios') {
        mapUrl = `maps://maps.google.com/maps?daddr=${latitude},${longitude}&amp;ll=`;
      } else {
        mapUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      }
    } else if (address) {
      // Fallback to address string
      const encodedAddress = encodeURIComponent(address);
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    } else {
      Alert.alert('Error', 'Location information is required');
      return;
    }

    const canOpen = await Linking.canOpenURL(mapUrl);
    
    if (canOpen) {
      Linking.openURL(mapUrl);
    } else {
      // Fallback to web-based maps
      const fallbackUrl = address 
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
        : `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      Linking.openURL(fallbackUrl);
    }
  };

  return (
    <>
      {autoActions.email && email && (
        <TouchableOpacity
          onPress={handleEmail}
          className="ml-2 w-8 h-8 items-center justify-center"
        >
          <Ionicons name="mail" size={20} color="#60A5FA" />
        </TouchableOpacity>
      )}
      {autoActions.call && phone && (
        <TouchableOpacity
          onPress={handleCall}
          className="ml-2 w-8 h-8 items-center justify-center"
        >
          <Ionicons name="call" size={20} color="#10B981" />
        </TouchableOpacity>
      )}
      {autoActions.map && address && (
        <TouchableOpacity
          onPress={handleMap}
          className="ml-2 w-8 h-8 items-center justify-center"
        >
          <Ionicons name="map" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </>
  );
};

export default AutoActionButtons;

