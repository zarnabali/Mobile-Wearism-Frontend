import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { useCartStore } from '../../src/stores/cartStore';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const incrementCart = useCartStore((s) => s.increment);
  const cartCount = useCartStore((s) => s.count);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // ─── Fetch Product ────────────────────────────────────────────────────────
  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get(`/products/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const product = productData?.product ?? productData?.data ?? productData;
  const vendorProfile = product?.vendor_profiles ?? product?.vendor ?? null;

  const images =
    (Array.isArray(product?.product_images) && product.product_images.length > 0
      ? product.product_images
        .slice()
        .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((pi: any) => pi.image_url)
      : (product?.primary_image_url ? [product.primary_image_url] : [])) || [];

  const safeImages = images.length > 0 ? images : ['https://via.placeholder.com/600'];
  const isOutOfStock = product.stock_quantity === 0;

  const addToCartMutation = useMutation({
    mutationFn: () => apiClient.post('/cart/items', {
      product_id: id as string,
      quantity: 1
    }),
    onSuccess: () => {
      incrementCart();
      qc.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('Success', 'Added to cart!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error || 'Could not add to cart.');
    }
  });

  return (
    <View className="flex-1 bg-black">
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : !product ? (
        <View className="flex-1 bg-black justify-center items-center px-4">
          <Text className="text-white mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
            Product not found.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>

        {/* Floating header */}
        <SafeAreaView edges={['top']} className="absolute top-0 w-full z-20">
          <View className="px-6 h-16 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => router.push('/shop/cart')}
                activeOpacity={0.7}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cart-outline" size={22} color="white" />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* Cinematic Gallery */}
          <View style={{ width, height: width * 1.35 }} className="relative bg-black/20">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
              }}
            >
              {safeImages.map((img: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri: img }}
                  style={{ width, height: width * 1.35 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {/* Custom Slim Indicator */}
            {safeImages.length > 1 && (
              <View className="absolute bottom-10 w-full flex-row justify-center items-center gap-1.5">
                {safeImages.map((_: any, i: number) => (
                  <View
                    key={i}
                    style={{
                      width: i === activeImageIndex ? 16 : 4,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: i === activeImageIndex ? 'white' : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </View>
            )}

            <View
              style={{
                position: 'absolute', bottom: 30, right: 24, paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            >
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1 }}>
                {activeImageIndex + 1} / {safeImages.length}
              </Text>
            </View>
          </View>

          {/* Content Area */}
          <View className="px-6 pt-8">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="text-white/40 text-[11px] font-h-bold uppercase tracking-[3px]">
                {product.category || 'Collection'}
              </Text>
              {product.condition === 'preloved' && (
                <Text className="text-primary text-[10px] font-h-bold uppercase tracking-[2px]">Preloved</Text>
              )}
            </View>

            <Text className="text-white text-[32px] font-h-light leading-10 mb-2">
              {product.name}
            </Text>

            <View className="flex-row items-center mb-10">
              <Text className="text-white text-[28px] font-h-light">
                ${product.price?.toFixed(0)}
              </Text>
              <Text className="text-white/20 text-[14px] font-h-light ml-3 mt-1.5">
                Inclusive of VAT
              </Text>
            </View>

            {/* Vendor Section */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const vendorId = vendorProfile?.id ?? product?.vendor_id;
                if (vendorId) router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendorId)}` as any);
              }}
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 20, marginBottom: 40 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mr-4 border border-white/5">
                    {vendorProfile?.shop_logo_url ? (
                      <Image source={{ uri: vendorProfile.shop_logo_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    ) : (
                      <Ionicons name="storefront" size={20} color="rgba(255,255,255,0.3)" />
                    )}
                  </View>
                  <View>
                    <Text className="text-white text-[16px] font-h-bold">
                      {vendorProfile?.shop_name || vendorProfile?.brand_name || 'Vendor'}
                    </Text>
                    <Text className="text-white/40 text-[12px] font-h-light">Official Store</Text>
                  </View>
                </View>
                <View className="bg-white/5 px-4 py-2 rounded-full border border-white/5">
                  <Text className="text-white text-[11px] font-h-bold">Visit Shop</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Product Overview */}
            <View className="mb-12">
              <Text className="text-white/30 text-[11px] font-h-bold uppercase tracking-[4px] mb-6">
                The Silhouette
              </Text>
              <Text className="text-white/80 text-[16px] font-h-light leading-7">
                {product.description || 'A timeless addition to your wardrobe, crafted for those who value both form and function.'}
              </Text>
            </View>

            {/* Technical Details */}
            {product.ai_attributes && Object.keys(product.ai_attributes).length > 0 && (
              <View className="mb-20">
                <Text className="text-white/30 text-[11px] font-h-bold uppercase tracking-[4px] mb-8">
                  Composition
                </Text>
                <View className="bg-white/5 rounded-3xl overflow-hidden border border-white/5">
                  {Object.entries(product.ai_attributes).map(([key, val]: [string, any], i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingVertical: 18,
                        borderBottomWidth: i !== Object.keys(product.ai_attributes).length - 1 ? 0.5 : 0,
                        borderBottomColor: 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <Text className="text-white/40 text-[13px] font-h-light capitalize">{key.replace(/_/g, ' ')}</Text>
                      <Text className="text-white text-[13px] font-h-medium">
                        {Array.isArray(val) ? val.join(', ') : String(val)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* CTA Bar */}
        <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full">
          <View className="px-6 pb-8 pt-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
            <TouchableOpacity
              onPress={() => addToCartMutation.mutate()}
              disabled={isOutOfStock || addToCartMutation.isPending}
              activeOpacity={0.9}
              className={`flex-row items-center justify-center py-5 rounded-2xl ${isOutOfStock ? 'bg-white/5' : 'bg-[#FF6B35]'}`}
              style={!isOutOfStock ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 } : {}}
            >
              {addToCartMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: isOutOfStock ? 'rgba(255,255,255,0.2)' : 'white', fontSize: 17 }}>
                    {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>

      </LinearGradient>
      )}
    </View>
  );
}
