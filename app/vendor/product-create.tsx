import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, Alert,
  Image, ActivityIndicator, KeyboardAvoidingView, Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiClient } from '../../src/lib/apiClient';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

const CATEGORIES = [
  'tops', 'bottoms', 'outerwear', 'footwear', 'accessories',
  'dresses', 'bags', 'jewelry', 'activewear', 'swimwear', 'other'
];
const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];

const { width } = Dimensions.get('window');

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

        if (publish) updates.status = 'active';

        if (Object.keys(updates).length) {
          await apiClient.patch(`/products/${existingProduct.id}`, updates);
        } else if (publish && existingProduct.status !== 'active') {
          await apiClient.patch(`/products/${existingProduct.id}`, { status: 'active' });
        }

        return { product: { id: existingProduct.id }, publish };
      }

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

      if (images.length > 0) {
        setUploading(true);
        for (let i = 0; i < images.length; i++) {
          const form = new FormData();
          form.append('file', {
            uri: images[i].uri,
            name: images[i].name,
            type: 'image/jpeg',
          } as any);
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
  const isBusy = loadingExisting || uploading || createMutation.isPending;

  return (
    <View className="flex-1 bg-black">
      {isBusy ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient colors={['rgba(30,0,4,1)', 'rgba(0,0,0,1)']} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View className="px-6 pt-6 pb-8 flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()} 
              activeOpacity={0.7}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <View className="ml-5">
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Catalog</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Thin', color: '#fff', fontSize: 32, marginTop: 4, letterSpacing: -0.5 }}>
                 {isEdit ? 'Edit Item' : 'New Item'}
              </Text>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
              
              {/* Images Section */}
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>
                Product Photos
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
                {images.map((img, i) => (
                  <View key={i} style={{ width: (width - 48 - 24) / 3, aspectRatio: 1 }}>
                    <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                    {i === 0 && (
                      <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: '#FF6B35', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 8 }}>MAIN</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#000', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {isEdit && visibleExistingImages.map((img) => (
                  <View key={img.id} style={{ width: (width - 48 - 24) / 3, aspectRatio: 1 }}>
                    <Image source={{ uri: img.image_url }} style={{ width: '100%', height: '100%', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                    <TouchableOpacity
                      onPress={() => deleteExistingImageMutation.mutate({ productId: existingProduct.id, imageId: img.id })}
                      style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#000', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length + visibleExistingImages.length < 6 && (
                  <View style={{ width: (width - 48 - 24) / 3, aspectRatio: 1 }}>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        borderRadius: 24, 
                        borderStyle: 'dashed', 
                        borderWidth: 1.5, 
                        borderColor: 'rgba(255,255,255,0.2)', 
                        backgroundColor: 'rgba(255,255,255,0.06)', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      <Ionicons name="camera-outline" size={28} color="rgba(255,255,255,0.5)" />
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 8 }}>ADD</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Form Fields */}
              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Product Name</Text>
                <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Minimalist Linen Shirt"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}
                  />
                </View>
              </View>

              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Description</Text>
                <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the fabric, fit, and feel..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    multiline
                    style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16, minHeight: 140, textAlignVertical: 'top' }}
                  />
                </View>
              </View>

              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 16, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.8}
                      style={{ 
                        paddingHorizontal: 22, 
                        paddingVertical: 12, 
                        borderRadius: 24, 
                        backgroundColor: category === cat ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                        borderWidth: 1.5,
                        borderColor: category === cat ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                        ...(category === cat ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 } : {})
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: category === cat ? '#fff' : 'rgba(255,255,255,0.9)', fontSize: 14, textTransform: 'capitalize' }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View className="flex-row gap-6 mb-10">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Price ($)</Text>
                  <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Quantity</Text>
                  <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                    <TextInput
                      value={stock}
                      onChangeText={setStock}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}
                    />
                  </View>
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {/* Action Bar */}
          <View className="absolute bottom-0 left-0 right-0 p-8 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex-row gap-5">
            <TouchableOpacity
              onPress={() => createMutation.mutate(false)}
              disabled={!canSubmit}
              style={{ flex: 1, height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 1 }}>SAVE DRAFT</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => createMutation.mutate(true)}
              disabled={!canSubmit}
              style={{ 
                flex: 1.5, 
                height: 64, 
                borderRadius: 24, 
                backgroundColor: '#FF6B35', 
                alignItems: 'center', 
                justifyContent: 'center',
                shadowColor: '#FF6B35',
                shadowOpacity: 0.3,
                shadowRadius: 15,
                shadowOffset: { width: 0, height: 8 },
                elevation: 6
              }}
            >
              {createMutation.isPending || uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 14, letterSpacing: 1 }}>
                  {isEdit ? 'UPDATE ITEM' : 'PUBLISH NOW'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
      )}
    </View>
  );
}
