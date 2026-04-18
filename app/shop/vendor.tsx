import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import BottomNav from '../components/BottomNav';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

export default function VendorStorefrontScreen() {
  const router = useRouter();
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();

  const { data: vendorRes, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor-public', vendorId],
    queryFn: () => apiClient.get(`/vendors/${vendorId}`).then(r => r.data),
    enabled: !!vendorId,
  });

  const { data: productsRes, isLoading: productsLoading } = useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: () => apiClient.get(`/vendors/${vendorId}/products?page=1&limit=50`).then(r => r.data),
    enabled: !!vendorId,
  });

  const vendor = vendorRes?.vendor ?? vendorRes?.data ?? vendorRes;
  const products: any[] = productsRes?.data ?? productsRes?.products ?? [];

  const shopName = vendor?.shop_name ?? vendor?.brand_name ?? 'Vendor';
  const description = vendor?.shop_description ?? vendor?.description ?? '';

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
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Official Store</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 22, marginTop: 1 }} numberOfLines={1}>{shopName}</Text>
            </View>
          </View>

          {(vendorLoading || productsLoading) ? (
            <ModeSwitchOverlay />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
              {/* Vendor Profile Card */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 32, padding: 24, marginBottom: 40 }}>
                <View className="items-center mb-8">
                  <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' }}>
                    {vendor?.shop_logo_url ? (
                      <Image source={{ uri: vendor.shop_logo_url }} style={{ width: 80, height: 80 }} />
                    ) : (
                      <Ionicons name="storefront" size={32} color="rgba(255,255,255,0.2)" />
                    )}
                  </View>
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 24, marginBottom: 8 }}>{shopName}</Text>
                  {description ? (
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textAlign: 'center', fontSize: 14, lineHeight: 22 }}>
                      {description}
                    </Text>
                  ) : (
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 13 }}>
                      Discover the curated collection from {shopName}.
                    </Text>
                  )}
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
                  {[
                    { label: 'Products', value: vendor?.products_count ?? products.length ?? 0 },
                    { label: 'Sales', value: vendor?.total_sales ?? 0 },
                    { label: 'Rating', value: vendor?.avg_rating ?? '4.9' },
                  ].map((m) => (
                    <View key={m.label} style={{ alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 18 }}>
                        {String(m.value)}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
                        {m.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Products Collection */}
              <View className="flex-row items-center justify-between mb-8">
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
                  Collection
                </Text>
                <View className="h-[0.5px] bg-white/10 flex-1 ml-4" />
              </View>

              {products.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Ionicons name="cube-outline" size={48} color="rgba(255,255,255,0.05)" />
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.2)', marginTop: 16, fontSize: 14 }}>
                    New styles arriving soon.
                  </Text>
                </View>
              ) : (
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
                          <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.1)" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 4 }} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}>
                          ${p.price?.toFixed(0)}
                        </Text>
                      </View>
                      <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>

        <BottomNav active="shop" />
      </LinearGradient>
    </View>
  );
}

