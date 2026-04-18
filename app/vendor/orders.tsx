import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Image, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import VendorNav from '../components/VendorNav';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

const { width } = Dimensions.get('window');
const TABS = ['all', 'pending', 'confirmed', 'shipped'] as const;
type Tab = typeof TABS[number];

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  pending:   { bg: 'rgba(255,152,0,0.1)',  border: 'rgba(255,152,0,0.3)',   text: '#FF9800' },
  confirmed: { bg: 'rgba(33,150,243,0.1)', border: 'rgba(33,150,243,0.3)',  text: '#2196F3' },
  shipped:   { bg: 'rgba(156,39,176,0.1)', border: 'rgba(156,39,176,0.3)',  text: '#9C27B0' },
  delivered: { bg: 'rgba(76,175,80,0.1)',  border: 'rgba(76,175,80,0.3)',   text: '#4CAF50' },
  cancelled: { bg: 'rgba(244,67,54,0.1)',  border: 'rgba(244,67,54,0.3)',   text: '#F44336' },
};

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

  const actionMutation = useMutation({
    mutationFn: ({ id, endpoint }: { id: string; endpoint: string }) =>
      apiClient.patch(`/orders/${id}/${endpoint}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', 'vendor'] });
      Alert.alert('Updated', 'Order status updated successfully.');
    },
    onError: (err: any) =>
      Alert.alert('Error', err.response?.data?.error ?? 'Could not update order.'),
  });

  const orders: any[] = data?.data ?? [];

  const handleAction = (orderId: string, currentStatus: string) => {
    const action = NEXT_ACTION[currentStatus];
    if (!action) return;
    Alert.alert(action.label, 'Proceed with this status update?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: () => actionMutation.mutate({ id: orderId, endpoint: action.endpoint }) },
    ]);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const ss = STATUS_STYLES[item.status] ?? { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', text: '#fff' };
    const nextAction = NEXT_ACTION[item.status];

    return (
      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
        {/* Order header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              Order #{item.id?.slice(0, 8)}
            </Text>
            <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 18, letterSpacing: -0.2 }}>
              {item.profiles?.full_name ?? item.profiles?.username ?? 'Customer'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={{ fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', fontSize: 26 }}>
               ${item.total_amount?.toFixed(0)}
             </Text>
             <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 }}>
               {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
             </Text>
          </View>
        </View>

        {/* Items */}
        <View style={{ marginBottom: 24 }}>
          {item.order_items?.map((line: any) => (
            <View key={line.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <Image
                  source={{ uri: line.product_image ?? 'https://via.placeholder.com/100' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 14 }} numberOfLines={1}>
                  {line.product_name}
                </Text>
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 3 }}>
                  {line.quantity} unit · ${line.unit_price?.toFixed(0)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Section */}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: ss.bg, borderWidth: 1, borderColor: ss.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: ss.text, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
              {item.status}
            </Text>
          </View>

          {nextAction && (
            <TouchableOpacity
              onPress={() => handleAction(item.id, item.status)}
              disabled={actionMutation.isPending}
              style={{ 
                backgroundColor: '#FF6B35', 
                paddingHorizontal: 22, 
                paddingVertical: 12, 
                borderRadius: 18, 
                shadowColor: '#FF6B35', 
                shadowOpacity: 0.3, 
                shadowRadius: 10, 
                shadowOffset: { width: 0, height: 4 },
                elevation: 4
              }}
              activeOpacity={0.8}
            >
              {actionMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 13, letterSpacing: 0.5 }}>
                  {nextAction.label}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient colors={['rgba(30,0,4,1)', 'rgba(0,0,0,1)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 18 }}>
                <Ionicons name="chevron-back" size={22} color="white" />
              </TouchableOpacity>
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>Orders</Text>
                <Text style={{ fontSize: 36, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4, letterSpacing: -0.5 }}>Manage</Text>
              </View>
            </View>
          </View>

          {/* Catalog-style filter chips */}
          <View style={{ height: 64, marginBottom: 12 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 12, alignItems: 'center' }}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.85}
                    style={{ 
                      height: 44,
                      paddingHorizontal: 24, 
                      backgroundColor: isActive ? '#FF6B35' : 'rgba(255,255,255,0.03)', 
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: isActive ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isActive ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 } : {})
                    }}
                  >
                    <Text style={{ 
                      fontFamily: 'HelveticaNeue-Light', 
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', 
                      fontSize: 14,
                      textTransform: 'capitalize',
                      letterSpacing: 0.2
                    }}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <FlatList
            style={{ flex: 1 }}
            data={orders}
            keyExtractor={i => i.id}
            renderItem={renderOrder}
            contentContainerStyle={{ padding: 24, paddingBottom: 140 }}
            refreshing={isLoading}
            onRefresh={refetch}
            ListEmptyComponent={
              !isLoading ? (
                <View style={{ paddingTop: 100, alignItems: 'center' }}>
                  <Ionicons name="receipt-outline" size={56} color="rgba(255,255,255,0.05)" />
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 16, marginTop: 20, textAlign: 'center' }}>
                    No {activeTab !== 'all' ? activeTab : ''} orders found
                  </Text>
                </View>
              ) : (
                <View style={{ paddingTop: 100 }}>
                   <ActivityIndicator color="#FF6B35" />
                </View>
              )
            }
          />
        </SafeAreaView>

        <VendorNav active="orders" />
      </LinearGradient>
      )}
    </View>
  );
}
