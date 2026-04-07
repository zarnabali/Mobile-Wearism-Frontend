import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import BottomNav from '../components/BottomNav';

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
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }} numberOfLines={1}>
              {shopName}
            </Text>
          </View>

          {(vendorLoading || productsLoading) ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#FF6B35" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
              {/* Vendor card */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,107,53,0.15)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.35)', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
                    {vendor?.shop_logo_url ? (
                      <Image source={{ uri: vendor.shop_logo_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Ionicons name="storefront-outline" size={24} color="#FF6B35" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }} numberOfLines={1}>
                      {shopName}
                    </Text>
                    {description ? (
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', marginTop: 4, fontSize: 13 }} numberOfLines={3}>
                        {description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  {[
                    { label: 'Sales', value: vendor?.total_sales ?? 0 },
                    { label: 'Products', value: vendor?.products_count ?? products.length ?? 0 },
                    { label: 'Rating', value: vendor?.avg_rating ?? '—' },
                  ].map((m) => (
                    <View key={m.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingVertical: 10, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>
                        {String(m.value)}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {m.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Products */}
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.6)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 22, marginBottom: 12 }}>
                Products
              </Text>

              {products.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="cube-outline" size={44} color="rgba(255,255,255,0.18)" />
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>
                    No products yet.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {products.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => router.push(`/shop/product-detail?id=${p.id}` as any)}
                      activeOpacity={0.85}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 18, padding: 12 }}
                    >
                      <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginRight: 12, justifyContent: 'center', alignItems: 'center' }}>
                        {p.primary_image_url ? (
                          <Image source={{ uri: p.primary_image_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Ionicons name="image-outline" size={22} color="rgba(255,255,255,0.25)" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14 }} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 }}>
                          PKR {p.price}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
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

