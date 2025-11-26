import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { communicationService, LocationView } from '../../services/CommunicationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AddressInputWidgetProps {
  label?: string;
  required?: boolean;
  error?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  description?: string;
  autoActions?: boolean; // Show map button
  recordId?: string; // For tracking location views
  schemaName?: string; // For audit trail
}

const AddressInputWidget: React.FC<AddressInputWidgetProps> = ({
  label,
  required,
  error,
  value,
  onChangeText,
  placeholder = 'Enter address',
  description,
  autoActions = false,
  recordId,
  schemaName,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressLocation, setAddressLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [history, setHistory] = useState<LocationView[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Request location permission
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Load location history
  useEffect(() => {
    if (recordId && autoActions) {
      loadLocationHistory();
    }
  }, [recordId]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (err) {
      console.warn('Location permission not granted:', err);
    }
  };

  const loadLocationHistory = async () => {
    if (!recordId) return;
    
    setLoadingHistory(true);
    try {
      const locations = await communicationService.getLocationHistory(recordId);
      setHistory(locations);
    } catch (err) {
      console.error('Failed to load location history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address: string) => {
    try {
      const geocoded = await Location.geocodeAsync(address);
      if (geocoded && geocoded.length > 0) {
        return {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding failed:', err);
      return null;
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleViewMap = async () => {
    if (!value) {
      Alert.alert('No Address', 'Please enter an address first');
      return;
    }

    setLoadingLocation(true);
    try {
      // Geocode the address
      const coords = await geocodeAddress(value);
      
      if (!coords) {
        Alert.alert('Geocoding Failed', 'Could not find location for this address');
        setLoadingLocation(false);
        return;
      }

      setAddressLocation(coords);

      // Calculate distance if user location is available
      if (userLocation) {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.latitude,
          coords.longitude
        );
        setDistance(dist);
        
        // Estimate time (assuming average speed of 50 km/h)
        const time = (dist / 50) * 60; // minutes
        setEstimatedTime(Math.round(time));
      }

      // Log location view to backend
      if (recordId) {
        await communicationService.logLocationView({
          address: value,
          userLatitude: userLocation?.latitude,
          userLongitude: userLocation?.longitude,
          distance,
          entityType: schemaName || 'unknown',
          entityId: recordId,
        });
        
        // Reload history
        loadLocationHistory();
      }

      setShowMapModal(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to process address');
      console.error(err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleGetDirections = async () => {
    if (!addressLocation) return;

    const url = Platform.select({
      ios: `maps:0,0?q=${addressLocation.latitude},${addressLocation.longitude}`,
      android: `geo:0,0?q=${addressLocation.latitude},${addressLocation.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${addressLocation.latitude},${addressLocation.longitude}`,
    });

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open maps on this device');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open directions');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDistance = (km: number) => {
    return `${km.toFixed(2)} km (${(km * 0.621371).toFixed(2)} mi)`;
  };

  const lastView = history[0];

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
            {lastView && (
              <Text className="text-gray-500 text-xs mt-1">
                Last viewed: {formatTimestamp(lastView.timestamp)}
                {lastView.distance && ` • ${formatDistance(lastView.distance)}`}
              </Text>
            )}
          </View>
        )}
        <View className="flex-row items-center">
          <View className={`flex-1 flex-row items-center bg-gray-800/60 rounded-xl px-4 py-4 border ${
            error ? 'border-red-500/50' : isFocused ? 'border-blue-500/50' : 'border-gray-600/50'
          }`}>
            <Ionicons 
              name="location-outline" 
              size={20} 
              color={error ? '#EF4444' : value ? '#34D399' : '#9CA3AF'} 
            />
            <RNTextInput
              className="flex-1 ml-3 text-white text-base"
              placeholder={placeholder}
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              numberOfLines={2}
            />
          </View>
          
          {autoActions && value && (
            <View className="flex-row ml-2">
              <TouchableOpacity
                onPress={handleViewMap}
                disabled={loadingLocation}
                className="w-12 h-12 bg-purple-600 rounded-xl items-center justify-center"
                activeOpacity={0.7}
              >
                {loadingLocation ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="map" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
              
              {history.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowHistoryModal(true)}
                  className="w-12 h-12 bg-gray-700/50 rounded-xl items-center justify-center ml-2 border border-gray-600/50"
                  activeOpacity={0.7}
                >
                  <View>
                    <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full items-center justify-center">
                      <Text className="text-white text-[10px] font-bold">{history.length}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 bg-gray-900/95 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => setShowMapModal(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Location</Text>
            <TouchableOpacity 
              onPress={handleGetDirections}
              className="px-4 py-2 rounded-xl bg-blue-600"
            >
              <Text className="text-white font-semibold">Directions</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            {/* Map Placeholder */}
            <View className="w-full bg-gray-800" style={{ height: screenHeight * 0.5 }}>
              <LinearGradient
                colors={['#1F2937', '#374151', '#1F2937']}
                className="flex-1 items-center justify-center"
              >
                <Ionicons name="map" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">Map View</Text>
                <Text className="text-gray-500 text-sm text-center mt-2 px-6">
                  {value}
                </Text>
                {addressLocation && (
                  <Text className="text-gray-600 text-xs mt-2">
                    {addressLocation.latitude.toFixed(6)}, {addressLocation.longitude.toFixed(6)}
                  </Text>
                )}
              </LinearGradient>
            </View>

            {/* Location Info */}
            <View className="px-6 py-6">
              {/* Address Card */}
              <View className="bg-gray-800/60 rounded-xl p-5 mb-4 border border-gray-700/50">
                <View className="flex-row items-start mb-3">
                  <Ionicons name="location" size={24} color="#A78BFA" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-semibold text-base mb-1">Address</Text>
                    <Text className="text-gray-300 text-sm">{value}</Text>
                  </View>
                </View>
              </View>

              {/* Distance & Time */}
              {userLocation && distance && (
                <View className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-5 mb-4 border border-blue-500/30">
                  <Text className="text-white font-semibold text-lg mb-4">Distance Info</Text>
                  
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center">
                      <Ionicons name="navigate" size={20} color="#60A5FA" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-400 text-sm">Distance</Text>
                      <Text className="text-white text-xl font-bold">{formatDistance(distance)}</Text>
                    </View>
                  </View>

                  {estimatedTime && (
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-purple-500/20 rounded-full items-center justify-center">
                        <Ionicons name="time" size={20} color="#A78BFA" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-400 text-sm">Estimated Time</Text>
                        <Text className="text-white text-xl font-bold">{estimatedTime} min</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={handleGetDirections}
                  className="bg-blue-600 rounded-xl p-4 flex-row items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate" size={20} color="#ffffff" />
                  <Text className="text-white font-semibold text-base ml-2">Get Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    if (addressLocation) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${addressLocation.latitude},${addressLocation.longitude}`;
                      await Linking.openURL(url);
                    }
                  }}
                  className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-center border border-gray-700/50"
                  activeOpacity={0.7}
                >
                  <Ionicons name="map-outline" size={20} color="#9CA3AF" />
                  <Text className="text-gray-300 font-semibold text-base ml-2">Open in Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    if (addressLocation) {
                      const message = `Location: ${value}\nhttps://www.google.com/maps/search/?api=1&query=${addressLocation.latitude},${addressLocation.longitude}`;
                      await Linking.openURL(`sms:?body=${encodeURIComponent(message)}`);
                    }
                  }}
                  className="bg-gray-800 rounded-xl p-4 flex-row items-center justify-center border border-gray-700/50"
                  activeOpacity={0.7}
                >
                  <Ionicons name="share-outline" size={20} color="#9CA3AF" />
                  <Text className="text-gray-300 font-semibold text-base ml-2">Share Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Location History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View className="flex-1 bg-gray-900">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 pt-14 pb-6 border-b border-gray-800">
            <TouchableOpacity 
              onPress={() => setShowHistoryModal(false)}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold">Location History</Text>
            <TouchableOpacity 
              onPress={loadLocationHistory}
              className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center"
            >
              {loadingHistory ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Ionicons name="refresh" size={24} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 pt-6">
            {history.length > 0 ? (
              history.map((location, index) => (
                <View
                  key={location.id || index}
                  className="bg-gray-800/50 rounded-xl p-4 mb-3 border border-gray-700/50"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-base mb-1" numberOfLines={2}>
                        {location.address}
                      </Text>
                      <Text className="text-gray-400 text-sm">{formatTimestamp(location.timestamp)}</Text>
                    </View>
                  </View>
                  
                  {location.distance && (
                    <View className="bg-purple-600/20 rounded-lg p-3">
                      <View className="flex-row items-center">
                        <Ionicons name="navigate" size={16} color="#A78BFA" />
                        <Text className="text-purple-300 text-sm ml-2">
                          Distance: {formatDistance(location.distance)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View className="py-12 items-center">
                <Ionicons name="location-outline" size={64} color="#6B7280" />
                <Text className="text-gray-400 text-lg font-medium mt-4">No location history</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Location views will appear here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default AddressInputWidget;
