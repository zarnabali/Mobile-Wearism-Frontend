import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Alert,
  StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { Skeleton } from '../src/components/Skeleton';
import { EmptyState } from '../src/components/EmptyState';
import ModeSwitchOverlay from './components/ModeSwitchOverlay';
import { COLORS, FONTS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Slot display config
const SLOT_CONFIG: Record<string, { label: string; icon: string }> = {
  upperwear: { label: 'Tops', icon: 'shirt-outline' },
  lowerwear: { label: 'Bottoms', icon: 'body-outline' },
  outerwear: { label: 'Outerwear', icon: 'cloud-outline' },
  footwear: { label: 'Footwear', icon: 'footsteps-outline' },
  accessories: { label: 'Accessories', icon: 'glasses-outline' },
};

function ClassifyingCard() {
  return (
    <View style={styles.classifyingCard}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.classifyingText}>ANALYZING</Text>
    </View>
  );
}

// ─── Flat-lay outfit card (items stacked vertically on dark bg) ──────────────
function FlatLayCard({ plan }: { plan: any }) {
  const router = useRouter();
  const items: any[] = plan.items ?? [];
  const dayShort = String(plan.day_of_week ?? '').slice(0, 3);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => plan.outfit_id ? router.push(`/wardrobe/outfit-detail?id=${plan.outfit_id}` as any) : null}
      style={styles.flatLayCard}
    >
      {/* Day Label */}
      <View style={styles.flatLayDayBadge}>
        <Text style={styles.flatLayDayText}>{dayShort.toUpperCase()}</Text>
      </View>

      {/* Items arranged vertically — flat-lay style */}
      <View style={styles.flatLayItems}>
        {items.length === 0 ? (
          <View style={styles.flatLayEmpty}>
            <Ionicons name="shirt-outline" size={32} color="rgba(255,255,255,0.08)" />
          </View>
        ) : (
          items.slice(0, 5).map((item: any, idx: number) => {
            if (!item?.image_url) return null;
            // Size items based on type — tops/bottoms bigger, accessories smaller
            const isSmall = item.wardrobe_slot === 'accessories' || item.wardrobe_slot === 'footwear';
            const size = isSmall ? SCREEN_WIDTH * 0.22 : SCREEN_WIDTH * 0.32;
            // Stagger positions for visual interest
            const offsetX = idx % 2 === 0 ? -8 : 8;
            return (
              <Image
                key={item.id ?? idx}
                source={{ uri: item.image_url }}
                style={{
                  width: size,
                  height: size,
                  borderRadius: 12,
                  marginTop: idx === 0 ? 0 : -10,
                  alignSelf: 'center',
                  transform: [{ translateX: offsetX }],
                }}
                resizeMode="contain"
              />
            );
          })
        )}
      </View>

      {/* Occasion / info */}
      {plan.occasion && (
        <Text style={styles.flatLayOccasion}>{plan.occasion.replace(/_/g, ' ')}</Text>
      )}
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

  // ─── Weekly Plans Query (for outfits tab) ─────────────────────────────────
  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
    isRefetching: plansRefetching,
  } = useQuery({
    queryKey: ['weekly-plans'],
    queryFn: () => apiClient.get('/recommendations/weekly/plans').then(r => r.data),
    enabled: activeTab === 'outfits',
  });

  const items: any[] = itemsData?.items ?? itemsData?.data ?? [];
  const plans: any[] = plansData?.plans ?? [];
  const pending = items.filter((i: any) => !i.wardrobe_slot);

  // Sort plans by day order
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedPlans = [...plans].sort((a, b) => {
    const aIdx = dayOrder.indexOf(a.day_of_week);
    const bIdx = dayOrder.indexOf(b.day_of_week);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  // Per-slot counts + first image for thumbnail
  const isFootwear = (i: any) => {
    const main = String(i?.fashionclip_main_category || '').toLowerCase();
    return main === 'shoes' || main === 'shoe' || main === 'footwear';
  };

  const slotMeta = Object.keys(SLOT_CONFIG).map(slot => {
    const slotItems = items.filter((i: any) => {
      if (slot === 'footwear') return isFootwear(i);
      if (slot === 'accessories') return i.wardrobe_slot === 'accessories' && !isFootwear(i);
      return i.wardrobe_slot === slot;
    });
    return { slot, count: slotItems.length, thumb: slotItems[0]?.image_url ?? null };
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>WARDROBE</Text>
            <TouchableOpacity style={styles.headerBtn}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Tab Bar ── */}
          <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
              {(['items', 'outfits'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Items Tab ── */}
          {activeTab === 'items' ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetchItems} tintColor={COLORS.primary} />
              }
            >
              <View style={{ paddingHorizontal: 25 }}>

                {/* Add Item CTA */}
                <TouchableOpacity
                  onPress={() => router.push('/wardrobe/item-upload' as any)}
                  activeOpacity={0.9}
                  style={styles.addCta}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#E85A2A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View>
                    <Text style={styles.addCtaTitle}>ADD NEW PIECE</Text>
                    <Text style={styles.addCtaSubtitle}>Expand your digital collection</Text>
                  </View>
                  <View style={styles.addCtaIcon}>
                    <Ionicons name="add" size={24} color="#fff" />
                  </View>
                </TouchableOpacity>

                {/* Pending */}
                {pending.length > 0 && (
                  <View style={styles.pendingSection}>
                    <View style={styles.pendingHeader}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.pendingTitle}>
                        {pending.length} ITEM{pending.length > 1 ? 'S' : ''} PROCESSING
                      </Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pendingScroll}>
                      {pending.map((_: any, idx: number) => (
                        <ClassifyingCard key={idx} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Collections */}
                <Text style={styles.sectionTitle}>COLLECTIONS</Text>

                {itemsLoading ? (
                  <View style={{ height: 200, justifyContent: 'center' }}>
                    <ActivityIndicator color={COLORS.primary} />
                  </View>
                ) : (
                  <View style={styles.categoryGrid}>
                    {slotMeta.map(({ slot, count, thumb }) => {
                      const cfg = SLOT_CONFIG[slot];
                      return (
                        <TouchableOpacity
                          key={slot}
                          activeOpacity={0.9}
                          onPress={() => router.push(`/wardrobe/wardrobe-grid?slot=${slot}&title=${cfg.label}` as any)}
                          style={styles.categoryCard}
                        >
                          {thumb ? (
                            <Image source={{ uri: thumb }} style={styles.categoryImg} resizeMode="cover" />
                          ) : (
                            <View style={styles.categoryPlaceholder}>
                              <Ionicons name={cfg.icon as any} size={32} color="rgba(255,255,255,0.1)" />
                            </View>
                          )}
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                            style={styles.categoryOverlay}
                          >
                            <Text style={styles.categoryLabel}>{cfg.label.toUpperCase()}</Text>
                            <Text style={styles.categoryCount}>{count} PIECES</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* AI Fits CTA */}
                <TouchableOpacity
                  onPress={() => router.push('/weekly-plan' as any)}
                  activeOpacity={0.9}
                  style={styles.aiFitsCta}
                >
                  <View style={styles.aiFitsHeader}>
                    <Ionicons name="sparkles" size={20} color={COLORS.primary} />
                    <Text style={styles.aiFitsTitle}>AI CURATED FITS</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

              </View>
            </ScrollView>

          ) : (
            /* ── Outfits Tab — Weekly Plan Day Cards ── */
            <ScrollView
              contentContainerStyle={styles.outfitsScrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={plansRefetching} onRefresh={refetchPlans} tintColor={COLORS.primary} />
              }
            >
              {/* Header row */}
              <View style={styles.outfitsHeader}>
                <Text style={styles.outfitsSectionTitle}>WEEKLY LOOKS</Text>
                <TouchableOpacity
                  onPress={() => router.push('/weekly-plan' as any)}
                  style={styles.manageBtn}
                >
                  <Text style={styles.manageBtnText}>MANAGE</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {plansLoading ? (
                <View style={{ paddingTop: 80 }}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
              ) : sortedPlans.length === 0 ? (
                <View style={styles.emptyOutfits}>
                  <Ionicons name="calendar-outline" size={44} color="rgba(255,255,255,0.1)" />
                  <Text style={styles.emptyOutfitsTitle}>No weekly plan yet</Text>
                  <Text style={styles.emptyOutfitsSubtitle}>Generate AI-curated outfits for each day</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/weekly-plan' as any)}
                    style={styles.generateBtn}
                  >
                    <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.generateBtnText}>CREATE WEEKLY PLAN</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Day cards in a 2-column grid */
                <View style={styles.dayCardsGrid}>
                  {sortedPlans.map((plan) => (
                    <FlatLayCard key={plan.id} plan={plan} />
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          <BottomNav active="wardrobe" />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, height: 70 },
  headerTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 24, letterSpacing: 5 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  tabContainer: { paddingHorizontal: 25, marginBottom: 25 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab: { flex: 1, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2 },
  tabTextActive: { color: '#fff' },
  
  scrollContent: { paddingBottom: 120 },
  addCta: { height: 90, borderRadius: 28, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, marginBottom: 35, elevation: 5, shadowColor: COLORS.primary, shadowRadius: 15, shadowOpacity: 0.3 },
  addCtaTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, letterSpacing: 1 },
  addCtaSubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  addCtaIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  pendingSection: { marginBottom: 35 },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  pendingTitle: { fontFamily: FONTS.light, color: COLORS.primary, fontSize: 10, letterSpacing: 2 },
  pendingScroll: { gap: 12 },
  classifyingCard: { width: 110, height: 140, borderRadius: 24, backgroundColor: 'rgba(255,107,53,0.05)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center' },
  classifyingText: { fontFamily: FONTS.light, color: COLORS.primary, fontSize: 8, letterSpacing: 2, marginTop: 8 },
  
  sectionTitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 4, marginBottom: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginBottom: 25 },
  categoryCard: { width: '50%', padding: 8, height: 220 },
  categoryImg: { width: '100%', height: '100%', borderRadius: 32 },
  categoryPlaceholder: { width: '100%', height: '100%', borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  categoryOverlay: { position: 'absolute', inset: 8, borderRadius: 32, justifyContent: 'flex-end', padding: 20 },
  categoryLabel: { fontFamily: FONTS.light, color: '#fff', fontSize: 14, letterSpacing: 2 },
  categoryCount: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },
  
  aiFitsCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  aiFitsHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiFitsTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 16, letterSpacing: 2 },
  
  // ── Outfits Tab ──
  outfitsScrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  outfitsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  outfitsSectionTitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 4 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  manageBtnText: { fontFamily: FONTS.light, color: COLORS.primary, fontSize: 10, letterSpacing: 1 },

  // Empty outfits
  emptyOutfits: { alignItems: 'center', paddingTop: 60 },
  emptyOutfitsTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, marginTop: 20 },
  emptyOutfitsSubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8, textAlign: 'center' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 28, height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: COLORS.primary },
  generateBtnText: { fontFamily: FONTS.light, color: '#fff', fontSize: 12, letterSpacing: 2 },

  // Day Cards Grid (2 columns)
  dayCardsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },

  // Flat-lay card
  flatLayCard: {
    width: (SCREEN_WIDTH - 40 - 12) / 2,
    marginHorizontal: 6,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    paddingBottom: 14,
  },
  flatLayDayBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    marginLeft: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  flatLayDayText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.6)', fontSize: 10, letterSpacing: 2 },
  flatLayItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    minHeight: 200,
  },
  flatLayEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  flatLayOccasion: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 1, textAlign: 'center', marginTop: 4 },
});

export default WardrobeScreen;
