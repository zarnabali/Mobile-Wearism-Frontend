import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: 'rgba(255,152,0,0.15)',  border: 'rgba(255,152,0,0.5)',  text: '#FF9800' },
  confirmed: { bg: 'rgba(33,150,243,0.15)', border: 'rgba(33,150,243,0.5)', text: '#2196F3' },
  shipped:   { bg: 'rgba(156,39,176,0.15)', border: 'rgba(156,39,176,0.5)', text: '#9C27B0' },
  delivered: { bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.5)',  text: '#4CAF50' },
  cancelled: { bg: 'rgba(244,67,54,0.15)',  border: 'rgba(244,67,54,0.5)',  text: '#F44336' },
  default:   { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.2)', text: '#fff' },
};

export default function BuyerOrdersScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Fetch Orders ───────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', 'buyer'],
    queryFn: () => apiClient.get('/orders').then(r => r.data),
  });

  // Backend uses standard paginated response:
  // { success: true, data: orders[], pagination: {...} }
  const orders = data?.data || [];

  // ─── Cancel Order Mutation ──────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'buyer'] });
      Alert.alert('Success', 'Order cancelled successfully.');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Could not cancel order.'),
  });

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No, keep it', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelMutation.mutate(id) }
    ]);
  };

  // ─── Status styles ──────────────────────────────────────────────────────

  const renderOrder = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;

    const statusStyle = STATUS_STYLES[item.status] ?? STATUS_STYLES.default;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              Order #{item.id.slice(0, 8)}
            </Text>
            <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 15 }}>
              {item.vendor_profiles?.shop_name || 'Vendor'}
            </Text>
          </View>
          <View style={{ backgroundColor: statusStyle.bg, borderWidth: 1, borderColor: statusStyle.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: statusStyle.text, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#FF6B35', fontSize: 20 }}>
            ${item.total_amount?.toFixed(2)}
          </Text>
        </View>

        {/* Expanded view */}
        {isExpanded && (
          <View style={{ paddingTop: 14 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Items</Text>
            {item.order_items?.map((line: any) => (
              <View key={line.id} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
                <Image source={{ uri: line.product_image ?? 'https://via.placeholder.com/50' }} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#333' }} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{line.product_name}</Text>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                    Qty: {line.quantity} · ${(line.unit_price * line.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>Delivery</Text>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{item.delivery_address}, {item.delivery_city}</Text>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2, marginBottom: 16 }}>{item.delivery_phone}</Text>

            {item.status === 'pending' && (
              <TouchableOpacity
                onPress={() => handleCancel(item.id)}
                disabled={cancelMutation.isPending}
                style={{ width: '100%', backgroundColor: 'rgba(244,67,54,0.15)', paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(244,67,54,0.35)', alignItems: 'center' }}
              >
                {cancelMutation.isPending
                  ? <ActivityIndicator size="small" color="#f44336" />
                  : <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#f44336', fontSize: 15 }}>Cancel Order</Text>}
              </TouchableOpacity>
            )}
          </View>
        )}

        {!isExpanded && (
          <View style={{ paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginRight: 4 }}>Tap to view details</Text>
            <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.35)" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
              My Orders
            </Text>
          </View>

          <FlatList
            data={orders}
            keyExtractor={(i) => i.id}
            renderItem={renderOrder}
            contentContainerStyle={{ padding: 20 }}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={() => (
              <View className="pt-20 items-center justify-center">
                {!isLoading && (
                  <>
                    <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text className="text-white/60 text-center mt-4 text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                      You have no orders yet.
                    </Text>
                  </>
                )}
              </View>
            )}
          />

        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
