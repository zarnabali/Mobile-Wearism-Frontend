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
import { COLORS } from '../../src/constants/theme';

export default function CartScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const setCount = useCartStore((s) => s.setCount);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // ─── Fetch Cart ─────────────────────────────────────────────────────────
  const { data: cartData, isLoading, isFetching } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.get('/cart').then(r => r.data),
  });

  // Backend returns: { success: true, items, subtotal, item_count, unavailable_count }
  // Normalize to the UI shape used by this screen.
  const items = (cartData?.items ?? []).map((i: any) => ({
    ...i,
    product: i.products,
    is_available: true,
  }));

  // Sync global counter
  React.useEffect(() => {
    if (cartData) {
      const activeCount = items.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0);
      setCount(activeCount);
    }
  }, [cartData, items, setCount]);

  const unavailableCount = cartData?.unavailable_count ?? 0;
  const activeItems = items;
  const subtotal =
    typeof cartData?.subtotal === 'number'
      ? cartData.subtotal
      : activeItems.reduce((acc: number, i: any) => acc + ((i.product?.price || 0) * i.quantity), 0);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const updateQtyMutation = useMutation({
    mutationFn: ({ id, qty }: { id: string, qty: number }) => apiClient.patch(`/cart/items/${id}`, { quantity: qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onSettled: () => setUpdatingId(null),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/cart/items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onSettled: () => setDeletingId(null),
  });

  const handleUpdate = (id: string, current: number, delta: number) => {
    const next = current + delta;
    if (next < 1) handleDelete(id);
    else {
      setUpdatingId(id);
      updateQtyMutation.mutate({ id, qty: next });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setDeletingId(id);
          deleteItemMutation.mutate(id);
        },
      }
    ]);
  };

  // ─── Renderers ──────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, marginBottom: 16, borderBottomWidth: 0 }}>
      <Image
        source={{ uri: item.product?.primary_image_url ?? 'https://via.placeholder.com/100' }}
        style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)' }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          {item.product?.vendor_profiles?.shop_name ?? 'Vendor'}
        </Text>
        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 6 }} numberOfLines={1}>
          {item.product?.name}
        </Text>
        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 18 }}>
          ${item.product?.price?.toFixed(0)}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', height: 80 }}>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          disabled={deletingId === item.id || updatingId === item.id}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle-outline" size={20} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 4, paddingVertical: 4 }}>
          <TouchableOpacity
            onPress={() => handleUpdate(item.id, item.quantity, -1)}
            style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
            disabled={updatingId === item.id}
          >
            <Ionicons name="remove" size={16} color="white" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginHorizontal: 8, minWidth: 20, textAlign: 'center', fontSize: 13 }}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => handleUpdate(item.id, item.quantity, 1)}
            style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
            disabled={updatingId === item.id}
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-6 py-6 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="chevron-back" size={22} color="white" />
              </TouchableOpacity>
              <View className="ml-5">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Checkout</Text>
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 24, marginTop: 1 }}>My Cart</Text>
              </View>
            </View>
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

              {/* Summary Bar */}
              {activeItems.length > 0 && (
                <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full">
                  <View className="px-6 pb-8 pt-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
                    <View className="flex-row justify-between items-end mb-6">
                      <View>
                        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Subtotal</Text>
                        <Text style={{ fontFamily: 'HelveticaNeue-light', color: '#fff', fontSize: 26 }}>${subtotal.toFixed(0)}</Text>
                      </View>
                      <View className="bg-white/5 px-4 py-2 rounded-full border border-white/5">
                        <Text className="text-white/40 text-[11px] font-h-bold uppercase tracking-wider">{activeItems.length} ITEMS</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => router.push('/shop/checkout')}
                      activeOpacity={0.9}
                      className="bg-[#FF6B35] py-5 rounded-2xl flex-row items-center justify-center"
                      style={{ shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 17 }}>PROCEED TO CHECKOUT</Text>
                      <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              )}
            </>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
