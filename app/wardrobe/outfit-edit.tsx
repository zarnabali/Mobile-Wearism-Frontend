import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { COLORS, FONTS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'party', label: 'Party' },
  { id: 'business', label: 'Business' },
  { id: 'athleisure', label: 'Athleisure' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'smart_casual', label: 'Smart Casual' },
];

export default function OutfitEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Load current outfit data
  const { data: outfitData, isLoading: outfitLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () => apiClient.get(`/wardrobe/outfits/${id}`).then(r => r.data),
    enabled: !!id,
  });

  // Load wardrobe items for selection
  const { data: wardrobeData, isLoading: itemsLoading } = useQuery({
    queryKey: ['wardrobe-items'],
    queryFn: () => apiClient.get('/wardrobe/items?limit=100').then(r => r.data),
  });

  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pre-fill from loaded outfit
  useEffect(() => {
    const outfit = outfitData?.outfit ?? outfitData?.data ?? outfitData;
    if (outfit) {
      setName(outfit.name || '');
      setOccasion(outfit.occasion || '');
      setSelectedIds((outfit.items ?? []).map((i: any) => i.id || i.wardrobe_item_id));
    }
  }, [outfitData]);

  const updateMutation = useMutation({
    mutationFn: () => apiClient.patch(`/wardrobe/outfits/${id}`, {
      name: name || undefined,
      occasion: occasion || undefined,
      item_ids: selectedIds,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfit', id] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Update failed.'),
  });

  const toggleItem = (itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId)
        ? prev.filter(i => i !== itemId)
        : [...prev, itemId]
    );
  };

  const items = wardrobeData?.items ?? wardrobeData?.data ?? wardrobeData ?? [];

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter an outfit name.');
    if (selectedIds.length === 0) return Alert.alert('Error', 'Please select at least one item.');
    updateMutation.mutate();
  };

  if (outfitLoading || itemsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT OUTFIT</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={updateMutation.isPending}
              style={styles.saveBtn}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.saveBtnText}>SAVE</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scroll} 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>OUTFIT NAME</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Modern Evening Look"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.input}
                  selectionColor={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.inputLabel}>OCCASION</Text>
              <View style={styles.chipsContainer}>
                {OCCASIONS.map((occ) => {
                  const active = occasion === occ.id;
                  return (
                    <TouchableOpacity
                      key={occ.id}
                      onPress={() => setOccasion(occ.id)}
                      activeOpacity={0.8}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {occ.label.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.selectionSection}>
              <View style={styles.selectionHeader}>
                <Text style={styles.inputLabel}>SELECT PIECES</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{selectedIds.length} SELECTED</Text>
                </View>
              </View>

              <View style={styles.itemsGrid}>
                {items.map((item: any) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.9}
                      style={styles.itemCard}
                    >
                      <View style={[styles.imageWrapper, isSelected && styles.imageWrapperSelected]}>
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
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
  scrollContent: { paddingHorizontal: 25, paddingTop: 30, paddingBottom: 60 },
  
  inputGroup: { marginBottom: 35 },
  inputLabel: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, marginBottom: 15 },
  inputWrapper: { height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 20 },
  input: { fontFamily: FONTS.medium, color: '#fff', fontSize: 16 },
  
  selectorGroup: { marginBottom: 35 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 18, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 1 },
  chipTextActive: { color: COLORS.primary },
  
  selectionSection: { marginTop: 10 },
  selectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,107,53,0.1)' },
  countText: { fontFamily: FONTS.bold, color: COLORS.primary, fontSize: 10, letterSpacing: 1 },
  
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  itemCard: { width: '33.33%', padding: 5, aspectRatio: 1 },
  imageWrapper: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  imageWrapperSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  itemImage: { width: '100%', height: '100%' },
  checkOverlay: { position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWeight: 1, borderColor: '#fff' },
});
