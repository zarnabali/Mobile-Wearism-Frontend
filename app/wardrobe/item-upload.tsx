import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView,
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
import { useAuthStore } from '../../src/stores/authStore';

// Condition values must match backend enum: new, like_new, good, fair, poor
const CONDITIONS = [
  { value: 'new', label: 'New with tags' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function ItemUploadScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore(s => s.user?.id) ?? 'unknown_user';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Pick Image ─────────────────────────────────────────────────────────
  const pickImage = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    };

    let result;
    if (camera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Camera access denied');
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ─── Upload Flow (same multipart pattern as create-post) ─────────────────
  const handleUpload = async () => {
    if (!imageUri) return Alert.alert('Missing Image', 'Please capture or select an image.');

    setLoading(true);
    try {
      const itemId = uuidv4();
      const filename = `${itemId}.jpg`;

      // Build multipart form — backend derives storage path from userId + item_id
      const form = new FormData();
      form.append('item_id', itemId);
      if (name.trim()) form.append('name', name.trim());
      if (brand.trim()) form.append('brand', brand.trim());
      if (condition) form.append('condition', condition);

      form.append('file', {
        uri: imageUri,
        name: filename,
        type: 'image/jpeg',
      } as any);

      // Same pattern as POST /posts — apiClient handles auth header via interceptor
      const { data } = await apiClient.post('/wardrobe/items', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Navigate to detail page; ai_status will be "pending" — detail page polls for it
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      setImageUri(null);
      setName('');
      setBrand('');
      setCondition('');

      const createdId = data?.item?.id ?? itemId;
      router.replace(`/wardrobe/item-detail?id=${createdId}` as any);

    } catch (err: any) {
      console.warn('[item-upload] error:', JSON.stringify(err.response?.data, null, 2));
      Alert.alert('Upload Failed', err.response?.data?.error ?? err.message ?? 'There was an issue uploading your item.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 h-14 border-b border-white/10">
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Add to Wardrobe
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {/* Image Picker Area */}
            <View className="aspect-[3/4] w-full bg-black/60 relative items-center justify-center">
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
                  {!loading && (
                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-md"
                    >
                      <Ionicons name="trash-outline" size={20} color="white" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View className="items-center justify-center space-y-4">
                  <Ionicons name="shirt-outline" size={64} color="rgba(255,255,255,0.2)" />
                  <View className="flex-row space-x-4 mt-4">
                    <TouchableOpacity
                      onPress={() => pickImage(true)}
                      className="bg-white/10 px-6 h-14 rounded-full border border-white/20 flex-row items-center"
                    >
                      <Ionicons name="camera-outline" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white font-medium">Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      className="bg-white/10 px-6 h-14 rounded-full border border-white/20 flex-row items-center"
                    >
                      <Ionicons name="image-outline" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white font-medium">Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Form Area */}
            <View className="px-5 mt-6">
              <View className="mb-4">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  Item Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Vintage Leather Jacket"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-white/10 border border-white/20 rounded-xl px-4 h-14 text-white text-[16px]"
                  style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  Brand (Optional)
                </Text>
                <TextInput
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="e.g. Zara"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="bg-white/10 border border-white/20 rounded-xl px-4 h-14 text-white text-[16px]"
                  style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                />
              </View>

              <View className="mb-6">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  Condition (Optional)
                </Text>
                <View className="flex-row flex-wrap">
                  {CONDITIONS.map(c => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setCondition(c.value)}
                      className="mr-2 mb-2 px-4 h-11 rounded-full border"
                      style={{
                        backgroundColor: condition === c.value ? '#FF6B35' : 'rgba(255,255,255,0.05)',
                        borderColor: condition === c.value ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text className={condition === c.value ? 'text-white' : 'text-white/60'} style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleUpload}
                disabled={loading || !imageUri || !name}
                className="h-14 rounded-xl items-center justify-center flex-row shadow-lg shadow-orange-500/20"
                style={{ backgroundColor: loading || !imageUri || !name ? 'rgba(255,107,53,0.5)' : '#FF6B35' }}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="white" style={{ marginRight: 10 }} />
                    <Text className="text-white font-bold text-lg" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                      Uploading...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white font-bold text-lg" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                    Upload & Analyse
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
