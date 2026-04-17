import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import VendorNav from '../components/VendorNav';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';

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
        label: 'Total sales',
        value: formatPkr(Number(overview.revenue_pkr ?? 0)),
        sub: `${Number(overview.orders_count ?? 0)} orders (excl. cancelled)`,
        icon: 'cash-outline' as const,
      },
      {
        label: 'Campaign impressions',
        value: formatCompact(Number(overview.campaign_impressions ?? 0)),
        sub: `${formatCompact(Number(overview.campaign_clicks ?? 0))} product taps`,
        icon: 'eye-outline' as const,
      },
      {
        label: 'Click-through rate',
        value: pct(Number(overview.ctr ?? 0)),
        sub: `Opens: ${formatCompact(Number(overview.campaign_opens ?? 0))}`,
        icon: 'trending-up-outline' as const,
      },
    ],
    [overview],
  );

  const typeMeta = (t: string) => {
    if (t === 'ai') return { label: 'AI campaigns', icon: 'sparkles' as const, accent: '#FFD700', border: 'rgba(255,215,0,0.2)', bg: 'rgba(255,215,0,0.1)' };
    if (t === 'custom') return { label: 'Your campaigns', icon: 'megaphone' as const, accent: '#FF6B35', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.05)' };
    return { label: t || 'Campaigns', icon: 'pricetag' as const, accent: '#FF6B35', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.05)' };
  };

  const productsWithActivity = products.filter((p) => (p.impressions ?? 0) + (p.clicks ?? 0) + (p.orders ?? 0) > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'HelveticaNeue-Light',
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Performance
            </Text>
            <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>Analytics</Text>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 }}>
              <ActivityIndicator color="#FF6B35" />
            </View>
          ) : isError ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.7)' }}>
                Could not load analytics. Check your connection and try again.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
              <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Overview
                </Text>
                {overviewStats.map((stat, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      padding: 18,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Ionicons name={stat.icon} size={22} color="rgba(255,255,255,0.7)" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'HelveticaNeue-Light',
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {stat.label}
                      </Text>
                      <Text style={{ fontSize: 26, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>{stat.value}</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'HelveticaNeue-Light',
                          color: 'rgba(255,255,255,0.4)',
                          marginTop: 4,
                        }}
                      >
                        {stat.sub}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Product performance
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: 14,
                  }}
                >
                  From campaign placements: impressions, taps, and paid orders (COD pipeline).
                </Text>
                {productsWithActivity.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      padding: 18,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)' }}>
                      No campaign activity on products yet.
                    </Text>
                  </View>
                ) : (
                  productsWithActivity.map((product) => (
                    <View
                      key={product.id}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        padding: 18,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff', marginBottom: 14 }}>{product.name}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        <View style={{ minWidth: '45%' }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: 'HelveticaNeue-Light',
                              color: 'rgba(255,255,255,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Impressions
                          </Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                            {formatCompact(Number(product.impressions ?? 0))}
                          </Text>
                        </View>
                        <View style={{ minWidth: '45%' }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: 'HelveticaNeue-Light',
                              color: 'rgba(255,255,255,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Taps
                          </Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                            {formatCompact(Number(product.clicks ?? 0))}
                          </Text>
                        </View>
                        <View style={{ minWidth: '45%' }}>
                          <Text
                            style={{
                              fontSize: 10,
                              fontFamily: 'HelveticaNeue-Light',
                              color: 'rgba(255,255,255,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            Orders
                          </Text>
                          <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                            {formatCompact(Number(product.orders ?? 0))}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'HelveticaNeue-Light',
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  Campaign performance
                </Text>
                {byType.length === 0 ? (
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                      padding: 18,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)' }}>
                      Create a campaign to see performance by type.
                    </Text>
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
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: m.border,
                            padding: 18,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: `${m.accent}33`,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 10,
                              }}
                            >
                              <Ionicons name={m.icon} size={16} color={m.accent} />
                            </View>
                            <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: '#fff' }}>{m.label}</Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 11,
                              fontFamily: 'HelveticaNeue-Light',
                              color: 'rgba(255,255,255,0.45)',
                              marginBottom: 10,
                            }}
                          >
                            {Number(row.campaign_count ?? 0)}{' '}
                            {Number(row.campaign_count ?? 0) === 1 ? 'campaign' : 'campaigns'}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 20 }}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontFamily: 'HelveticaNeue-Light',
                                  color: 'rgba(255,255,255,0.5)',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                CTR
                              </Text>
                              <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                {pct(Number(row.ctr ?? 0))}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontFamily: 'HelveticaNeue-Light',
                                  color: 'rgba(255,255,255,0.5)',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                Taps
                              </Text>
                              <Text
                                style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: m.accent, marginTop: 4 }}
                              >
                                {formatCompact(Number(row.clicks ?? 0))}
                              </Text>
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
    </View>
  );
};

export default VendorAnalytics;
