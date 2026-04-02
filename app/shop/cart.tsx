import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { useCartStore } from '../../src/stores/cartStore';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';

export default function CartScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const setCount = useCartStore((s) => s.setCount);

  // ─── Fetch Cart ─────────────────────────────────────────────────────────
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(r => r.data),
  });

  const cart = cartData?.cart || { items: [] };
  const items = cart.items || [];

  // Sync global counter
  React.useEffect(() => {
    if (cartData) {
      const activeCount = items.filter((i: any) => i.is_available).reduce((acc: number, i: any) => acc + i.quantity, 0);
      setCount(activeCount);
    }
  }, [cartData, items, setCount]);

  const unavailableCount = items.filter((i: any) => !i.is_available).length;
  const activeItems = items.filter((i: any) => i.is_available);
  const subtotal = activeItems.reduce((acc: number, i: any) => acc + (i.product?.price * i.quantity), 0);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string, qty: number }) => apiClient.patch(`/cart/items/${id}`, { quantity: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cart/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const handleUpdate = (id: string, current: number, delta: number) => {
    const next = current + delta;
    if (next < 1) handleDelete(id);
    else updateQtyMutation.mutate({ id, qty: next });
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteItemMutation.mutate(id) }
    ]);
  };

  // ─── Renderers ──────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: item.is_available ? 'rgba(255,255,255,0.05)' : 'rgba(255,50,50,0.05)', borderRadius: 20, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: item.is_available ? 'rgba(255,255,255,0.1)' : 'rgba(255,100,100,0.3)' }}>
      <Image
        source={{ uri: item.product?.images?.[0] ?? 'https://via.placeholder.com/100' }}
        style={{ width: 68, height: 68, borderRadius: 12, backgroundColor: '#222' }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
          {item.product?.vendor?.brand_name ?? 'Vendor'}
        </Text>
        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14, marginBottom: 4 }} numberOfLines={1}>
          {item.product?.name}
        </Text>
        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#FF6B35', fontSize: 18 }}>
          ${item.product?.price?.toFixed(2)}
        </Text>
      </View>

      {item.is_available ? (
        <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }}>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
            <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 }}>
            <TouchableOpacity onPress={() => handleUpdate(item.id, item.quantity, -1)} style={{ padding: 2 }}>
              <Ionicons name="remove" size={16} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginHorizontal: 10, minWidth: 16, textAlign: 'center' }}>
              {item.quantity}
            </Text>
            <TouchableOpacity onPress={() => handleUpdate(item.id, item.quantity, 1)} style={{ padding: 2 }}>
              <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#f87171', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Sold Out</Text>
          <TouchableOpacity
            onPress={() => deleteItemMutation.mutate(item.id)}
            style={{ backgroundColor: 'rgba(255,80,80,0.15)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)' }}
          >
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#f87171', fontSize: 12 }}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-4 border-b border-white/10 flex-row items-center z-10">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold tracking-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              My Cart
            </Text>
          </View>

          {isLoading ? (
            <View className="px-5 mt-4">
              {Array(3).fill(0).map((_, i) => (
                <View key={i} className="flex-row items-center bg-white/5 rounded-2xl p-3 mb-4 border border-white/10">
                  <Skeleton className="w-[70px] h-[70px] rounded-xl" />
                  <View className="flex-1 ml-4 justify-center">
                    <Skeleton className="w-20 h-3 mb-2" />
                    <Skeleton className="w-32 h-4 mb-2" />
                    <Skeleton className="w-16 h-5" />
                  </View>
                </View>
              ))}
            </View>
          ) : items.length === 0 ? (
            <EmptyState
              icon="bag-outline"
              title="Your cart is empty"
              subtitle="Looks like you haven't added anything to your cart yet."
              actionLabel="Browse Shop"
              onAction={() => router.push('/shop/catalog')}
            />
          ) : (
            <>
              {unavailableCount > 0 && (
                <View className="bg-red-500/20 px-5 py-3 border-b border-red-500/30 flex-row items-center">
                  <Ionicons name="warning" size={18} color="#f87171" style={{ marginRight: 10, flexShrink: 0 }} />
                  <Text className="text-red-200 flex-1 text-sm leading-5" style={{ fontFamily: 'HelveticaNeue' }}>
                    {unavailableCount} item{unavailableCount > 1 ? 's' : ''} in your cart {unavailableCount > 1 ? 'are' : 'is'} no longer available and {unavailableCount > 1 ? 'have' : 'has'} been removed.
                  </Text>
                </View>
              )}

              <FlatList
                data={items}
                keyExtractor={(i) => i.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
              />

              {/* Fixed Bottom Checkout Bar */}
              {activeItems.length > 0 && (
                <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full bg-black/90 pt-4 px-5 pb-2 border-t border-white/10 backdrop-blur-xl">
                  <View className="flex-row justify-between items-center mb-4 px-2">
                    <Text className="text-white/60 text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>Subtotal</Text>
                    <Text className="text-white text-2xl tracking-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
                      ${subtotal.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push('/shop/checkout')}
                    className="w-full bg-[#FF6B35] h-14 rounded-xl items-center shadow-lg shadow-orange-500/20"
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-bold text-lg" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                      Proceed to Checkout
                    </Text>
                  </TouchableOpacity>
                </SafeAreaView>
              )}
            </>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
