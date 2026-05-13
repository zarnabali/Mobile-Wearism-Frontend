import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';
import { COLORS, FONTS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function OutfitItemThumbnail({ uri }: { uri?: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!uri) {
    return (
      <View style={styles.thumbPlaceholder}>
        <Ionicons name="image-outline" size={24} color="rgba(255,255,255,0.1)" />
      </View>
    );
  }

  return (
    <View style={styles.thumbContainer}>
      {!loaded && !failed && (
        <View style={[StyleSheet.absoluteFillObject, styles.thumbLoader]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[styles.thumbImage, { opacity: loaded && !failed ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
      {failed && (
        <View style={[StyleSheet.absoluteFillObject, styles.thumbPlaceholder]}>
          <Ionicons name="alert-circle-outline" size={24} color="rgba(255,255,255,0.2)" />
        </View>
      )}
    </View>
  );
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () => apiClient.get(`/wardrobe/outfits/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const outfit = query.state.data?.outfit ?? query.state.data?.data ?? query.state.data;
      return outfit?.ai_rating ? false : 3000;
    },
  });

  const outfitRaw = data?.outfit ?? data?.data ?? data;
  const outfitItems =
    outfitRaw?.items ??
    (Array.isArray(outfitRaw?.outfit_items)
      ? [...outfitRaw.outfit_items]
          .sort((a: { position?: number }, b: { position?: number }) =>
            (a.position ?? 0) - (b.position ?? 0)
          )
          .map((row: { wardrobe_items?: unknown }) => row.wardrobe_items)
          .filter(Boolean)
      : []);
  const outfit = outfitRaw ? { ...outfitRaw, items: outfitItems } : outfitRaw;

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/wardrobe/outfits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not delete outfit. Try again.'),
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      'This outfit will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : !outfit ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Outfit not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => router.push(`/wardrobe/outfit-edit?id=${id}` as any)}
                  style={styles.headerIconBtn}
                >
                  <Ionicons name="pencil" size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={[styles.headerIconBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Info Header */}
              <View style={styles.infoHeader}>
                <Text style={styles.outfitTitle}>{outfit.name || 'Untitled Outfit'}</Text>
                {outfit.occasion && (
                  <View style={styles.occasionBadge}>
                    <Text style={styles.occasionText}>{outfit.occasion.replace(/_/g, ' ').toUpperCase()}</Text>
                  </View>
                )}
              </View>

              {/* AI Rating */}
              {outfit.ai_rating ? (
                <View style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <Ionicons name="sparkles" size={14} color={COLORS.primary} />
                    <Text style={styles.ratingLabel}>AI SCORE</Text>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={styles.scoreValue}>{outfit.ai_rating.toFixed(1)}</Text>
                    <Text style={styles.scoreMax}>/ 10</Text>
                  </View>
                  {outfit.ai_feedback && (
                    <Text style={styles.feedbackText}>{outfit.ai_feedback}</Text>
                  )}
                </View>
              ) : (
                <View style={styles.ratingPending}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.ratingPendingText}>Analyzing look...</Text>
                </View>
              )}

              {/* Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>PIECES</Text>
                <View style={styles.itemsGrid}>
                  {(outfit.items ?? []).map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(`/wardrobe/item-detail?id=${item.id}` as any)}
                      activeOpacity={0.9}
                      style={styles.itemCard}
                    >
                      <View style={styles.itemThumbWrapper}>
                        <OutfitItemThumbnail uri={item.image_url} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name || 'Item'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.15)" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 2 },
  backBtn: { marginTop: 24, paddingHorizontal: 25, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontFamily: FONTS.light, color: '#fff', fontSize: 12, letterSpacing: 2 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerActions: { flexDirection: 'row', gap: 12 },
  
  scrollContent: { paddingBottom: 100 },
  infoHeader: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 25 },
  outfitTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 30, letterSpacing: 1, marginBottom: 12 },
  occasionBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  occasionText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 2 },
  
  ratingCard: { marginHorizontal: 20, borderRadius: 24, padding: 22, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 30 },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  ratingLabel: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 3 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  scoreValue: { fontFamily: FONTS.light, color: COLORS.primary, fontSize: 48 },
  scoreMax: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.2)', fontSize: 20, marginLeft: 4 },
  feedbackText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 22, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  ratingPending: { marginHorizontal: 20, paddingVertical: 30, alignItems: 'center', gap: 12, marginBottom: 30 },
  ratingPendingText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  
  itemsSection: { marginTop: 10 },
  sectionTitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.2)', fontSize: 10, letterSpacing: 4, marginLeft: 25, marginBottom: 15 },
  itemsGrid: { paddingHorizontal: 20, gap: 12 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  itemThumbWrapper: { width: 65, height: 65, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  itemInfo: { flex: 1, marginLeft: 14 },
  itemName: { fontFamily: FONTS.light, color: '#fff', fontSize: 14 },
  
  thumbContainer: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  thumbLoader: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  thumbImage: { width: '100%', height: '100%' },
});
