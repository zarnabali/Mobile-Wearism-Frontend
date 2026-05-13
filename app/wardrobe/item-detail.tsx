import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, StyleSheet, Dimensions,
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
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1; // Portrait ratio

export default function ItemDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['wardrobe-item', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const item = itemData?.item ?? itemData?.data ?? itemData;

  const { data: aiData } = useQuery({
    queryKey: ['ai-status', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}/ai-status`).then(r => r.data),
    refetchInterval: (query) => {
      const status = query.state.data?.ai?.status ?? query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
    enabled: !!id,
  });

  const rawAIStatus = aiData?.ai?.status ?? aiData?.status ?? item?.ai_status;
  const hasResolvedWardrobeAI =
    !!item?.wardrobe_slot ||
    !!item?.fashionclip_main_category ||
    !!item?.fashionclip_sub_category ||
    (Array.isArray(item?.fashionclip_attributes) && item.fashionclip_attributes.length > 0);

  const currentAIStatus =
    rawAIStatus === 'not_found' && hasResolvedWardrobeAI ? 'completed' : rawAIStatus;
  const isCompleted = currentAIStatus === 'completed';
  const isFailed = currentAIStatus === 'failed';
  const isAnalyzing = !isCompleted && !isFailed;

  const aiResult = aiData?.ai?.result ?? aiData?.result ?? null;
  const segments = Array.isArray(aiResult?.segments) ? aiResult?.segments : [];
  const primaryImageUrl = aiResult?.image_url ?? item?.image_url ?? null;

  const seg0Gemma = segments?.[0]?.gemma_attributes ?? {};
  const mainCategory = item?.fashionclip_main_category ?? seg0Gemma?.category ?? 'unknown';
  const subCategory = item?.fashionclip_sub_category ?? seg0Gemma?.subcategory ?? '';

  React.useEffect(() => {
    if (currentAIStatus === 'completed') {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      qc.invalidateQueries({ queryKey: ['ai-status', id] });
    }
  }, [currentAIStatus, id, qc]);

  const retryMutation = useMutation({
    mutationFn: () => apiClient.post(`/wardrobe/items/${id}/retry-classification`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-status', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
    },
    onError: (err: any) => Alert.alert('Retry Failed', err?.response?.data?.error ?? 'Please try again.'),
  });

  const wornMutation = useMutation({
    mutationFn: () => apiClient.post(`/wardrobe/items/${id}/worn`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      Alert.alert('Success', 'Worn count updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/wardrobe/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert('Delete Item', 'Remove this item from your wardrobe?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const colorValue = typeof item?.color_dominant_rgb === 'string' ? item.color_dominant_rgb : null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : !item ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Item not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Fixed top nav */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity
                onPress={() => router.push(`/wardrobe/item-edit?id=${id}` as any)}
                style={styles.navBtn}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, styles.deleteBtn]}>
                <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {/* Product Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: primaryImageUrl ?? item.image_url }}
                style={styles.productImage}
                resizeMode="cover"
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Name & Brand */}
              {item.brand && (
                <Text style={styles.brandLabel}>{String(item.brand).toUpperCase()}</Text>
              )}
              <Text style={styles.itemName}>{item.name || 'Untitled'}</Text>

              {/* AI Status */}
              {isAnalyzing && (
                <View style={styles.statusRow}>
                  <ActivityIndicator color={COLORS.primary} size="small" />
                  <Text style={styles.statusText}>Analyzing...</Text>
                </View>
              )}
              {isFailed && (
                <TouchableOpacity
                  onPress={() => retryMutation.mutate()}
                  disabled={retryMutation.isPending}
                  style={styles.retryRow}
                >
                  <Ionicons name="refresh" size={16} color="#FF3B30" />
                  <Text style={styles.retryText}>Analysis failed — tap to retry</Text>
                </TouchableOpacity>
              )}

              {/* Details */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>CATEGORY</Text>
                  <Text style={styles.detailValue}>{String(mainCategory).toUpperCase()}</Text>
                  {subCategory ? <Text style={styles.detailSub}>{String(subCategory)}</Text> : null}
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>COLOR</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.swatch, { backgroundColor: colorValue || '#333' }]} />
                    <Text style={styles.detailValue}>{colorValue ? colorValue.toUpperCase() : '—'}</Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>WORN</Text>
                  <Text style={styles.detailValue}>{item.worn_count ?? 0}</Text>
                </View>
              </View>

              {/* Worn Button */}
              <TouchableOpacity
                onPress={() => wornMutation.mutate()}
                disabled={wornMutation.isPending}
                activeOpacity={0.8}
                style={styles.wornBtn}
              >
                {wornMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.wornBtnText}>WORN TODAY</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Empty
  emptyContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 14, letterSpacing: 2 },
  goBackBtn: { marginTop: 20, paddingHorizontal: 28, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  goBackText: { fontFamily: FONTS.light, color: '#fff', fontSize: 12, letterSpacing: 2 },

  // Top Bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  navBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  navRight: { flexDirection: 'row', gap: 10 },
  deleteBtn: { backgroundColor: 'rgba(255,59,48,0.12)' },

  // Scroll
  scrollContent: { paddingBottom: 60 },

  // Image
  imageContainer: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT, backgroundColor: '#111' },
  productImage: { width: '100%', height: '100%' },

  // Content
  content: { paddingHorizontal: 24, paddingTop: 24 },
  brandLabel: { fontFamily: FONTS.light, color: COLORS.primary, fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  itemName: { fontFamily: FONTS.light, color: '#fff', fontSize: 28, letterSpacing: 0.5, marginBottom: 20 },

  // AI Status
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(255,107,53,0.06)', borderRadius: 14 },
  statusText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(255,59,48,0.06)', borderRadius: 14 },
  retryText: { fontFamily: FONTS.light, color: 'rgba(255,59,48,0.7)', fontSize: 13 },

  // Details
  detailsRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, paddingVertical: 20, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  detailValue: { fontFamily: FONTS.light, color: '#fff', fontSize: 14 },
  detailSub: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 },
  detailDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 4 },
  swatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },

  // Button
  wornBtn: { height: 54, borderRadius: 27, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  wornBtnText: { fontFamily: FONTS.light, color: '#fff', fontSize: 14, letterSpacing: 2 },
});
