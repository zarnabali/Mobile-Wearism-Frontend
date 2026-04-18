import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../src/lib/apiClient';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

type VendorProduct = {
  id: string;
  name: string;
  primary_image_url?: string;
  price: number;
  stock_quantity?: number;
  status?: string;
};

const { width } = Dimensions.get('window');

export default function CampaignCreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [motive, setMotive] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'paused' | 'ended'>('draft');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: existingRes, isLoading: loadingExisting } = useQuery({
    queryKey: ['vendor-campaign', id],
    queryFn: () => apiClient.get(`/campaigns/me/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const existingCampaign = existingRes?.campaign;

  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: () => apiClient.get('/vendors/me/products').then((r) => r.data),
  });

  const products: VendorProduct[] = productsRes?.products ?? (Array.isArray(productsRes) ? productsRes : []);

  const initialSnapshot = useMemo(() => {
    if (!existingCampaign) return null;
    return {
      title: existingCampaign.title ?? '',
      motive: existingCampaign.motive ?? '',
      description: existingCampaign.description ?? '',
      status: existingCampaign.status ?? 'draft',
      cover_image_url: existingCampaign.cover_image_url ?? null,
      product_ids: (existingCampaign.products ?? []).map((p: any) => p.id),
    };
  }, [existingCampaign]);

  useEffect(() => {
    if (!isEdit || !initialSnapshot) return;
    setTitle(initialSnapshot.title);
    setMotive(initialSnapshot.motive);
    setDescription(initialSnapshot.description);
    setStatus(initialSnapshot.status);
    setCoverUrl(initialSnapshot.cover_image_url);
    setSelected(new Set(initialSnapshot.product_ids));
  }, [isEdit, initialSnapshot]);

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 5],
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setCoverUrl(asset.uri);
    }
  };

  function buildImageFormData(uri: string) {
    const form = new FormData();
    const ext = uri.split('.').pop()?.toLowerCase();
    const name = `cover_${Date.now()}.${ext && ext.length <= 5 ? ext : 'jpg'}`;
    const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('file', { uri, name, type } as any);
    return form;
  }

  const toggleSelect = (pid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const createOrUpdateMutation = useMutation({
    mutationFn: async () => {
      const hasLocalCover = !!coverUrl && !coverUrl.startsWith('http');
      const payload: any = {
        title: title.trim(),
        motive: motive.trim() || undefined,
        description: description.trim() || undefined,
        status,
        product_ids: Array.from(selected),
        cover_image_url: coverUrl && coverUrl.startsWith('http') ? coverUrl : undefined,
      };
      if (!payload.title) throw new Error('Title is required.');
      if (payload.product_ids.length === 0) throw new Error('Select at least 1 product.');

      if (isEdit) {
        const res = await apiClient.patch(`/campaigns/${id}`, payload);
        let campaign = res.data.campaign;
        if (hasLocalCover && coverUrl) {
          const form = buildImageFormData(coverUrl);
          const up = await apiClient.post(`/campaigns/${id}/cover`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
          campaign = up.data.campaign;
        }
        return campaign;
      }
      const res = await apiClient.post('/campaigns', payload);
      let campaign = res.data.campaign;
      if (hasLocalCover && coverUrl) {
        const form = buildImageFormData(coverUrl);
        const up = await apiClient.post(`/campaigns/${campaign.id}/cover`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        campaign = up.data.campaign;
      }
      return campaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-campaigns'] });
      Alert.alert('Saved', 'Campaign updated successfully.');
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.message || 'Could not save campaign.'),
  });

  const isBusy = createOrUpdateMutation.isPending || loadingExisting || loadingProducts;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isBusy ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient colors={['rgba(30,0,4,1)', 'rgba(0,0,0,1)']} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View className="px-6 pt-6 pb-8 flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <View className="ml-5">
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.8)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Campaigns</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Thin', color: '#fff', fontSize: 32, marginTop: 4, letterSpacing: -0.5 }}>{isEdit ? 'Edit Campaign' : 'New Campaign'}</Text>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
              
              {/* Cover Picker */}
              <TouchableOpacity
                onPress={pickCover}
                activeOpacity={0.9}
                style={{ height: 240, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 40 }}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.3)" />
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 16 }}>Upload Cover Art</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title Input */}
              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Campaign Title</Text>
                <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Summer Essentials 2024"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}
                  />
                </View>
              </View>

              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Campaign Motive</Text>
                <View className="bg-white/8 rounded-2xl px-5 border border-white/15">
                  <TextInput
                    value={motive}
                    onChangeText={setMotive}
                    placeholder="Briefly describe the theme..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={{ paddingVertical: 20, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}
                  />
                </View>
              </View>

              {/* Status Selector */}
              <View className="mb-12">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 12, marginBottom: 18, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Campaign Status</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(['draft', 'active', 'paused'] as const).map((s) => {
                    const active = status === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setStatus(s)}
                        activeOpacity={0.8}
                        style={{
                          flex: 1,
                          height: 52,
                          borderRadius: 18,
                          backgroundColor: active ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)',
                          borderWidth: 1,
                          borderColor: active ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          ...(active ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 } : {})
                        }}
                      >
                        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: active ? '#FF6B35' : 'rgba(255,255,255,0.65)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Product Selection List */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginLeft: 4 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5 }}>Link Products</Text>
                <View style={{ backgroundColor: 'rgba(255,107,53,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 10 }}>{selected.size} SELECTED</Text>
                </View>
              </View>

              {loadingProducts ? <ActivityIndicator color="#FF6B35" /> : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                  {products.map((p) => {
                    const isSelected = selected.has(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => toggleSelect(p.id)}
                        activeOpacity={0.9}
                        style={{ 
                          width: (width - 48 - 16) / 2, // 2 columns
                          backgroundColor: 'rgba(255,255,255,0.03)', 
                          borderRadius: 28, 
                          overflow: 'hidden',
                          borderWidth: 1, 
                          borderColor: isSelected ? '#FF6B35' : 'rgba(255,255,255,0.05)',
                          position: 'relative'
                        }}
                      >
                        <Image 
                          source={{ uri: p.primary_image_url || 'https://via.placeholder.com/150' }} 
                          style={{ width: '100%', height: 160 }} 
                          resizeMode="cover"
                        />
                        <View style={{ padding: 12 }}>
                          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 14 }} numberOfLines={1}>{p.name}</Text>
                          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>${p.price}</Text>
                        </View>

                        {/* Selection Indicator */}
                        <View style={{ 
                          position: 'absolute', 
                          top: 10, 
                          right: 10, 
                          width: 24, 
                          height: 24, 
                          borderRadius: 12, 
                          backgroundColor: isSelected ? '#FF6B35' : 'rgba(0,0,0,0.3)',
                          borderWidth: 1,
                          borderColor: isSelected ? '#FF6B35' : 'rgba(255,255,255,0.2)',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)' // Note: This doesn't work in standard RN but gives the idea
                        }}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          <View className="absolute bottom-0 left-0 right-0 p-8 bg-black/80 backdrop-blur-3xl border-t border-white/5">
            <TouchableOpacity
              onPress={() => createOrUpdateMutation.mutate()}
              disabled={isBusy}
              style={{ height: 64, borderRadius: 24, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}
            >
              {createOrUpdateMutation.isPending ? <ActivityIndicator color="white" /> : (
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16, letterSpacing: 1.5 }}>SAVE CAMPAIGN</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
      )}
    </View>
  );
}
