import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../../src/lib/apiClient';
import VendorNav from '../../components/VendorNav';

const TABS = ['all', 'pending', 'confirmed', 'shipped'] as const;
type Tab = typeof TABS[number];

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: 'rgba(255,152,0,0.15)',  border: 'rgba(255,152,0,0.4)',   text: '#FF9800' },
  confirmed: { bg: 'rgba(33,150,243,0.15)', border: 'rgba(33,150,243,0.4)',  text: '#2196F3' },
  shipped:   { bg: 'rgba(156,39,176,0.15)', border: 'rgba(156,39,176,0.4)',  text: '#9C27B0' },
  delivered: { bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.4)',   text: '#4CAF50' },
  cancelled: { bg: 'rgba(244,67,54,0.15)',  border: 'rgba(244,67,54,0.4)',   text: '#F44336' },
};

const NEXT_ACTION: Record<string, { label: string; endpoint: string }> = {
  pending:   { label: 'Confirm',        endpoint: 'confirm'  },
  confirmed: { label: 'Mark Shipped',   endpoint: 'ship'     },
  shipped:   { label: 'Mark Delivered', endpoint: 'deliver'  },
};

export default function VendorOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  // ─── Fetch Orders ───────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', 'vendor', activeTab],
    queryFn: () => {
      const url = activeTab === 'all' ? '/orders/vendor' : `/orders/vendor?status=${activeTab}`;
      return apiClient.get(url).then(r => r.data);
    },
  });

  const orders: any[] = data?.data ?? [];

  // ─── Update Status Mutation ─────────────────────────────────────────────
  const actionMutation = useMutation({
    mutationFn: ({ id, endpoint }: { id: string; endpoint: string }) =>
      apiClient.patch(`/orders/${id}/${endpoint}`),
    onSuccess: (_, { endpoint }) => {
      qc.invalidateQueries({ queryKey: ['orders', 'vendor'] });
      const messages: Record<string, string> = {
        confirm: 'Order confirmed.',
        ship: 'Order marked as shipped.',
        deliver: 'Order marked as delivered.',
      };
      Alert.alert('Updated', messages[endpoint] ?? 'Status updated.');
    },
    onError: (err: any) =>
      Alert.alert('Error', err.response?.data?.error || 'Could not update order.'),
  });

  const handleNextStep = (orderId: string, currentStatus: string) => {
    const action = NEXT_ACTION[currentStatus];
    if (!action) return;
    Alert.alert(action.label, 'Are you sure you want to update this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Update', onPress: () => actionMutation.mutate({ id: orderId, endpoint: action.endpoint }) },
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  const renderOrder = ({ item }: { item: any }) => {
    const ss = STATUS_STYLES[item.status] ?? { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', text: '#fff' };
    const nextAction = NEXT_ACTION[item.status];

    return (
      <View className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10 relative">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Order #{item.id.slice(0,8)}
            </Text>
            <Text className="text-white text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
              {item.profiles?.full_name || item.profiles?.username || 'Customer'}
            </Text>
            <Text className="text-white/40 text-xs mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </Text>
          </View>
          <Text className="text-[#FF6B35] font-light text-xl" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
            ${item.total_amount?.toFixed(2)}
          </Text>
        </View>

        <Text className="text-white/80 font-bold text-xs mt-2 mb-2 uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
          Items ({item.order_items?.length ?? 0})
        </Text>
        {item.order_items?.map((line: any) => (
          <View key={line.id} className="flex-row mb-3 items-center">
            <Image
              source={{ uri: line.product_image || 'https://via.placeholder.com/50' }}
              style={{ width: 40, height: 40, borderRadius: 8 }}
              className="bg-zinc-800"
            />
            <View className="flex-1 ml-3">
              <Text className="text-white/90 text-sm" numberOfLines={1} style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                {line.product_name}
              </Text>
              <Text className="text-white/40 text-xs mt-0.5" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                Qty: {line.quantity} • ${(line.unit_price * line.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        <View className="mt-2 pt-3 border-t border-white/10">
          <Text className="text-white/80 font-bold text-xs mb-1 uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
            Delivery To
          </Text>
          <Text className="text-white/60 text-sm" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
            {item.delivery_address}
          </Text>
          <Text className="text-white/60 text-sm mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
            {item.delivery_city} • {item.delivery_phone}
          </Text>

          <View className="flex-row items-center justify-between">
            <View
              style={{
                backgroundColor: ss.bg,
                borderWidth: 1,
                borderColor: ss.border,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text className="text-white/80 text-xs font-bold uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: ss.text }}>
                {item.status}
              </Text>
            </View>

            {nextAction && (
              <TouchableOpacity
                onPress={() => handleNextStep(item.id, item.status)}
                disabled={actionMutation.isPending}
                className="bg-[#FF6B35] px-4 h-14 rounded-xl shadow-lg shadow-orange-500/20"
              >
                <Text className="text-white font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                  {nextAction.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-[0.9]" edges={['top']}>
          {/* Header */}
          <View className="px-5 h-14 border-b border-white/10 flex-row items-center z-10">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold tracking-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Vendor Orders
            </Text>
          </View>

          {/* Status Tabs */}
          <View className="px-5 h-14 border-b border-white/5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`px-4 h-14 bg-white/5 rounded-full border ${activeTab === tab ? 'bg-[#FF6B35]/20 border-[#FF6B35]' : 'border-white/20'}`}
                >
                  <Text
                    style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium', color: activeTab === tab ? '#FF6B35' : 'rgba(255,255,255,0.6)' }}
                    className="capitalize text-sm"
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={orders}
            keyExtractor={(i) => i.id}
            renderItem={renderOrder}
            contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={() => (
              <View className="pt-20 items-center justify-center">
                {!isLoading && (
                  <>
                    <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text className="text-white/60 text-center mt-4 text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                      No {activeTab !== 'all' ? activeTab : ''} orders found.
                    </Text>
                  </>
                )}
              </View>
            )}
          />
        </SafeAreaView>
        <VendorNav active="orders" />
      </LinearGradient>
    </View>
  );
}
