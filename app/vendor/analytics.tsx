import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import VendorNav from '../components/VendorNav';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

type Overview = {
  revenue_pkr?: number;
  orders_count?: number;
  campaign_impressions?: number;
  campaign_clicks?: number;
  campaign_opens?: number;
  campaign_purchases?: number;
  ctr?: number;
  click_to_purchase_rate?: number;
};

type ProductRow = {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  orders: number;
};

type CampaignTypeRow = {
  type: string;
  campaign_count: number;
  impressions: number;
  clicks: number;
  ctr: number;
};

function formatCompact(n: number) {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatPkr(n: number) {
  if (!Number.isFinite(n)) return 'PKR 0';
  return `PKR ${Math.round(n).toLocaleString('en-PK')}`;
}

function pct(ratio: number) {
  if (!Number.isFinite(ratio)) return '0%';
  return `${(ratio * 100).toFixed(1)}%`;
}

const VendorAnalytics = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendor-analytics'],
    queryFn: () => apiClient.get('/vendors/me/analytics').then((r) => r.data),
  });

  const analytics = data?.analytics;
  const overview: Overview = analytics?.overview ?? {};
  const products: ProductRow[] = analytics?.products ?? [];
  const byType: CampaignTypeRow[] = analytics?.campaigns_by_type ?? [];

  const overviewStats = useMemo(
    () => [
      {
        label: 'Total revenue',
        value: formatPkr(Number(overview.revenue_pkr ?? 0)),
        sub: `${Number(overview.orders_count ?? 0)} completed orders`,
        icon: 'cash-outline' as const,
        accent: '#10B981', // Emerald for money
      },
      {
        label: 'Campaign reach',
        value: formatCompact(Number(overview.campaign_impressions ?? 0)),
        sub: `${formatCompact(Number(overview.campaign_clicks ?? 0))} customer taps`,
        icon: 'eye-outline' as const,
        accent: '#3B82F6', // Blue for reach
      },
      {
        label: 'Conversion rate',
        value: pct(Number(overview.ctr ?? 0)),
        sub: `Opens: ${formatCompact(Number(overview.campaign_opens ?? 0))}`,
        icon: 'trending-up-outline' as const,
        accent: '#F59E0B', // Amber for performance
      },
    ],
    [overview],
  );

  const typeMeta = (t: string) => {
    if (t === 'ai') return { label: 'AI intelligence', icon: 'sparkles' as const, accent: '#FFD700', border: 'rgba(255,215,0,0.15)', bg: 'rgba(255,215,0,0.05)' };
    if (t === 'custom') return { label: 'Standard', icon: 'megaphone' as const, accent: '#FF6B35', border: 'rgba(255,107,53,0.15)', bg: 'rgba(255,107,53,0.05)' };
    return { label: t || 'Campaigns', icon: 'pricetag' as const, accent: '#FF6B35', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.05)' };
  };

  const productsWithActivity = products.filter((p) => (p.impressions ?? 0) + (p.clicks ?? 0) + (p.orders ?? 0) > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient
            colors={['rgba(30, 0, 4, 1)', 'rgba(0, 0, 0, 1)']}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'HelveticaNeue-Light',
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Business Insights
            </Text>
            <Text style={{ fontSize: 36, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4, letterSpacing: -0.5 }}>Analytics</Text>
          </View>

          {isError ? (
            <View style={{ paddingHorizontal: 24, paddingTop: 24 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)' }}>
                Could not load analytics. Check your connection.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
                {overviewStats.map((stat, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: 28,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.05)',
                      padding: 24,
                      marginBottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: `${stat.accent}15`,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 18,
                      }}
                    >
                      <Ionicons name={stat.icon} size={24} color={stat.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: 'HelveticaNeue-Light',
                          color: 'rgba(255,255,255,0.7)',
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        {stat.label}
                      </Text>
                      <Text style={{ 
                        fontSize: 28, 
                        fontFamily: 'HelveticaNeue-Thin', 
                        color: stat.label.toLowerCase().includes('revenue') ? stat.accent : '#fff', 
                        marginTop: 2 
                      }}>
                        {stat.value}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'HelveticaNeue-Light',
                          color: 'rgba(255,255,255,0.6)',
                          marginTop: 4,
                        }}
                      >
                        {stat.sub}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 20,
                  }}
                >
                  Product Velocity
                </Text>
                {productsWithActivity.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      borderRadius: 24,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.04)',
                      padding: 24,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)' }}>
                      No activity to display yet.
                    </Text>
                  </View>
                ) : (
                  productsWithActivity.map((product) => (
                    <View
                      key={product.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.05)',
                        padding: 20,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue-Light', color: '#fff', marginBottom: 20 }}>{product.name}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={{ fontSize: 9, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Impressions</Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>{formatCompact(product.impressions)}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 9, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Taps</Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>{formatCompact(product.clicks)}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 9, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Orders</Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>{product.orders}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={{ paddingHorizontal: 24 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 20,
                  }}
                >
                  Campaign Channels
                </Text>
                {byType.length === 0 ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)' }}>Start a campaign to track performance.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {byType.map((row) => {
                      const m = typeMeta(row.type);
                      return (
                        <View
                          key={row.type}
                          style={{
                            backgroundColor: m.bg,
                            borderRadius: 24,
                            borderWidth: 1,
                            borderColor: m.border,
                            padding: 20,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <View
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                backgroundColor: `${m.accent}20`,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                              }}
                            >
                              <Ionicons name={m.icon} size={18} color={m.accent} />
                            </View>
                            <View>
                               <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue-Light', color: '#fff' }}>{m.label}</Text>
                               <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                  {row.campaign_count} Active {row.campaign_count === 1 ? 'Campaign' : 'Campaigns'}
                               </Text>
                            </View>
                          </View>
                          
                          <View style={{ flexDirection: 'row', gap: 32 }}>
                            <View>
                              <Text style={{ fontSize: 9, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>CTR</Text>
                              <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>{pct(row.ctr)}</Text>
                            </View>
                            <View>
                              <Text style={{ fontSize: 9, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Taps</Text>
                              <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: m.accent, marginTop: 4 }}>{formatCompact(row.clicks)}</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>

        <VendorNav active="analytics" />
      </LinearGradient>
      )}
    </View>
  );
};

export default VendorAnalytics;
