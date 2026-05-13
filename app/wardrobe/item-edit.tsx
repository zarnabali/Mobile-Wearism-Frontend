import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { COLORS, FONTS } from '../../src/constants/theme';

const SLOTS = ['upperwear', 'lowerwear', 'outerwear', 'accessories', 'footwear'];
const CONDITIONS = ['new', 'good', 'fair', 'worn'];

export default function ItemEditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['wardrobe-item', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const item = itemData?.item ?? itemData?.data ?? itemData;

  const [form, setForm] = useState({
    name: '',
    brand: '',
    condition: 'good',
    wardrobe_slot: 'upperwear',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        brand: item.brand || '',
        condition: item.condition || 'good',
        wardrobe_slot: item.wardrobe_slot || 'upperwear',
      });
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: (body: any) => apiClient.patch(`/wardrobe/items/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Update failed.'),
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter an item name.');
      return;
    }
    mutation.mutate(form);
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
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EDIT ITEM</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={mutation.isPending}
              style={styles.saveBtn}
            >
              {mutation.isPending ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <Text style={styles.saveBtnText}>SAVE</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
          >
            <ScrollView 
              style={styles.scroll} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
            >
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ITEM NAME</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => setForm({ ...form, name: v })}
                    placeholder="e.g. Classic Silk Shirt"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.input}
                    selectionColor={COLORS.primary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>BRAND</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={form.brand}
                    onChangeText={(v) => setForm({ ...form, brand: v })}
                    placeholder="e.g. Saint Laurent"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.input}
                    selectionColor={COLORS.primary}
                  />
                </View>
              </View>

              <View style={styles.selectorGroup}>
                <Text style={styles.inputLabel}>WARDROBE SLOT</Text>
                <View style={styles.chipsContainer}>
                  {SLOTS.map((s) => {
                    const active = form.wardrobe_slot === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setForm({ ...form, wardrobe_slot: s })}
                        activeOpacity={0.8}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {s.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.selectorGroup}>
                <Text style={styles.inputLabel}>CONDITION</Text>
                <View style={styles.chipsContainer}>
                  {CONDITIONS.map((c) => {
                    const active = form.condition === c;
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setForm({ ...form, condition: c })}
                        activeOpacity={0.8}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {c.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
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
});
