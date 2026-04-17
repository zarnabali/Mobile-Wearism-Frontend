import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';

export default function CampaignScreen() {
  const router = useRouter();
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-active', campaignId],
    queryFn: () => apiClient.get(`/campaigns/${campaignId}`).then((r) => r.data),
    enabled: !!campaignId,
  });

  const campaign = data?.campaign;
  const products: any[] = campaign?.products ?? [];
  const vendor = campaign?.vendor_profiles ?? null;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }} numberOfLines={1}>
                {campaign?.title ?? 'Campaign'}
              </Text>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {vendor?.shop_name ?? 'Sponsored'}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {/* Cover */}
            <View style={{ borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              {campaign?.cover_image_url ? (
                <Image source={{ uri: campaign.cover_image_url }} style={{ width: '100%', height: 260, backgroundColor: 'rgba(255,255,255,0.05)' }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.2)" />
                </View>
              )}
            </View>

            {/* Title + description */}
            <View style={{ marginTop: 14 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>
                {campaign?.title ?? 'Campaign'}
              </Text>
              {campaign?.description ? (
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                  {campaign.description}
                </Text>
              ) : null}
            </View>

            {/* Products */}
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 18, marginBottom: 10 }}>
              Products ({products.length})
            </Text>

            {products.map((p) => (
              <TouchableOpacity
                key={p.id}
                activeOpacity={0.85}
                onPress={() => router.push(`/shop/product-detail?id=${p.id}` as any)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                {p.primary_image_url ? (
                  <Image source={{ uri: p.primary_image_url }} style={{ width: 62, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' }} resizeMode="cover" />
                ) : (
                  <View style={{ width: 62, height: 62, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shirt-outline" size={26} color="rgba(255,255,255,0.25)" />
                  </View>
                )}

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 14 }} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 6 }}>
                    PKR {Number(p.price || 0).toFixed(0)}
                    {p.stock_quantity != null ? ` · ${p.stock_quantity} in stock` : ''}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            ))}

            {products.length === 0 && (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Ionicons name="bag-outline" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
                  No products in this campaign.
                </Text>
              </View>
            )}

            {/* Vendor link */}
            {vendor?.id && (
              <TouchableOpacity
                onPress={() => router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendor.id)}` as any)}
                activeOpacity={0.8}
                style={{
                  marginTop: 8,
                  backgroundColor: 'rgba(255,107,53,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,107,53,0.35)',
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="storefront" size={18} color="#FF6B35" />
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', marginLeft: 8 }}>
                    View {vendor.shop_name ?? 'Store'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#FF6B35" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

