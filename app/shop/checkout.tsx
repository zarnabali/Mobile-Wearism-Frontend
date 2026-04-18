import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { useCartStore } from '../../src/stores/cartStore';
import { COLORS } from '../../src/constants/theme';

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const setCount = useCartStore((s) => s.setCount);

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // ─── Fetch Cart ─────────────────────────────────────────────────────────
  const { data: cartData, isLoading } = useQuery({
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

  const subtotal =
    typeof cartData?.subtotal === 'number'
      ? cartData.subtotal
      : items.reduce((acc: number, i: any) => acc + ((i.product?.price || 0) * i.quantity), 0);

  const vendorIds = new Set(items.map((i: any) => i.product?.vendor_profiles?.id).filter(Boolean));
  const isMultiVendor = vendorIds.size > 1;

  // ─── Mutations ──────────────────────────────────────────────────────────
  const checkoutMutation = useMutation({
    mutationFn: () => apiClient.post('/orders', {
      delivery_address: address,
      delivery_city: city,
      delivery_phone: phone,
      delivery_notes: notes || undefined,
    }),
    onSuccess: () => {
      setCount(0); // clear local cart badge
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully and you will receive updates soon.',
        [{ text: 'View Orders', onPress: () => router.replace('/orders/buyer') }]
      );
    },
    onError: (err: any) => {
      Alert.alert('Checkout Failed', err.response?.data?.error || 'Could not place your order.');
    }
  });

  const canProceed = items.length > 0 && address.trim() && city.trim() && phone.trim();

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  // Prevent accessing checkout with empty cart
  if (items.length === 0) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-5">
        <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16, marginBottom: 20 }}>
          Your cart is empty or items are unavailable.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: '#FF6B35', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 15 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View className="px-6 py-6 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={22} color="white" />
            </TouchableOpacity>
            <View className="ml-5">
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Secure Payment</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 24, marginTop: 1 }}>Checkout</Text>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {/* Multi-vendor notice */}
              {isMultiVendor && (
                <View className="bg-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-xl p-4 mb-6 flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#FF6B35" />
                  <Text className="text-white ml-3 flex-1 text-sm leading-5" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                    Your cart contains items from {vendorIds.size} different vendors. Your order will be split into {vendorIds.size} separate orders, and you will pay each vendor separately on delivery.
                  </Text>
                </View>
              )}

              {/* Order Summary */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, marginBottom: 32 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
                  Order Summary
                </Text>
                {items.map((item: any, i: number) => (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: i !== 0 ? 0.5 : 0, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.9)', fontSize: 14 }} numberOfLines={1}>
                        {item.product?.name}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>
                        Qty {item.quantity}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'HelveticaNeue-light', color: '#fff', fontSize: 14 }}>
                      ${(item.product?.price * item.quantity).toFixed(0)}
                    </Text>
                  </View>
                ))}

                <View className="flex-row justify-between pt-6 mt-2 border-t border-white/5">
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 16 }}>Subtotal</Text>
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 16 }}>${subtotal.toFixed(0)}</Text>
                </View>
              </View>

              {/* Delivery Details Form */}
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>
                Delivery Details
              </Text>

              <View className="mb-6">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8, marginLeft: 4 }}>Full Address</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, Building, Apartment"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-h-light text-[15px]"
                />
              </View>

              <View className="mb-6">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8, marginLeft: 4 }}>City</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your city"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-h-light text-[15px]"
                />
              </View>

              <View className="mb-6">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8, marginLeft: 4 }}>Phone Number</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="For delivery updates"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  keyboardType="phone-pad"
                  className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-h-light text-[15px]"
                />
              </View>

              <View className="mb-10">
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8, marginLeft: 4 }}>Delivery Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any instructions for the rider?"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-h-light text-[15px] min-h-[100px]"
                />
              </View>

              {/* Payment Method */}
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
                Payment Method
              </Text>
              <View className="bg-white/5 rounded-2xl p-5 border border-white/5 flex-row items-center mb-10">
                <View className="w-12 h-12 rounded-full bg-green-500/10 items-center justify-center">
                  <Ionicons name="cash-outline" size={24} color="#4ade80" />
                </View>
                <View className="ml-4 flex-1">
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 15 }}>Cash on Delivery</Text>
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>Secure payment at your doorstep</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {/* CTA Bar */}
          <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full">
            <View className="px-6 pb-8 pt-4 bg-black/40 backdrop-blur-xl border-t border-white/5">
              <TouchableOpacity
                onPress={() => checkoutMutation.mutate()}
                disabled={!canProceed || checkoutMutation.isPending}
                activeOpacity={0.9}
                className={`py-5 rounded-2xl flex-row items-center justify-center ${!canProceed ? 'bg-white/5' : 'bg-[#FF6B35]'}`}
                style={canProceed ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 } : {}}
              >
                {checkoutMutation.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: !canProceed ? 'rgba(255,255,255,0.2)' : 'white', fontSize: 16 }}>
                      PLACE ORDER
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
