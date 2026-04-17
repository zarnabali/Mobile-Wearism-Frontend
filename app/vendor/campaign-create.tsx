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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import VendorNav from '../components/VendorNav';
import { apiClient } from '../../src/lib/apiClient';

type VendorProduct = {
  id: string;
  name: string;
  primary_image_url?: string;
  price: number;
  stock_quantity?: number;
  status?: string;
};

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

  // Backend returns `{ success, products }` or raw array depending on route impl; support both.
  const products: VendorProduct[] = Array.isArray(productsRes)
    ? productsRes
    : (productsRes?.products ?? []);

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
      // Minimal v1: store as local URI (display only). Upload pipeline can be added later.
      setCoverUrl(asset.uri);
      Alert.alert(
        'Cover selected',
        'Cover upload will be wired next (storage path). For now this is a local preview.'
      );
    }
  };

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
      const payload: any = {
        title: title.trim(),
        motive: motive.trim() || undefined,
        description: description.trim() || undefined,
        status,
        product_ids: Array.from(selected),
        // cover_image_url is accepted by backend; for v1 this is a URL string.
        // Upload-to-storage can be added later; keep UI consistent now.
        cover_image_url: coverUrl && coverUrl.startsWith('http') ? coverUrl : undefined,
      };

      if (!payload.title) throw new Error('Title is required.');
      if (payload.product_ids.length === 0) throw new Error('Select at least 1 product.');

      if (isEdit) {
        const res = await apiClient.patch(`/campaigns/${id}`, payload);
        return res.data.campaign;
      }
      const res = await apiClient.post('/campaigns', payload);
      return res.data.campaign;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendor-campaigns'] });
      Alert.alert('Saved', 'Campaign saved.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || err.response?.data?.error || 'Could not save campaign.');
    },
  });

  const isBusy = createOrUpdateMutation.isPending || loadingExisting || loadingProducts;
  const selectedCount = selected.size;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 20 }}>
              {isEdit ? 'Edit Campaign' : 'New Campaign'}
            </Text>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
              {/* Cover */}
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Cover
              </Text>
              <TouchableOpacity
                onPress={pickCover}
                activeOpacity={0.8}
                style={{
                  height: 180,
                  borderRadius: 18,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,107,53,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  marginBottom: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {coverUrl ? (
                  <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={34} color="rgba(255,255,255,0.35)" />
                    <Text style={{ marginTop: 10, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)' }}>
                      Tap to select cover
                    </Text>
                    <Text style={{ marginTop: 4, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      4:5 works best (Instagram style)
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Title */}
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Title *
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, marginBottom: 16 }}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Summer T-Shirts Drop"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                />
              </View>

              {/* Motive */}
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Motive
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, marginBottom: 16 }}>
                <TextInput
                  value={motive}
                  onChangeText={setMotive}
                  placeholder="Why this campaign?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                />
              </View>

              {/* Description */}
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Description
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 14, marginBottom: 18 }}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What should users know?"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16, minHeight: 90, textAlignVertical: 'top' }}
                />
              </View>

              {/* Status */}
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
                Status
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
                {(['draft', 'active', 'paused'] as const).map((s) => {
                  const active = status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStatus(s)}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: active ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: active ? 'rgba(255,107,53,0.6)' : 'rgba(255,255,255,0.14)',
                        borderRadius: 999,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: active ? '#FF6B35' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.6 }}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Products */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Products ({selectedCount})
                </Text>
              </View>

              {loadingProducts ? (
                <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color="rgba(255,107,53,0.6)" />
                </View>
              ) : products.length === 0 ? (
                <View style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)' }}>
                    No products found.
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                    Add products to your inventory first.
                  </Text>
                </View>
              ) : (
                products
                  .filter((p) => p.status !== 'archived')
                  .map((p) => {
                    const isSelected = selected.has(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => toggleSelect(p.id)}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isSelected ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.07)',
                          padding: 12,
                          marginBottom: 12,
                        }}
                      >
                        {p.primary_image_url ? (
                          <Image
                            source={{ uri: p.primary_image_url }}
                            style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={{ width: 54, height: 54, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.3)" />
                          </View>
                        )}

                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 14 }} numberOfLines={2}>
                            {p.name}
                          </Text>
                          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                            PKR {Number(p.price || 0).toFixed(0)} · {(p.stock_quantity ?? 0)} in stock
                          </Text>
                        </View>

                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            borderWidth: 1,
                            borderColor: isSelected ? '#FF6B35' : 'rgba(255,255,255,0.25)',
                            backgroundColor: isSelected ? 'rgba(255,107,53,0.18)' : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {isSelected && <Ionicons name="checkmark" size={16} color="#FF6B35" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Action Bar */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(0,0,0,0.80)', borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.10)', flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                if (isEdit && id) {
                  Alert.alert('End campaign?', 'This will stop delivery and mark it ended.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'End',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await apiClient.patch(`/campaigns/${id}/end`);
                          qc.invalidateQueries({ queryKey: ['vendor-campaigns'] });
                          Alert.alert('Ended', 'Campaign ended.');
                          router.back();
                        } catch (e: any) {
                          Alert.alert('Error', e.response?.data?.error || 'Could not end campaign.');
                        }
                      },
                    },
                  ]);
                  return;
                }
                router.back();
              }}
              disabled={isBusy}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
                borderRadius: 999,
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {isEdit ? 'End' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => createOrUpdateMutation.mutate()}
              disabled={isBusy}
              style={{
                flex: 1,
                backgroundColor: '#FF6B35',
                borderRadius: 999,
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              {createOrUpdateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <VendorNav active="ads" />
      </LinearGradient>
    </View>
  );
}

