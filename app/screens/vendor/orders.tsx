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

const TABS = ['all', 'pending', 'confirmed', 'shipped'];

export default function VendorOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  // ─── Fetch Orders ───────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', 'vendor', activeTab],
    queryFn: () => {
      const url = activeTab === 'all' ? '/orders/vendor' : `/orders/vendor?status=${activeTab}`;
      return apiClient.get(url).then(r => r.data);
    },
  });

  const orders = data?.orders || [];

  // ─── Update Status Mutation ─────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => 
      apiClient.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'vendor'] });
      Alert.alert('Status Updated', 'Order track moved forward successfully.');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Could not update status.'),
  });

  const handleNextStep = (orderId: string, currentStatus: string) => {
    let nextStatus = '';
    let actionText = '';
    
    if (currentStatus === 'pending') {
      nextStatus = 'confirmed';
      actionText = 'Confirm Order';
    } else if (currentStatus === 'confirmed') {
      nextStatus = 'shipped';
      actionText = 'Mark as Shipped';
    } else if (currentStatus === 'shipped') {
      nextStatus = 'delivered';
      actionText = 'Mark as Delivered';
    } else {
      return; 
    }

    Alert.alert(actionText, 'Are you sure you want to update this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Update', onPress: () => updateStatusMutation.mutate({ id: orderId, status: nextStatus }) }
    ]);
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  const renderOrder = ({ item }: { item: any }) => (
    <View className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10 relative">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
            Order #{item.id.slice(0,8)}
          </Text>
          <Text className="text-white text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
            {item.buyer?.full_name || item.buyer?.username || 'Customer'}
          </Text>
          <Text className="text-white/40 text-xs mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
        <Text className="text-[#FF6B35] font-light text-xl" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
          ${item.total_amount?.toFixed(2)}
        </Text>
      </View>

      <Text className="text-white/80 font-bold text-xs mt-2 mb-2 uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>Items ({item.items?.length})</Text>
      {item.items?.map((line: any) => (
        <View key={line.id} className="flex-row mb-3 items-center">
          <Image
            source={{ uri: line.product?.images?.[0] || 'https://via.placeholder.com/50' }}
            style={{ width: 40, height: 40, borderRadius: 8 }}
            className="bg-zinc-800"
          />
          <View className="flex-1 ml-3">
            <Text className="text-white/90 text-sm" numberOfLines={1} style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>{line.product?.name}</Text>
            <Text className="text-white/40 text-xs mt-0.5" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>Qty: {line.quantity} • ${(line.price * line.quantity).toFixed(2)}</Text>
          </View>
        </View>
      ))}

      <View className="mt-2 pt-3 border-t border-white/10">
        <Text className="text-white/80 font-bold text-xs mb-1 uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>Delivery To</Text>
        <Text className="text-white/60 text-sm" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>{item.delivery_address}</Text>
        <Text className="text-white/60 text-sm mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>{item.delivery_city} • {item.delivery_phone}</Text>

        <View className="flex-row items-center justify-between">
          <View className="bg-white/10 px-3 h-14 rounded-full">
            <Text className="text-white/80 text-xs font-bold uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>{item.status}</Text>
          </View>
          
          {(['pending', 'confirmed', 'shipped'].includes(item.status)) && (
            <TouchableOpacity
              onPress={() => handleNextStep(item.id, item.status)}
              disabled={updateStatusMutation.isPending}
              className="bg-[#FF6B35] px-4 h-14 rounded-xl shadow-lg shadow-orange-500/20"
            >
              <Text className="text-white font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                {item.status === 'pending' ? 'Confirm' : 
                 item.status === 'confirmed' ? 'Mark Shipped' : 'Mark Delivered'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

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
        <VendorNav active={'dashboard'} />
      </LinearGradient>
    </View>
  );
}
