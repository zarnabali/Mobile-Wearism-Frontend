import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, ImageBackground, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import VendorNav from '../components/VendorNav';
import { apiClient } from '../../src/lib/apiClient';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const CARD_BG = [
  require('../../assets/pictures/wardrobe.jpeg'),
  require('../../assets/pictures/shop.jpeg'),
  require('../../assets/pictures/social.jpeg'),
  require('../../assets/pictures/social2.jpeg'),
];

const STATUS_COLORS: Record<string, string> = {
  pending:    '#FF9800',
  processing: '#2196F3',
  shipped:    '#4CAF50',
  delivered:  '#8BC34A',
  cancelled:  '#F44336',
};

function formatCurrency(val: number) {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
  return `$${val.toFixed(0)}`;
}

export default function VendorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['vendor-stats'],
    queryFn: () => apiClient.get('/vendors/me/stats').then(r => r.data),
  });

  const summary = data?.summary ?? {};
  const recentOrders: any[] = data?.recent_orders ?? [];
  const ordersByStatus: Record<string, number> = data?.orders_by_status ?? {};

  const metricCards = [
    {
      label: 'Revenue',
      value: formatCurrency(summary.total_revenue ?? 0),
      icon: 'trending-up',
      color: '#FF6B35',
      bg: CARD_BG[0],
    },
    {
      label: 'Sales',
      value: String(summary.total_sales ?? 0),
      icon: 'bag-handle',
      color: '#4CAF50',
      bg: CARD_BG[1],
    },
    {
      label: 'Products',
      value: String(summary.products_count ?? 0),
      icon: 'cube',
      color: '#2196F3',
      bg: CARD_BG[2],
    },
    {
      label: 'Avg Rating',
      value: summary.avg_rating != null ? summary.avg_rating.toFixed(1) : '—',
      icon: 'star',
      color: '#FFD700',
      bg: CARD_BG[3],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Vendor Dashboard
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ fontSize: 30, fontFamily: 'HelveticaNeue-Thin', color: '#fff', flex: 1 }}>
                {summary.shop_name ?? 'Your Shop'}
              </Text>
              <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,107,53,0.15)', borderWidth: 1.5, borderColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="storefront" size={24} color="#FF6B35" />
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {/* ── Metric cards ── */}
            <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
              {isLoading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={{ width: cardWidth, height: 160, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color="rgba(255,107,53,0.4)" />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {metricCards.map(card => (
                    <View key={card.label} style={{ width: cardWidth, height: 160, borderRadius: 20, overflow: 'hidden' }}>
                      <ImageBackground source={card.bg} style={{ width: '100%', height: '100%' }} imageStyle={{ opacity: 0.3 }}>
                        <LinearGradient
                          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.88)']}
                          style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}
                        >
                          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: `${card.color}28`, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name={card.icon as any} size={22} color={card.color} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                              {card.label}
                            </Text>
                            <Text style={{ fontSize: 28, fontFamily: 'HelveticaNeue-Thin', color: '#fff' }}>
                              {card.value}
                            </Text>
                          </View>
                        </LinearGradient>
                      </ImageBackground>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Orders by status ── */}
            {Object.keys(ordersByStatus).length > 0 && (
              <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
                  Orders by Status
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(ordersByStatus).map(([status, count]) => (
                    <View
                      key={status}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: `${STATUS_COLORS[status] ?? '#fff'}33`,
                        borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
                      }}
                    >
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: STATUS_COLORS[status] ?? '#fff', marginRight: 7 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.7)', fontSize: 13, textTransform: 'capitalize' }}>
                        {status}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 13, marginLeft: 6 }}>
                        {count}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Recent orders ── */}
                {recentOrders.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    Recent Orders
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/vendor/orders' as any)}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 13 }}>See all</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 10 }}>
                  {recentOrders.slice(0, 5).map(order => (
                    <View
                      key={order.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
                        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                        flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14 }}>
                          Order #{order.id?.slice(-6) ?? '—'}
                        </Text>
                        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                          {order.items_count != null ? ` · ${order.items_count} item${order.items_count !== 1 ? 's' : ''}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 15 }}>
                          ${(order.total ?? 0).toFixed(2)}
                        </Text>
                        <View style={{
                          backgroundColor: `${STATUS_COLORS[order.status] ?? '#aaa'}22`,
                          borderWidth: 1, borderColor: `${STATUS_COLORS[order.status] ?? '#aaa'}55`,
                          borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
                        }}>
                          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: STATUS_COLORS[order.status] ?? '#aaa', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {order.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Quick actions ── */}
            <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
              <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
                Quick Actions
              </Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.push('/vendor/product-create' as any)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                      <Ionicons name="add-circle-outline" size={24} color="#FF6B35" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff' }}>Add New Product</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Expand your inventory</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/vendor/ads' as any)}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                      <Ionicons name="rocket-outline" size={24} color="rgba(255,255,255,0.7)" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff' }}>Create Ad Campaign</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Boost your visibility</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>

        <VendorNav active="dashboard" />
      </LinearGradient>
    </View>
  );
}
