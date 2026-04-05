import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';

export default function ItemUploadScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // ─── Pick from Gallery (multi-select) ─────────────────────────────────────
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages(prev => {
        const combined = [...prev, ...result.assets];
        if (combined.length > 20) {
          Alert.alert('Limit reached', 'You can upload up to 20 items at once.');
          return combined.slice(0, 20);
        }
        return combined;
      });
    }
  };

  // ─── Camera (adds one photo to the batch) ──────────────────────────────────
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Camera access denied');

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages(prev => {
        if (prev.length >= 20) {
          Alert.alert('Limit reached', 'You can upload up to 20 items at once.');
          return prev;
        }
        return [...prev, result.assets[0]];
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Batch Upload ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (images.length === 0) return Alert.alert('No images', 'Please select at least one image.');

    setUploading(true);
    setProgress({ current: 0, total: images.length });

    try {
      const itemIds = images.map(() => uuidv4());

      const form = new FormData();
      form.append('item_ids', JSON.stringify(itemIds));

      images.forEach((img, i) => {
        form.append('file', {
          uri: img.uri,
          name: `${itemIds[i]}.jpg`,
          type: 'image/jpeg',
        } as any);
        setProgress({ current: i + 1, total: images.length });
      });

      await apiClient.post('/wardrobe/items/batch', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      router.replace('/wardrobe' as any);

    } catch (err: any) {
      console.warn('[item-upload] batch error:', JSON.stringify(err.response?.data, null, 2));
      Alert.alert(
        'Upload Failed',
        err.response?.data?.error ?? err.message ?? 'There was an issue uploading your items.',
      );
    } finally {
      setUploading(false);
    }
  };

  const progressPct = progress.total > 0 ? progress.current / progress.total : 0;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 h-14 border-b border-white/10">
            <TouchableOpacity onPress={() => router.back()} disabled={uploading}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className="text-white text-lg">
              Add to Wardrobe
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

            {/* Empty state picker */}
            {images.length === 0 && (
              <View className="aspect-[3/4] w-full bg-black/60 items-center justify-center">
                <Ionicons name="shirt-outline" size={64} color="rgba(255,255,255,0.2)" />
                <Text style={{ fontFamily: 'HelveticaNeue' }} className="text-white/40 text-sm mt-3 mb-6">
                  Select up to 20 items — AI classifies each one
                </Text>
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={pickFromCamera}
                    className="bg-white/10 px-6 h-14 rounded-full border border-white/20 flex-row items-center"
                  >
                    <Ionicons name="camera-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium' }} className="text-white">Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={pickFromGallery}
                    className="bg-white/10 px-6 h-14 rounded-full border border-white/20 flex-row items-center"
                  >
                    <Ionicons name="images-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium' }} className="text-white">Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Thumbnail grid */}
            {images.length > 0 && (
              <View className="mt-5 px-5">
                <View className="flex-row justify-between items-center mb-3">
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className="text-white text-base">
                    {images.length} item{images.length !== 1 ? 's' : ''} selected
                  </Text>
                  {!uploading && images.length < 20 && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={pickFromCamera} className="bg-white/10 px-3 h-9 rounded-full border border-white/20 flex-row items-center">
                        <Ionicons name="camera-outline" size={16} color="white" style={{ marginRight: 4 }} />
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium' }} className="text-white text-sm">Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickFromGallery} className="bg-white/10 px-3 h-9 rounded-full border border-white/20 flex-row items-center">
                        <Ionicons name="add" size={16} color="white" style={{ marginRight: 4 }} />
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium' }} className="text-white text-sm">Add more</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {images.map((img, i) => (
                    <View key={i} className="relative" style={{ width: '31%', aspectRatio: 3 / 4 }}>
                      <Image
                        source={{ uri: img.uri }}
                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                        resizeMode="cover"
                      />
                      {!uploading && (
                        <TouchableOpacity
                          onPress={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                        >
                          <Ionicons name="close" size={12} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Upload progress */}
            {uploading && (
              <View className="items-center gap-3 py-8 px-5">
                <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className="text-white text-xl">
                  Uploading {progress.current} of {progress.total}
                </Text>
                <View className="w-full bg-white/10 rounded-full" style={{ height: 4 }}>
                  <View
                    className="bg-[#FF6B35] rounded-full"
                    style={{ height: 4, width: `${progressPct * 100}%` }}
                  />
                </View>
                <Text style={{ fontFamily: 'HelveticaNeue' }} className="text-white/40 text-sm">
                  AI will classify each item automatically
                </Text>
              </View>
            )}

            {/* Submit */}
            {images.length > 0 && !uploading && (
              <View className="px-5 mt-6">
                <TouchableOpacity
                  onPress={handleUpload}
                  className="h-14 rounded-xl items-center justify-center shadow-lg shadow-orange-500/20"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className="text-white font-bold text-lg">
                    Upload {images.length > 1 ? `${images.length} Items` : 'Item'} & Analyse
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
