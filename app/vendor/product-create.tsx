import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Alert,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('new');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<Array<{ uri: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [removedExistingImageIds, setRemovedExistingImageIds] = useState<Set<string>>(new Set());

  const { data: existingRes, isLoading: loadingExisting } = useQuery({
    queryKey: ['vendor-product', id],
    queryFn: () => apiClient.get(`/vendors/me/products/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const existingProduct = existingRes?.product;
  const existingImages: Array<{ id: string; image_url: string; is_primary?: boolean }> =
    existingProduct?.product_images ?? [];
  const visibleExistingImages = useMemo(
    () => existingImages.filter((img) => !removedExistingImageIds.has(img.id)),
    [existingImages, removedExistingImageIds],
  );
  const hasExistingPrimary =
    !!existingProduct?.primary_image_url || existingImages.some((img) => img.is_primary);

  const initialSnapshot = useMemo(() => {
    if (!existingProduct) return null;
    return {
      name: existingProduct.name ?? '',
      description: existingProduct.description ?? '',
      category: existingProduct.category ?? '',
      condition: existingProduct.condition ?? 'new',
      price: existingProduct.price != null ? String(existingProduct.price) : '',
      stock: existingProduct.stock_quantity != null ? String(existingProduct.stock_quantity) : '0',
      tags: Array.isArray(existingProduct.tags) ? existingProduct.tags.join(', ') : '',
    };
  }, [existingProduct]);

  useEffect(() => {
    if (!isEdit || !initialSnapshot) return;
    setName(initialSnapshot.name);
    setDescription(initialSnapshot.description);
    setCategory(initialSnapshot.category);
    setCondition(initialSnapshot.condition);
    setPrice(initialSnapshot.price);
    setStock(initialSnapshot.stock);
    setTags(initialSnapshot.tags);
    // Note: keep `images` empty; existing images are already on product.
    setRemovedExistingImageIds(new Set());
  }, [isEdit, initialSnapshot]);

  const deleteExistingImageMutation = useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      await apiClient.delete(`/products/${productId}/images/${imageId}`);
      return { productId, imageId };
    },
    onSuccess: ({ productId, imageId }) => {
      setRemovedExistingImageIds((prev) => {
        const next = new Set(prev);
        next.add(imageId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ['vendor-product', productId] });
      qc.invalidateQueries({ queryKey: ['vendor-products'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error || 'Could not delete image.');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      if (isEdit) {
        if (!existingProduct) throw new Error('Product not loaded yet.');

        const next = {
          name: name.trim(),
          description: description || undefined,
          category,
          condition,
          price: parseFloat(price),
          stock_quantity: parseInt(stock) || 0,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        };

        const updates: any = {};
        if (!initialSnapshot) throw new Error('Initial snapshot missing.');

        if (next.name !== initialSnapshot.name) updates.name = next.name;
        if ((next.description ?? '') !== (initialSnapshot.description ?? '')) updates.description = next.description;
        if (next.category !== initialSnapshot.category) updates.category = next.category;
        if (next.condition !== initialSnapshot.condition) updates.condition = next.condition;
        if (String(next.price) !== String(parseFloat(initialSnapshot.price || '0'))) updates.price = next.price;
        if (String(next.stock_quantity) !== String(parseInt(initialSnapshot.stock || '0'))) updates.stock_quantity = next.stock_quantity;
        if (next.tags.join(',') !== (initialSnapshot.tags || '').split(',').map(t => t.trim()).filter(Boolean).join(',')) updates.tags = next.tags;

        // If user tapped publish, force status active.
        if (publish) updates.status = 'active';

        if (Object.keys(updates).length) {
          await apiClient.patch(`/products/${existingProduct.id}`, updates);
        } else if (publish && existingProduct.status !== 'active') {
          await apiClient.patch(`/products/${existingProduct.id}`, { status: 'active' });
        }

        return { product: { id: existingProduct.id }, publish };
      }

      // Create mode
      const res = await apiClient.post('/products', {
        name: name.trim(),
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
          // Prevent overwriting primary image in edit mode unless the product has no images yet.
          const shouldSetPrimary = !isEdit
            ? i === 0
            : (!hasExistingPrimary && existingImages.length === 0 && i === 0);
          form.append('is_primary', String(shouldSetPrimary));
          
          await apiClient.post(`/products/${productId}/images`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
        setUploading(false);
      }

      // Step 3: Activate if publish
      // In edit mode, publish may already have been done via PATCH above.
      if (!isEdit && publish) await apiClient.patch(`/products/${productId}/activate`);

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

  const canSubmit = name.trim() && category && parseFloat(price) > 0 && !createMutation.isPending && !uploading && (!isEdit || !loadingExisting);

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
              {isEdit ? 'Edit Product' : 'New Product'}
            </Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              
              {/* Images Section */}
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/50 text-xs mb-4 uppercase tracking-widest">
                Product Photos (Up to 6)
              </Text>

              {isEdit && existingImages.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/40 text-[10px] mb-3 uppercase tracking-widest">
                    Currently Added
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                    {visibleExistingImages
                      .slice()
                      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                      .map((img) => (
                        <View key={img.id} className="relative">
                          <Image source={{ uri: img.image_url }} className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10" />
                          {img.is_primary && (
                            <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#FF6B35', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 9 }}>PRIMARY</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              if (!existingProduct?.id) return;
                              Alert.alert(
                                'Remove image?',
                                'This will delete the image from the product.',
                                [
                                  { text: 'Cancel', style: 'cancel' },
                                  {
                                    text: 'Remove',
                                    style: 'destructive',
                                    onPress: () => deleteExistingImageMutation.mutate({ productId: existingProduct.id, imageId: img.id }),
                                  },
                                ],
                              );
                            }}
                            disabled={deleteExistingImageMutation.isPending || uploading || createMutation.isPending}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center border-2 border-black"
                          >
                            <Ionicons name="close" size={14} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                  </ScrollView>
                  <Text style={{ marginTop: 10, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
                    Adding more photos will keep existing ones and append new uploads.
                  </Text>
                </View>
              )}

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
            {isEdit ? (
              <TouchableOpacity
                onPress={() => {
                  if (!existingProduct?.id) return;
                  Alert.alert(
                    'Delete product?',
                    'This will remove the product from your inventory. This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await apiClient.delete(`/products/${existingProduct.id}`);
                            qc.invalidateQueries({ queryKey: ['vendor-products'] });
                            Alert.alert('Deleted', 'Product deleted.');
                            router.back();
                          } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.error || 'Could not delete product.');
                          }
                        },
                      },
                    ],
                  );
                }}
                disabled={createMutation.isPending || uploading || loadingExisting}
                className="flex-1 bg-red-500/15 h-14 rounded-full border border-red-500/30 items-center justify-center"
              >
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-red-400 uppercase tracking-widest">
                  Delete
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => createMutation.mutate(false)}
                disabled={!canSubmit}
                className="flex-1 bg-white/5 h-14 rounded-full border border-white/10 items-center justify-center"
              >
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-white/60 uppercase tracking-widest">
                  Save Draft
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => createMutation.mutate(isEdit ? false : true)}
              disabled={!canSubmit}
              className="flex-1 bg-[#FF6B35] h-14 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
            >
              {createMutation.isPending || uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-white uppercase tracking-widest">
                  {isEdit ? 'Update' : 'Publish Now'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
