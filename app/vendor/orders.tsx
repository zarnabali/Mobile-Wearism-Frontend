import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import VendorNav from '../components/VendorNav';

const TABS = ['all', 'pending', 'confirmed', 'shipped'] as const;
type Tab = typeof TABS[number];

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: 'rgba(255,152,0,0.15)',  border: 'rgba(255,152,0,0.4)',   text: '#FF9800' },
  confirmed: { bg: 'rgba(33,150,243,0.15)', border: 'rgba(33,150,243,0.4)',  text: '#2196F3' },
  shipped:   { bg: 'rgba(156,39,176,0.15)', border: 'rgba(156,39,176,0.4)',  text: '#9C27B0' },
  delivered: { bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.4)',   text: '#4CAF50' },
  cancelled: { bg: 'rgba(244,67,54,0.15)',  border: 'rgba(244,67,54,0.4)',   text: '#F44336' },
};

// Per-status action config  (spec: confirm|ship|deliver)
const NEXT_ACTION: Record<string, { label: string; endpoint: string }> = {
  pending:   { label: 'Confirm',       endpoint: 'confirm'  },
  confirmed: { label: 'Mark Shipped',  endpoint: 'ship'     },
  shipped:   { label: 'Mark Delivered', endpoint: 'deliver' },
};

export default function VendorOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', 'vendor', activeTab],
    queryFn: () => {
      const url = activeTab === 'all' ? '/orders/vendor' : `/orders/vendor?status=${activeTab}`;
      return apiClient.get(url).then(r => r.data);
    },
  });

  // Backend returns paginated result: { success, data: orders[], pagination }
  const orders: any[] = data?.data ?? [];

  // Single mutation that calls the correct sub-endpoint
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
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update order.'),
  });

  const handleAction = (orderId: string, currentStatus: string) => {
    const action = NEXT_ACTION[currentStatus];
    if (!action) return;
    Alert.alert(action.label, 'Are you sure you want to proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => actionMutation.mutate({ id: orderId, endpoint: action.endpoint }) },
    ]);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const ss = STATUS_STYLES[item.status] ?? { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', text: '#fff' };
    const nextAction = NEXT_ACTION[item.status];

    return (
      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        {/* Order header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Order #{item.id?.slice(0, 8)}
            </Text>
            <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 15 }}>
              {item.profiles?.full_name ?? item.profiles?.username ?? 'Customer'}
            </Text>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 3 }}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </Text>
          </View>
          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#FF6B35', fontSize: 22 }}>
            ${item.total_amount?.toFixed(2)}
          </Text>
        </View>

        {/* Items */}
        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Items ({item.order_items?.length ?? 0})
        </Text>
        {item.order_items?.map((line: any) => (
          <View key={line.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Image
              source={{ uri: line.product_image ?? 'https://via.placeholder.com/50' }}
              style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#333' }}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 13 }} numberOfLines={1}>
                {line.product_name}
              </Text>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                Qty: {line.quantity} · ${(line.unit_price * line.quantity).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        {/* Delivery & actions */}
        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14, marginTop: 4 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Deliver To</Text>
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            {item.delivery_address}
          </Text>
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, marginBottom: 14 }}>
            {item.delivery_city} · {item.delivery_phone}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Status badge */}
            <View style={{ backgroundColor: ss.bg, borderWidth: 1, borderColor: ss.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: ss.text, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.status}
              </Text>
            </View>

            {/* Action button */}
            {nextAction && (
              <TouchableOpacity
                onPress={() => handleAction(item.id, item.status)}
                disabled={actionMutation.isPending}
                style={{ backgroundColor: '#FF6B35', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}
                activeOpacity={0.8}
              >
                {actionMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 13 }}>
                    {nextAction.label}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 20 }}>Orders</Text>
          </View>

          {/* Status filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
                  backgroundColor: activeTab === tab ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.06)',
                  borderColor: activeTab === tab ? 'rgba(255,107,53,0.6)' : 'rgba(255,255,255,0.14)',
                }}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: activeTab === tab ? '#FF6B35' : 'rgba(255,255,255,0.55)', fontSize: 14, textTransform: 'capitalize' }}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={orders}
            keyExtractor={i => i.id}
            renderItem={renderOrder}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={
              !isLoading ? (
                <View style={{ paddingTop: 80, alignItems: 'center' }}>
                  <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" />
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 15, marginTop: 16, textAlign: 'center' }}>
                    No {activeTab !== 'all' ? activeTab : ''} orders found.
                  </Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>

        <VendorNav active="orders" />
      </LinearGradient>
    </View>
  );
}
