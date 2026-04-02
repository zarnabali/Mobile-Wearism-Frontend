import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { useCartStore } from '../../src/stores/cartStore';

export default function CheckoutScreen() {
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

  const cart = cartData?.cart || { items: [] };
  // Only checkout available items
  const items = (cart.items || []).filter((i: any) => i.is_available);
  
  const subtotal = items.reduce((acc: number, i: any) => acc + (i.product?.price * i.quantity), 0);
  const vendorIds = new Set(items.map((i: any) => i.product?.vendor_id));
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
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="px-5 py-4 border-b border-white/10 flex-row items-center z-10">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold tracking-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Checkout
            </Text>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              
              {/* Multi-vendor notice */}
              {isMultiVendor && (
                <View className="bg-[#FF6B35]/20 border border-[#FF6B35]/40 rounded-xl p-4 mb-6 flex-row items-start">
                  <Ionicons name="information-circle" size={20} color="#FF6B35" />
                  <Text className="text-white ml-3 flex-1 text-sm leading-5" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                    Your cart contains items from {vendorIds.size} different vendors. Your order will be split into {vendorIds.size} separate orders, and you will pay each vendor separately on delivery.
                  </Text>
                </View>
              )}

              {/* Order Summary list */}
              <View className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                <Text className="text-white/60 uppercase text-xs font-bold tracking-widest mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                  Order Summary
                </Text>
                {items.map((item: any, i: number) => (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: i !== 0 ? 0.5 : 0, borderTopColor: 'rgba(255,255,255,0.07)' }}>
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14 }} numberOfLines={1}>
                        {item.product?.name}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', marginTop: 3 }}>
                        {item.product?.vendor?.brand_name || 'Vendor'} · Qty {item.quantity}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 14 }}>
                      ${(item.product?.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                
                <View className="flex-row justify-between pt-4 mt-2 border-t border-white/10">
                  <Text className="text-white font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>Subtotal</Text>
                  <Text className="text-white font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>${subtotal.toFixed(2)}</Text>
                </View>
              </View>

              {/* Delivery Details Form */}
              <Text className="text-white text-lg font-bold mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                Delivery Details
              </Text>
              
              <View className="mb-4">
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Address *</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street address, building, apartment"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontFamily: 'HelveticaNeue', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                />
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>City *</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Lahore, Karachi, etc."
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontFamily: 'HelveticaNeue', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                />
              </View>

              <View className="mb-4">
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Phone *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Mobile number for delivery"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  keyboardType="phone-pad"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontFamily: 'HelveticaNeue', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                />
              </View>

              <View className="mb-6">
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Delivery Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special instructions for the rider…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontFamily: 'HelveticaNeue', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', minHeight: 88 }}
                />
              </View>

              {/* Payment Info */}
              <Text className="text-white text-lg font-bold mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                Payment Method
              </Text>
              <View className="bg-white/5 rounded-xl p-4 border border-white/10 flex-row items-center mb-8">
                <Ionicons name="cash-outline" size={24} color="#4ade80" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>Cash on Delivery</Text>
                  <Text className="text-white/50 text-xs mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>Pay securely when your package arrives at your door.</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
              </View>

            </ScrollView>

            {/* Sticky Submit Button */}
            <SafeAreaView edges={['bottom']} className="absolute bottom-0 w-full bg-black/95 pt-4 px-5 border-t border-white/10 backdrop-blur-xl">
              <TouchableOpacity
                onPress={() => checkoutMutation.mutate()}
                disabled={!canProceed || checkoutMutation.isPending}
                className={`w-full h-14 rounded-xl items-center mb-2 flex-row justify-center ${
                  canProceed ? 'bg-[#FF6B35] shadow-lg shadow-orange-500/20' : 'bg-white/10'
                }`}
                activeOpacity={0.8}
              >
                {checkoutMutation.isPending ? (
                  <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                ) : null}
                <Text
                  className="font-bold text-lg"
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: canProceed ? '#fff' : 'rgba(255,255,255,0.4)' }}
                >
                  Place Order
                </Text>
              </TouchableOpacity>
            </SafeAreaView>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
