import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { COLORS, FONTS } from '../src/constants/theme';
import WeeklyPreferencesSheet, { DayPref } from './components/WeeklyPreferencesSheet';

const { width } = Dimensions.get('window');

// ─── Helpers ────────────────────────────────────────────────────────────────

function nextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

// ─── DayView ────────────────────────────────────────────────────────────────

function DayView({
  plan,
  onSave,
  saving,
}: {
  plan: any;
  onSave: (planId: string) => void;
  saving: boolean;
}) {
  const items: any[] = plan.items ?? [];

  return (
    <View style={styles.dayContainer}>
      {/* Collage */}
      <View style={styles.collageContainer}>
        {items.length === 0 ? (
          <View style={styles.emptyCollage}>
            <Ionicons name="shirt-outline" size={40} color="rgba(255,255,255,0.1)" />
          </View>
        ) : items.length === 1 ? (
          <Image source={{ uri: items[0]?.image_url }} style={styles.singleImage} resizeMode="cover" />
        ) : items.length === 2 ? (
          <View style={styles.twoImageRow}>
            <View style={{ flex: 1 }}>
              {items[0]?.image_url && <Image source={{ uri: items[0].image_url }} style={styles.fillImage} resizeMode="cover" />}
            </View>
            <View style={{ flex: 1 }}>
              {items[1]?.image_url && <Image source={{ uri: items[1].image_url }} style={styles.fillImage} resizeMode="cover" />}
            </View>
          </View>
        ) : (
          /* 2×2 grid for 3+ items */
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <View style={{ flex: 1 }}>
                {items[0]?.image_url && <Image source={{ uri: items[0].image_url }} style={styles.fillImage} resizeMode="cover" />}
              </View>
              <View style={{ flex: 1 }}>
                {items[1]?.image_url && <Image source={{ uri: items[1].image_url }} style={styles.fillImage} resizeMode="cover" />}
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={{ flex: 1 }}>
                {items[2]?.image_url && <Image source={{ uri: items[2].image_url }} style={styles.fillImage} resizeMode="cover" />}
              </View>
              <View style={{ flex: 1 }}>
                {items[3]?.image_url ? (
                  <>
                    <Image source={{ uri: items[3].image_url }} style={styles.fillImage} resizeMode="cover" />
                    {items.length > 4 && (
                      <View style={styles.moreOverlay}>
                        <Text style={styles.moreText}>+{items.length - 4}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.gridPlaceholder}>
                    <Ionicons name="add" size={24} color="rgba(255,255,255,0.1)" />
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.dayInfo}>
        {plan.explanation ? (
          <Text style={styles.explanationText} numberOfLines={3}>
            {plan.explanation}
          </Text>
        ) : null}

        {/* Save Button */}
        <TouchableOpacity
          onPress={() => onSave(plan.id)}
          disabled={saving || plan.is_saved}
          activeOpacity={0.8}
          style={[styles.saveButton, plan.is_saved && styles.saveButtonSaved]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name={plan.is_saved ? "checkmark-circle" : "add-circle-outline"}
                size={18}
                color={plan.is_saved ? "#4ADE80" : "#fff"}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.saveButtonText, plan.is_saved && styles.saveButtonTextSaved]}>
                {plan.is_saved ? "Saved" : "Save Look"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── DaySelector ────────────────────────────────────────────────────────────

function DaySelector({
  selectedIdx,
  onSelect,
  plans,
}: {
  selectedIdx: number;
  onSelect: (idx: number) => void;
  plans: any[];
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.daySelectorContent}
    >
      {days.map((day, idx) => {
        const isSelected = selectedIdx === idx;
        const hasPlan = plans.some(p => p.day_of_week === day || p.day_of_week === fullDays[idx]);

        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(idx)}
            activeOpacity={0.7}
            style={[styles.dayTab, isSelected && styles.dayTabActive]}
          >
            <Text style={[styles.dayTabText, isSelected && styles.dayTabTextActive]}>
              {day}
            </Text>
            {hasPlan && !isSelected && <View style={styles.hasPlanDot} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── GeneratingOverlay ──────────────────────────────────────────────────────

function GeneratingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingTitle}>Styling Your Week</Text>
      <Text style={styles.loadingSubtitle}>AI is curating outfits...</Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function WeeklyPlanScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
    isRefetching,
  } = useQuery({
    queryKey: ['weekly-plans'],
    queryFn: () => apiClient.get('/recommendations/weekly/plans').then(r => r.data),
  });

  const plans: any[] = plansData?.plans ?? [];

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
    setJobId(null);
  }, []);

  const startPolling = useCallback((id: string) => {
    setPolling(true);
    setJobId(id);

    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get(`/recommendations/weekly/status/${id}`);
        const status: string = res.data?.status ?? res.data?.state ?? '';

        if (status === 'completed' || status === 'SUCCESS') {
          stopPolling();
          qc.invalidateQueries({ queryKey: ['weekly-plans'] });
        } else if (status === 'failed' || status === 'FAILURE') {
          stopPolling();
          Alert.alert('Generation Failed', res.data?.error ?? 'Please try again.');
        }
      } catch {}
    }, 5000);
  }, [stopPolling, qc]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const generateMutation = useMutation({
    mutationFn: (dayPreferences: DayPref[] = []) =>
      apiClient.post('/recommendations/weekly', {
        week_start: nextMonday(),
        ...(dayPreferences.length > 0 ? { day_preferences: dayPreferences } : {}),
      }),
    onSuccess: (res) => {
      const id: string | undefined = res.data?.job_id ?? res.data?.jobId;
      if (id) startPolling(id);
      else qc.invalidateQueries({ queryKey: ['weekly-plans'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not start generation.');
    },
  });

  const handleSave = useCallback(async (planId: string) => {
    setSavingId(planId);
    try {
      await apiClient.post(`/recommendations/weekly/plans/${planId}/save`);
      qc.invalidateQueries({ queryKey: ['weekly-plans'] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
    } catch {
      Alert.alert('Save Failed', 'Could not save outfit.');
    } finally {
      setSavingId(null);
    }
  }, [qc]);

  const isGenerating = generateMutation.isPending || polling;

  // Find plan for selected day
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayPlan = plans.find(p =>
    p.day_of_week === dayNames[selectedDayIdx] ||
    p.day_of_week === shortDayNames[selectedDayIdx]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>WEEKLY PLAN</Text>
            <TouchableOpacity onPress={() => setShowPrefs(true)} style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Day Selector */}
          <DaySelector
            selectedIdx={selectedDayIdx}
            onSelect={setSelectedDayIdx}
            plans={plans}
          />

          {/* Content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetchPlans()}
                tintColor={COLORS.primary}
              />
            }
          >
            {isGenerating ? (
              <GeneratingOverlay />
            ) : plansLoading ? (
              <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 80 }} />
            ) : plans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={40} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyTitle}>No plans yet</Text>
                <Text style={styles.emptySubtitle}>
                  Let AI craft your perfect week of outfits.
                </Text>
                <TouchableOpacity
                  onPress={() => generateMutation.mutate([])}
                  style={styles.generateButton}
                >
                  <Text style={styles.generateButtonText}>CREATE MY PLAN</Text>
                </TouchableOpacity>
              </View>
            ) : dayPlan ? (
              <DayView plan={dayPlan} onSave={handleSave} saving={savingId === dayPlan.id} />
            ) : (
              <View style={styles.noPlanFound}>
                <Text style={styles.noPlanText}>No plan for this day.</Text>
                <TouchableOpacity
                  onPress={() => generateMutation.mutate([])}
                  style={styles.regenerateBtn}
                >
                  <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 8 }} />
                  <Text style={styles.regenerateText}>Regenerate Week</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <BottomNav active="wardrobe" />
        </SafeAreaView>
      </LinearGradient>

      {/* Preferences sheet */}
      <WeeklyPreferencesSheet
        visible={showPrefs}
        onClose={() => setShowPrefs(false)}
        onGenerate={(prefs) => generateMutation.mutate(prefs)}
      />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 16, letterSpacing: 4 },
  filterButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },

  // Day Selector
  daySelectorContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  dayTab: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  dayTabActive: { backgroundColor: COLORS.primary },
  dayTabText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  dayTabTextActive: { color: '#fff' },
  hasPlanDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, position: 'absolute', bottom: 6 },

  // Scroll
  scrollContent: { paddingBottom: 140, paddingHorizontal: 20 },

  // Empty State
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, marginTop: 20 },
  emptySubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  generateButton: { marginTop: 30, height: 50, paddingHorizontal: 30, borderRadius: 25, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  generateButtonText: { fontFamily: FONTS.light, color: '#fff', fontSize: 13, letterSpacing: 2 },

  // No Plan
  noPlanFound: { alignItems: 'center', paddingTop: 60 },
  noPlanText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  regenerateText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 13 },

  // Loading
  loadingOverlay: { alignItems: 'center', paddingTop: 80 },
  loadingTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, marginTop: 25 },
  loadingSubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 },

  // Day View
  dayContainer: { marginTop: 10 },
  collageContainer: { borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', height: 340 },
  emptyCollage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  singleImage: { width: '100%', height: '100%' },

  // 2 items — side by side
  twoImageRow: { flex: 1, flexDirection: 'row', gap: 2 },

  // 3-4 items — 2×2 grid
  gridContainer: { flex: 1, gap: 2 },
  gridRow: { flex: 1, flexDirection: 'row', gap: 2 },

  // Shared image style — fills parent View
  fillImage: { width: '100%', height: '100%' },
  gridPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  moreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: FONTS.light, color: '#fff', fontSize: 20 },

  dayInfo: { marginTop: 18 },
  explanationText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 22 },

  // Save Button
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 25, backgroundColor: COLORS.primary, marginTop: 18 },
  saveButtonSaved: { backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  saveButtonText: { fontFamily: FONTS.light, color: '#fff', fontSize: 13, letterSpacing: 1 },
  saveButtonTextSaved: { color: '#4ADE80' },
});
