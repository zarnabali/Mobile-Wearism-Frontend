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

  // ─── Add to Cart Mutation ─────────────────────────────────────────────────
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-4">
        <Text className="text-white mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
          Product not found.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images =
    (Array.isArray(product?.product_images) && product.product_images.length > 0
      ? product.product_images
          .slice()
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((pi: any) => pi.image_url)
      : (product?.primary_image_url ? [product.primary_image_url] : [])) || [];

  const safeImages = images.length > 0 ? images : ['https://via.placeholder.com/600'];
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        
        {/* Transparent floating header */}
        <SafeAreaView edges={['top']} className="absolute top-0 w-full z-10">
          <View className="px-5 h-14 flex-row justify-between items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity onPress={() => router.push('/orders/buyer' as any)} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                <Ionicons name="bag-outline" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/shop/cart')} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center backdrop-blur-md">
                <Ionicons name="cart-outline" size={24} color="white" />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: '#ef4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#000',
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
          {/* Image Gallery */}
          <View style={{ width, height: width * 1.2 }} className="relative">
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
              }}
            >
              {safeImages.map((img: string, i: number) => (
                <Image key={i} source={{ uri: img }} style={{ width, height: width * 1.2 }} className="bg-zinc-900" />
              ))}
            </ScrollView>
            
            {/* Dots */}
            {safeImages.length > 1 && (
              <View className="absolute bottom-4 w-full flex-row justify-center gap-2">
                {safeImages.map((_: any, i: number) => (
                  <View
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === activeImageIndex ? 'bg-[#FF6B35]' : 'bg-white/40'}`}
                  />
                ))}
              </View>
            )}

            {/* 1/3 indicator */}
            {safeImages.length > 1 && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 12 }}>
                  {Math.min(activeImageIndex + 1, safeImages.length)}/{safeImages.length}
                </Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View className="px-5 pt-6">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-white text-2xl flex-1 pr-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                {product.name}
              </Text>
              <Text className="text-white text-3xl tracking-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
                ${product.price?.toFixed(2)}
              </Text>
            </View>

            {/* Vendor Row */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                const vendorId = vendorProfile?.id ?? product?.vendor_id;
                if (vendorId) router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendorId)}` as any);
              }}
              className="flex-row items-center border-b border-white/10 mb-4 py-3"
            >
              <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3 overflow-hidden">
                {vendorProfile?.shop_logo_url ? (
                  <Image source={{ uri: vendorProfile.shop_logo_url }} style={{ width: 40, height: 40 }} />
                ) : (
                  <Ionicons name="storefront" size={20} color="rgba(255,255,255,0.6)" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white text-sm" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  {vendorProfile?.shop_name || vendorProfile?.brand_name || 'Vendor'}
                </Text>
                <Text className="text-[#FF6B35] text-xs pt-0.5 font-bold uppercase tracking-wider" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                   View Shop
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>

            {/* Chips */}
            <View className="flex-row flex-wrap gap-2 mb-6">
              <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  {product.category || 'Category'}
                </Text>
              </View>
              {product.condition && (
                <View style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
                  backgroundColor: product.condition === 'preloved' ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.1)',
                  borderColor: product.condition === 'preloved' ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: product.condition === 'preloved' ? '#FF6B35' : 'rgba(255,255,255,0.8)' }}>
                    {product.condition}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text className="text-white/90 text-sm leading-6 mb-8" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
              {product.description || 'No description provided.'}
            </Text>

            {/* AI Attributes if any */}
            {product.ai_attributes && Object.keys(product.ai_attributes).length > 0 && (
              <View className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-8">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-3" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                  Product Details
                </Text>
                {Object.entries(product.ai_attributes).map(([key, val]: [string, any], i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: i !== 0 ? 0.5 : 0, borderTopColor: 'rgba(255,255,255,0.07)' }}>
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize', fontSize: 14 }}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14, flexShrink: 1, textAlign: 'right', marginLeft: 16 }}>
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Bottom Bar */}
        <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full bg-black/90 pt-4 px-5 border-t border-white/10 backdrop-blur-xl">
          <TouchableOpacity
            onPress={() => addToCartMutation.mutate()}
            disabled={isOutOfStock || addToCartMutation.isPending}
            className={`w-full h-14 rounded-xl items-center shadow-lg shadow-orange-500/20 mb-2 flex-row justify-center ${
              isOutOfStock ? 'bg-white/10' : 'bg-[#FF6B35]'
            }`}
            activeOpacity={0.8}
          >
            {addToCartMutation.isPending ? (
              <ActivityIndicator color="white" style={{ marginRight: 8 }} />
            ) : null}
            <Text
              className="text-white font-bold text-lg"
              style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: isOutOfStock ? 'rgba(255,255,255,0.4)' : 'white' }}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

      </LinearGradient>
    </View>
  );
}
