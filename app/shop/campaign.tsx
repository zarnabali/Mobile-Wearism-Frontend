import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

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
    return <ModeSwitchOverlay />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()} 
              activeOpacity={0.7}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <View className="ml-5">
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Featured Collection</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 22, marginTop: 1 }} numberOfLines={1}>{campaign?.title ?? 'Campaign'}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {/* Editorial Cover */}
            <View style={{ borderRadius: 32, overflow: 'hidden', marginBottom: 24, backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {campaign?.cover_image_url ? (
                <Image source={{ uri: campaign.cover_image_url }} style={{ width: '100%', height: 400 }} resizeMode="cover" />
              ) : (
                <View style={{ width: '100%', height: 300, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.05)" />
                </View>
              )}
              
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.8)']} 
                className="absolute bottom-0 w-full p-8"
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
                  Curated by {vendor?.shop_name ?? 'Wearism'}
                </Text>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 28 }}>
                  {campaign?.title}
                </Text>
              </LinearGradient>
            </View>

            {/* Campaign Story */}
            <View className="mb-12 px-2">
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 28 }}>
                {campaign?.description || 'Explore the latest trends and curated styles in this exclusive collection.'}
              </Text>
            </View>

            {/* Curated Products */}
            <View className="flex-row items-center justify-between mb-8 px-2">
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                The Collection
              </Text>
              <View className="h-[0.5px] bg-white/10 flex-1 ml-4" />
            </View>

            <View style={{ gap: 16 }}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => router.push(`/shop/product-detail?id=${p.id}` as any)}
                  activeOpacity={0.8}
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginRight: 16 }}>
                    {p.primary_image_url ? (
                      <Image source={{ uri: p.primary_image_url }} style={{ width: 80, height: 80 }} />
                    ) : (
                      <Ionicons name="shirt-outline" size={24} color="rgba(255,255,255,0.1)" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 4 }} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}>
                      ${Number(p.price || 0).toFixed(0)}
                    </Text>
                  </View>
                  <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {products.length === 0 && (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Ionicons name="bag-outline" size={40} color="rgba(255,255,255,0.2)" />
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
                  No products in this campaign.
                </Text>
              </View>
            )}

            {/* Store Link */}
            {vendor?.id && (
              <TouchableOpacity
                onPress={() => router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendor.id)}` as any)}
                activeOpacity={0.8}
                style={{ marginTop: 40, borderRadius: 24, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={{ padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mr-4 border border-white/5">
                      <Ionicons name="storefront" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>{vendor.shop_name}</Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>View Storefront</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

