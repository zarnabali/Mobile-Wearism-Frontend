import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Image,
  StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { COLORS, FONTS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OCCASIONS = ['casual', 'formal', 'business', 'party', 'athleisure', 'streetwear', 'smart_casual'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all_season'];

export default function OutfitCreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [season, setSeason] = useState(SEASONS[4]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Fetch Items ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['wardrobe-items'],
    queryFn: () => apiClient.get('/wardrobe/items?limit=100').then(r => r.data),
  });

  const items: any[] = data?.items ?? data?.data ?? data ?? [];

  // Group by slot
  const slots = ['upperwear', 'lowerwear', 'outerwear', 'accessories', 'footwear'];

  // Toggle selection
  const toggleSelection = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // ─── Mutation ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/wardrobe/outfits', {
      name: name || undefined,
      occasion,
      item_ids: Array.from(selectedIds),
      status: 'saved',
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      const oid = res.data?.outfit?.id ?? res.data?.id;
      if (oid) {
        router.replace(`/wardrobe/outfit-detail?id=${oid}` as any);
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      Alert.alert('Creation Failed', err.response?.data?.error ?? 'Could not create outfit.');
    },
  });

  const handleCreate = () => {
    if (selectedIds.size === 0) return Alert.alert('Missing Items', 'Select at least one item to create an outfit.');
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CREATE OUTFIT</Text>
            <TouchableOpacity onPress={handleCreate} disabled={createMutation.isPending} style={styles.saveBtn}>
              {createMutation.isPending ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>CREATE</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OUTFIT NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Minimalist Summer Look"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.input}
                  selectionColor={COLORS.primary}
                />
              </View>
            </View>

            {/* Occasion */}
            <View style={styles.selectorGroup}>
              <Text style={styles.inputLabel}>OCCASION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                {OCCASIONS.map(occ => {
                  const active = occasion === occ;
                  return (
                    <TouchableOpacity
                      key={occ}
                      onPress={() => setOccasion(occ)}
                      activeOpacity={0.8}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {occ.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Selection Section */}
            <View style={styles.selectionSection}>
              <View style={styles.selectionHeader}>
                <Text style={styles.inputLabel}>CHOOSE PIECES</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{selectedIds.size} SELECTED</Text>
                </View>
              </View>

              {slots.map(slot => {
                const slotItems = items.filter(i => i.wardrobe_slot === slot);
                if (slotItems.length === 0) return null;

                return (
                  <View key={slot} style={styles.slotGroup}>
                    <Text style={styles.slotTitle}>{slot.toUpperCase()}</Text>
                    <View style={styles.itemsGrid}>
                      {slotItems.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => toggleSelection(item.id)}
                            activeOpacity={0.9}
                            style={styles.itemCard}
                          >
                            <View style={[styles.imageWrapper, isSelected && styles.imageWrapperSelected]}>
                              <Image
                                source={{ uri: item.image_url }}
                                style={styles.itemImage}
                                resizeMode="cover"
                              />
                              <View style={styles.itemOverlay}>
                                <Text style={styles.itemName} numberOfLines={1}>
                                  {item.name || item.fashionclip_main_category || 'ITEM'}
                                </Text>
                              </View>
                              {isSelected && (
                                <View style={styles.checkOverlay}>
                                  <Ionicons name="checkmark" size={16} color="#fff" />
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loaderContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 70, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  headerTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, letterSpacing: 3 },
  saveBtn: { paddingHorizontal: 15, height: 40, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 14, letterSpacing: 2 },
  
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  
  inputGroup: { paddingHorizontal: 25, paddingTop: 30, marginBottom: 35 },
  inputLabel: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, marginBottom: 15 },
  inputWrapper: { height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 20 },
  input: { fontFamily: FONTS.medium, color: '#fff', fontSize: 16 },
  
  selectorGroup: { marginBottom: 35 },
  chipsScroll: { paddingHorizontal: 25, gap: 10 },
  chip: { paddingHorizontal: 18, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1 },
  chipTextActive: { color: COLORS.primary },
  
  selectionSection: { paddingHorizontal: 25 },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,107,53,0.1)' },
  countText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 10, letterSpacing: 1 },
  
  slotGroup: { marginBottom: 35 },
  slotTitle: { fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.2)', fontSize: 9, letterSpacing: 4, marginBottom: 15 },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  itemCard: { width: '50%', padding: 6, aspectRatio: 0.75 },
  imageWrapper: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imageWrapperSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  itemImage: { width: '100%', height: '100%' },
  itemOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  itemName: { fontFamily: FONTS.medium, color: '#fff', fontSize: 10 },
  checkOverlay: { position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowRadius: 5, shadowOpacity: 0.5 },
});
