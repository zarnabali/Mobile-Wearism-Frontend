import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Alert,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../src/lib/apiClient';

const CATEGORIES = [
  'tops', 'bottoms', 'outerwear', 'footwear', 'accessories',
  'dresses', 'bags', 'jewelry', 'activewear', 'swimwear', 'other'
];
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];

export default function ProductCreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('new');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<Array<{ uri: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      // Step 1: Create product (draft)
      const res = await apiClient.post('/products', {
        name,
        description: description || undefined,
        category,
        condition,
        price: parseFloat(price),
        stock_quantity: parseInt(stock) || 1,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      return { product: res.data.product, publish };
    },
    onSuccess: async ({ product, publish }) => {
      const productId = product.id;

      // Step 2: Upload images if any
      if (images.length > 0) {
        setUploading(true);
        for (let i = 0; i < images.length; i++) {
          const form = new FormData();
          form.append('file', {
            uri: images[i].uri,
            name: images[i].name,
            type: 'image/jpeg',
          } as any);
          form.append('is_primary', String(i === 0));
          
          await apiClient.post(`/products/${productId}/images`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        setUploading(false);
      }

      // Step 3: Activate if publish
      if (publish) {
        await apiClient.patch(`/products/${productId}`, { status: 'active' });
      }

      qc.invalidateQueries({ queryKey: ['vendor-products'] });
      Alert.alert('Success', `Product ${publish ? 'published' : 'saved as draft'}.`);
      router.back();
    },
    onError: (err: any) => {
      setUploading(false);
      Alert.alert('Error', err.response?.data?.error || 'Could not create product.');
    },
  });

  const pickImage = async () => {
    if (images.length >= 6) {
      Alert.alert('Max images', 'You can upload up to 6 images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImages(prev => [...prev, { 
        uri: asset.uri, 
        name: asset.fileName || `prod_${Date.now()}_${prev.length}.jpg` 
      }]);
    }
  };

  const canSubmit = name.trim() && category && parseFloat(price) > 0 && !createMutation.isPending && !uploading;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center px-5 border-b border-white/10" style={{ paddingVertical: 14 }}>
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-white text-lg ml-4">
              New Product
            </Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              
              {/* Images Section */}
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-4 uppercase tracking-widest">
                Product Photos (Up to 6)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8" contentContainerStyle={{ gap: 12 }}>
                {images.map((img, i) => (
                  <View key={i} className="relative">
                    <Image source={{ uri: img.uri }} className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10" />
                    {i === 0 && (
                      <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#FF6B35', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 9 }}>PRIMARY</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-black"
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                {images.length < 6 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 items-center justify-center bg-white/5"
                  >
                    <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.2)" />
                    <Text className="text-white/20 text-[10px] mt-1 font-bold">ADD PHOTO</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Form Fields */}
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-2 uppercase tracking-widest">
                Product Name *
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 border border-white/10 mb-6">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Signature Leather Tote"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue' }}
                />
              </View>

              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-2 uppercase tracking-widest">
                Description
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 border border-white/10 mb-6">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell buyers about your product..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue', minHeight: 100, textAlignVertical: 'top' }}
                />
              </View>

              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-3 uppercase tracking-widest">
                Category *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-5 rounded-full border ${
                      category === cat ? 'bg-[#FF6B35] border-[#FF6B35]' : 'bg-white/5 border-white/10'
                    }`}
                    style={{ paddingVertical: 9, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className={`capitalize text-sm ${category === cat ? 'text-white' : 'text-white/60'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-2 uppercase tracking-widest">
                    Price (PKR) *
                  </Text>
                  <View className="bg-white/10 rounded-2xl px-4 border border-white/10">
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="numeric"
                      className="text-white text-[16px] font-bold"
                      style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue-Bold' }}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-2 uppercase tracking-widest">
                    Stock
                  </Text>
                  <View className="bg-white/10 rounded-2xl px-4 border border-white/10">
                    <TextInput
                      value={stock}
                      onChangeText={setStock}
                      placeholder="1"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="numeric"
                      className="text-white text-[16px] font-bold"
                      style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue-Bold' }}
                    />
                  </View>
                </View>
              </View>

              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-3 uppercase tracking-widest">
                Condition
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ gap: 8 }}>
                {CONDITIONS.map(cond => (
                  <TouchableOpacity
                    key={cond}
                    onPress={() => setCondition(cond)}
                    className={`px-5 rounded-full border ${
                      condition === cond ? 'bg-[#FF6B35] border-[#FF6B35]' : 'bg-white/5 border-white/10'
                    }`}
                    style={{ paddingVertical: 9, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className={`capitalize text-sm ${condition === cond ? 'text-white' : 'text-white/60'}`}>
                      {cond.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-2 uppercase tracking-widest">
                Tags (Comma separated)
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 border border-white/10 mb-6">
                <TextInput
                  value={tags}
                  onChangeText={setTags}
                  placeholder="luxury, silk, limited..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue' }}
                />
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {/* Action Bar */}
          <View className="absolute bottom-0 left-0 right-0 p-5 bg-black/80 backdrop-blur-lg border-t border-white/10 flex-row gap-4">
            <TouchableOpacity
              onPress={() => createMutation.mutate(false)}
              disabled={!canSubmit}
              className="flex-1 bg-white/5 h-14 rounded-full border border-white/10 items-center justify-center"
            >
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-white/60 uppercase tracking-widest">
                Save Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => createMutation.mutate(true)}
              disabled={!canSubmit}
              className="flex-1 bg-[#FF6B35] h-14 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
            >
              {createMutation.isPending || uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-white uppercase tracking-widest">
                  Publish Now
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
