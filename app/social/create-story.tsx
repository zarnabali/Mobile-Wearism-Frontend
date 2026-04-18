import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

export default function CreateStoryScreen() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? '';

  const { data: statusData } = useQuery({
    queryKey: ['stories-status'],
    queryFn: () => apiClient.get('/stories/status').then((r) => r.data),
    enabled: !!userId,
  });

  const canPost = statusData?.can_post !== false;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    };
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access denied');
        return;
      }
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!imageUri || !userId) return;
    if (!canPost) {
      Alert.alert('Daily limit', 'You can only post one story per day.');
      return;
    }
    setLoading(true);
    try {
      const storyId = uuidv4();
      const filename = `${storyId}.jpg`;
      const imagePath = `${userId}/stories/${filename}`;

      const form = new FormData();
      form.append('story_id', storyId);
      form.append('image_path', imagePath);
      form.append('file', { uri: imageUri, name: filename, type: 'image/jpeg' } as any);

      await apiClient.post('/stories', form, { headers: { 'Content-Type': 'multipart/form-data' } });

      await qc.invalidateQueries({ queryKey: ['stories-feed'] });
      await qc.invalidateQueries({ queryKey: ['stories-status'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Upload failed', err.response?.data?.error ?? 'Could not upload story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {loading ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading} style={{ padding: 4 }}>
              <Ionicons name="close-outline" size={30} color="white" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image 
                source={require('../../assets/logo/wearism-short-w.png')} 
                style={{ width: 22, height: 22 }} 
                resizeMode="contain" 
              />
              <Text className="text-white text-[17px] font-h-bold">New Story</Text>
            </View>
            <TouchableOpacity onPress={handleUpload} disabled={loading || !imageUri || !canPost} style={{ padding: 4 }}>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text
                  style={{
                    color: !imageUri || !canPost ? 'rgba(255,107,53,0.3)' : COLORS.primary,
                    fontSize: 16,
                  }}
                  className="font-h-bold"
                >
                  Share
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ width: '90%', aspectRatio: 9 / 16, maxHeight: 600, alignSelf: 'center', backgroundColor: 'transparent', borderRadius: 24, overflow: 'hidden', marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {!loading && (
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      className="absolute bottom-6 right-6 bg-black/60 rounded-full px-5 py-2.5 flex-row items-center border border-white/20"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images-outline" size={16} color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white text-[12px] font-h-medium">Replace</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View className="flex-1 items-center justify-center px-10">
                  <View className="w-20 h-20 rounded-full bg-white/2 items-center justify-center border border-white/5 mb-6">
                    <Ionicons name="videocam-outline" size={32} color="rgba(255,255,255,0.3)" />
                  </View>
                  <Text className="text-white/40 text-[15px] font-h-light text-center mb-10 leading-6">
                    Share a moment from your day. Stories disappear after 24 hours.
                  </Text>
                  <View className="w-full gap-4">
                    <TouchableOpacity
                      onPress={() => pickImage(true)}
                      className="flex-row items-center justify-center bg-white/10 border border-white/10 rounded-2xl py-4"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={20} color="white" style={{ marginRight: 12 }} />
                      <Text className="text-white text-[15px] font-h-medium">Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      className="flex-row items-center justify-center bg-primary rounded-2xl py-4 shadow-lg shadow-orange-500/20"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images" size={20} color="white" style={{ marginRight: 12 }} />
                      <Text className="text-white text-[15px] font-h-medium">Pick from Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View className="px-8 mt-10 mb-20">
              {statusData && statusData.can_post === false ? (
                <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="time-outline" size={16} color="#FF6B35" className="mr-2" />
                    <Text className="text-primary text-[14px] font-h-bold">
                      Daily Limit Reached
                    </Text>
                  </View>
                  <Text className="text-primary/70 text-[13px] font-h-light leading-5">
                    You've already shared a story today. Your next slot opens tomorrow!
                  </Text>
                </View>
              ) : (
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="information-circle-outline" size={16} color="white" className="mr-2" />
                    <Text className="text-white text-[14px] font-h-bold">
                      Story Tips
                    </Text>
                  </View>
                  <Text className="text-white/40 text-[13px] font-h-light leading-5">
                    Post your best outfits for higher engagement. Stories are visible to your followers for 24 hours.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
      )}
    </View>
  );
}
