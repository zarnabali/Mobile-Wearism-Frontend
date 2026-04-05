import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, FlatList, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { Skeleton } from '../src/components/Skeleton';
import { EmptyState } from '../src/components/EmptyState';

// Slot display config
const SLOT_CONFIG: Record<string, { label: string; icon: string }> = {
  upperwear:   { label: 'Tops',       icon: 'shirt-outline' },
  lowerwear:   { label: 'Bottoms',    icon: 'body-outline' },
  outerwear:   { label: 'Outerwear',  icon: 'cloud-outline' },
  footwear:    { label: 'Footwear',   icon: 'footsteps-outline' },
  accessories: { label: 'Accessories', icon: 'glasses-outline' },
};

// Shimmer card for items still being classified
function ClassifyingCard() {
  return (
    <View
      style={{
        width: 100, height: 120, borderRadius: 16,
        backgroundColor: 'rgba(255,107,53,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12,
      }}
    >
      <ActivityIndicator size="small" color="#FF6B35" />
      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,107,53,0.8)', fontSize: 10, marginTop: 6, textAlign: 'center' }}>
        Classifying…
      </Text>
    </View>
  );
}

// ─── Outfit card (2-col grid) ────────────────────────────────────────────────
function OutfitCard({ outfit }: { outfit: any }) {
  const router = useRouter();
  const items: any[] = outfit.items ?? [];
  return (
    <TouchableOpacity
      onPress={() => router.push(`/wardrobe/outfit-detail?id=${outfit.id}` as any)}
      activeOpacity={0.85}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.09)',
      }}
    >
      {/* Cover image or 2×2 collage */}
      {outfit.cover_image_url ? (
        <Image
          source={{ uri: outfit.cover_image_url }}
          style={{ width: '100%', aspectRatio: 1 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', aspectRatio: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
          {items.slice(0, 4).map((item: any, i: number) => (
            <Image
              key={i}
              source={{ uri: item.image_url }}
              style={{ width: '50%', height: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }}
              resizeMode="cover"
            />
          ))}
          {items.length === 0 && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shirt-outline" size={36} color="rgba(255,255,255,0.18)" />
            </View>
          )}
        </View>
      )}

      {/* Info row */}
      <View style={{ padding: 10 }}>
        <Text
          style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 13 }}
          numberOfLines={1}
        >
          {outfit.name || 'Untitled Outfit'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
          {outfit.occasion ? (
            <Text style={{ fontFamily: 'HelveticaNeue', color: '#FF6B35', fontSize: 11, textTransform: 'capitalize' }}>
              {outfit.occasion.replace(/_/g, ' ')}
            </Text>
          ) : null}
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const WardrobeScreen = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'items' | 'outfits'>('items');

  // ─── Items Query ──────────────────────────────────────────────────────────
  const {
    data: itemsData,
    isLoading: itemsLoading,
    refetch: refetchItems,
    isRefetching,
  } = useQuery({
    queryKey: ['wardrobe-items'],
    queryFn: () => apiClient.get('/wardrobe/items?limit=100').then(r => r.data),
  });

  // ─── Outfits Query ────────────────────────────────────────────────────────
  const {
    data: outfitsData,
    isLoading: outfitsLoading,
    refetch: refetchOutfits,
    isRefetching: outfitsRefetching,
  } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => apiClient.get('/wardrobe/outfits?limit=50').then(r => r.data),
    enabled: activeTab === 'outfits',
  });

  // ─── Recommendations ──────────────────────────────────────────────────────
  const { data: recsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => apiClient.get('/recommendations?status=all&limit=20').then(r => r.data),
    enabled: activeTab === 'items',
    // Poll while Celery is still rating outfits (pending → completed)
    refetchInterval: (q) => {
      const raw = q.state.data as { recommendations?: unknown[]; data?: unknown[] } | undefined;
      const list = raw?.recommendations ?? raw?.data ?? [];
      return Array.isArray(list) &&
        list.some((r: unknown) => (r as { ai_status?: string }).ai_status === 'pending')
        ? 8000
        : false;
    },
  });

  const generateMutation = useMutation({
    // Backend schema expects a JSON object; axios was sending no body with
    // Content-Type: application/json, which triggers AJV "Validation failed".
    mutationFn: (vars?: { forceRefresh?: boolean }) =>
      apiClient.post(
        '/recommendations/generate',
        vars?.forceRefresh ? { force_refresh: true } : {}
      ),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['recommendations'] });
      const data = res?.data;
      if (data?.generated === 0 && typeof data?.message === 'string') {
        Alert.alert('Recommendations', data.message, [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Regenerate anyway',
            onPress: () => generateMutation.mutate({ forceRefresh: true }),
          },
        ]);
      }
    },
    onError: (err: any) => {
      const d = err?.response?.data;
      let msg =
        d?.error ??
        d?.message ??
        (err?.message && err.message !== 'Network Error'
          ? err.message
          : 'Could not generate recommendations.');
      const details = d?.details;
      if (Array.isArray(details) && details.length > 0) {
        const line = details
          .map((x: { field?: string; message?: string }) =>
            [x.field, x.message].filter(Boolean).join(': ')
          )
          .join('\n');
        msg = `${msg}\n${line}`;
      }
      if (err?.response?.status === 429 && d?.retryAfter) {
        msg = `${msg} Try again in ${d.retryAfter}.`;
      }
      Alert.alert('Generate Failed', msg);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/recommendations/${id}/save`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/recommendations/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });

  const items: any[] = itemsData?.items ?? itemsData?.data ?? [];
  const outfits: any[] = outfitsData?.outfits ?? outfitsData?.data ?? [];
  const recs: any[] = recsData?.recommendations ?? recsData?.data ?? [];
  const pending = items.filter((i: any) => !i.wardrobe_slot);

  // Per-slot counts + first image for thumbnail
  const slotMeta = Object.keys(SLOT_CONFIG).map(slot => {
    const slotItems = items.filter((i: any) => i.wardrobe_slot === slot);
    return { slot, count: slotItems.length, thumb: slotItems[0]?.image_url ?? null };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>

          {/* ── Sticky Header + Tab Bar ── */}
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 30 }}>
                Wardrobe
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <Ionicons name="search-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tab toggle pill */}
            <View style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: 999,
              padding: 4,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}>
              {(['items', 'outfits'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: activeTab === tab ? '#FF6B35' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontFamily: 'HelveticaNeue-Medium',
                    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontSize: 14,
                    textTransform: 'capitalize',
                  }}>
                    {tab === 'items' ? 'Items' : 'Outfits'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Items Tab ── */}
          {activeTab === 'items' ? (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetchItems} tintColor="#FF6B35" />
              }
            >
              <View style={{ paddingHorizontal: 20 }}>

                {/* ── Add Item CTA ── */}
                <TouchableOpacity
                  onPress={() => router.push('/wardrobe/item-upload' as any)}
                  activeOpacity={0.9}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#FF6B35', borderRadius: 24, padding: 20, marginBottom: 32,
                    shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <View>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>Add New Item</Text>
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
                      Upload or scan your clothes
                    </Text>
                  </View>
                  <View style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={24} color="white" />
                  </View>
                </TouchableOpacity>

                {/* ── Pending Classification ── */}
                {pending.length > 0 && (
                  <View style={{ marginBottom: 28 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <ActivityIndicator size="small" color="#FF6B35" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 13 }}>
                        {pending.length} item{pending.length > 1 ? 's' : ''} being classified…
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                      {pending.map((_: any, idx: number) => (
                        <ClassifyingCard key={idx} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* ── Categories ── */}
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 20, marginBottom: 16 }}>
                  Categories
                </Text>

                {itemsLoading ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 28, gap: 0 }}>
                    {Array(4).fill(0).map((_, i) => (
                      <View key={i} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                        <Skeleton className="w-full h-[180px] rounded-3xl" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 28 }}>
                    {slotMeta.map(({ slot, count, thumb }) => {
                      const cfg = SLOT_CONFIG[slot];
                      return (
                        <View key={slot} style={{ width: '50%', paddingHorizontal: 8, marginBottom: 16 }}>
                          <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => router.push(`/wardrobe/wardrobe-grid?slot=${slot}&title=${cfg.label}` as any)}
                            style={{ borderRadius: 24, overflow: 'hidden', height: 180 }}
                          >
                            {thumb ? (
                              <Image
                                source={{ uri: thumb }}
                                style={{ width: '100%', height: '100%', position: 'absolute' }}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.05)', position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name={cfg.icon as any} size={40} color="rgba(255,255,255,0.2)" />
                              </View>
                            )}
                            <LinearGradient
                              colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.9)']}
                              style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                            >
                              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>
                                {cfg.label}
                              </Text>
                              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                                {count} item{count !== 1 ? 's' : ''}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* ── AI Recommendations ── */}
                <View style={{ marginTop: 8, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="sparkles" size={18} color="#FF6B35" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 20 }}>
                        AI Fits
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => generateMutation.mutate(undefined)}
                      disabled={generateMutation.isPending}
                      style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: generateMutation.isPending ? 'rgba(255,107,53,0.3)' : 'rgba(255,107,53,0.15)',
                        borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
                        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
                      }}
                    >
                      {generateMutation.isPending ? (
                        <ActivityIndicator size="small" color="#FF6B35" />
                      ) : (
                        <>
                          <Ionicons name="refresh-outline" size={14} color="#FF6B35" style={{ marginRight: 5 }} />
                          <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 13 }}>
                            Generate
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {recsLoading ? (
                    <ActivityIndicator color="#FF6B35" style={{ alignSelf: 'flex-start' }} />
                  ) : recs.length === 0 ? (
                    <TouchableOpacity
                      onPress={() => generateMutation.mutate(undefined)}
                      disabled={generateMutation.isPending}
                      activeOpacity={0.8}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
                        borderRadius: 24, padding: 24, alignItems: 'center',
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={32} color="rgba(255,107,53,0.45)" />
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 10 }}>
                        No recommendations yet
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,107,53,0.65)', fontSize: 13, marginTop: 4 }}>
                        Tap Generate to get AI outfit ideas →
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
                      {recs.map((rec: any) => (
                        <View
                          key={rec.id}
                          style={{
                            width: 200, marginRight: 16,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 24, overflow: 'hidden',
                          }}
                        >
                          {/* Item thumbnails */}
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 }}>
                            {(rec.items ?? []).slice(0, 4).map((item: any, idx: number) => (
                              <View
                                key={idx}
                                style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}
                              >
                                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                              </View>
                            ))}
                          </View>

                          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                            {(rec.ai_status === 'pending' || rec.ai_status === 'processing') && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <ActivityIndicator size="small" color="#FF6B35" style={{ marginRight: 8 }} />
                                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                                  AI is scoring this outfit…
                                </Text>
                              </View>
                            )}
                            {rec.ai_status === 'failed' && (
                              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,150,120,0.9)', fontSize: 12, marginBottom: 8 }}>
                                Couldn&apos;t score this combo. Dismiss and try Generate again.
                              </Text>
                            )}
                            {rec.ai_rating != null && rec.ai_status === 'completed' && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <Ionicons name="star" size={12} color="#FF6B35" style={{ marginRight: 4 }} />
                                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 13 }}>
                                  {rec.ai_rating.toFixed(1)}
                                </Text>
                              </View>
                            )}
                            {rec.occasion && (
                              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12, textTransform: 'capitalize' }}>
                                {rec.occasion.replace(/_/g, ' ')}
                              </Text>
                            )}
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity
                                onPress={() => saveMutation.mutate(rec.id)}
                                disabled={saveMutation.isPending}
                                style={{
                                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 9,
                                }}
                              >
                                {saveMutation.isPending ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <>
                                    <Ionicons name="bookmark-outline" size={14} color="#fff" style={{ marginRight: 5 }} />
                                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 12 }}>Save</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => dismissMutation.mutate(rec.id)}
                                disabled={dismissMutation.isPending}
                                style={{
                                  width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
                                  backgroundColor: 'rgba(255,255,255,0.08)',
                                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
                                }}
                              >
                                <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

              </View>
            </ScrollView>

          ) : (
            /* ── Outfits Tab ── */
            <FlatList
              data={outfits}
              numColumns={2}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 140, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={outfitsRefetching} onRefresh={refetchOutfits} tintColor="#FF6B35" />
              }
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => router.push('/wardrobe/outfit-create' as any)}
                  activeOpacity={0.9}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'rgba(255,107,53,0.12)',
                    borderWidth: 1, borderColor: 'rgba(255,107,53,0.3)',
                    borderRadius: 20, padding: 16, marginBottom: 12, marginHorizontal: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: '#FF6B35', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="add" size={22} color="white" />
                    </View>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 15 }}>
                      Create New Outfit
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,107,53,0.7)" />
                </TouchableOpacity>
              }
              renderItem={({ item }) => <OutfitCard outfit={item} />}
              ListEmptyComponent={
                outfitsLoading ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 }}>
                    {Array(4).fill(0).map((_, i) => (
                      <View key={i} style={{ width: '50%', padding: 6 }}>
                        <Skeleton className="w-full aspect-square rounded-2xl" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    icon="shirt-outline"
                    title="No outfits yet"
                    subtitle="Create your first outfit from your wardrobe items"
                    actionLabel="Create Outfit"
                    onAction={() => router.push('/wardrobe/outfit-create' as any)}
                  />
                )
              }
            />
          )}

          <BottomNav active="wardrobe" />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default WardrobeScreen;
