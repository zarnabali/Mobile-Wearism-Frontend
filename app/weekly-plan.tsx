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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { COLORS } from '../src/constants/theme';
import WeeklyPreferencesSheet, { DayPref } from './components/WeeklyPreferencesSheet';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns next Monday's date as YYYY-MM-DD */
function nextMonday(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun, 1 = Mon …
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d.toISOString().slice(0, 10);
}

/** "2026-05-11" → "Mon, 11 May" */
function fmtDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Score badge ────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? '#4ADE80' : pct >= 60 ? '#FF6B35' : '#F87171';
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: `${color}55`,
        borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
      }}
    >
      <Ionicons name="star" size={11} color={color} style={{ marginRight: 4 }} />
      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 12 }}>
        {pct}% Match
      </Text>
    </View>
  );
}

// ─── Color harmony chip ──────────────────────────────────────────────────────
function HarmonyChip({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)', borderRadius: 999,
        paddingHorizontal: 12, paddingVertical: 6,
      }}
    >
      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'capitalize' }}>
        🎨 {label}
      </Text>
    </View>
  );
}

// ─── Day View (Hero Layout) ──────────────────────────────────────────────────
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

  // Collage Layout Logic
  const renderCollage = () => {
    if (items.length === 0) {
      return (
        <View style={{ height: 320, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Ionicons name="shirt-outline" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>No items styled yet</Text>
        </View>
      );
    }

    if (items.length === 1) {
      return (
        <View style={{ height: 320, borderRadius: 32, overflow: 'hidden' }}>
          <Image source={{ uri: items[0].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
      );
    }

    if (items.length === 2) {
      return (
        <View style={{ height: 320, flexDirection: 'row', gap: 6 }}>
          <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
            <Image source={{ uri: items[0].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
            <Image source={{ uri: items[1].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        </View>
      );
    }

    if (items.length === 3) {
      return (
        <View style={{ height: 340, flexDirection: 'row', gap: 6 }}>
          <View style={{ flex: 1.5, borderRadius: 32, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <Image source={{ uri: items[0].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Image source={{ uri: items[1].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
            <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <Image source={{ uri: items[2].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          </View>
        </View>
      );
    }

    // Grid for 4+ items
    return (
      <View style={{ height: 340, gap: 6 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <Image source={{ uri: items[0].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <Image source={{ uri: items[1].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <Image source={{ uri: items[2].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <Image source={{ uri: items[3].image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {items.length > 4 && (
              <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: 'HelveticaNeue-Bold', fontSize: 18 }}>+{items.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ marginTop: 8 }}>
      {/* Hero Collage Area */}
      <View style={{ position: 'relative', marginBottom: 24 }}>
        {renderCollage()}
        
        {/* Floating Overlays */}
        <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 }}>
          <ScoreBadge score={plan.overall_score} />
          {plan.occasion && (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 11, textTransform: 'capitalize' }}>
                {plan.occasion.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content Card */}
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 32,
          padding: 24,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 18, lineHeight: 26, marginBottom: 12 }}>
          {plan.explanation || "AI is finalizing the styling notes for this day..."}
        </Text>

        {plan.style_note && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'flex-start' }}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.primary} style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18, fontStyle: 'italic' }}>
              {plan.style_note}
            </Text>
          </View>
        )}

        {plan.color_harmony ? (
          <View style={{ flexDirection: 'row', marginBottom: 20 }}>
            <HarmonyChip label={plan.color_harmony} />
          </View>
        ) : null}

        <TouchableOpacity
          onPress={() => onSave(plan.id)}
          disabled={saving || plan.is_saved}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: plan.is_saved ? 'rgba(74,222,128,0.12)' : COLORS.primary,
            borderRadius: 20, paddingVertical: 16, width: '100%',
            borderWidth: plan.is_saved ? 1 : 0,
            borderColor: 'rgba(74,222,128,0.3)',
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name={plan.is_saved ? "checkmark" : "bookmark"} size={18} color={plan.is_saved ? "#4ADE80" : "#fff"} style={{ marginRight: 10 }} />
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: plan.is_saved ? "#4ADE80" : "#fff", fontSize: 16 }}>
                {plan.is_saved ? "Saved to Outfits" : "Save Outfit"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Loading overlay ─────────────────────────────────────────────────────────
function GeneratingOverlay() {
  const tips = [
    "AI is analyzing your local weather for perfect layering...",
    "Finding color harmonies in your wardrobe...",
    "Ensuring no two days feel the same...",
    "Matching occasions to your best silhouettes...",
  ];
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const itv = setInterval(() => setTipIdx(i => (i + 1) % tips.length), 3500);
    return () => clearInterval(itv);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, marginTop: 60 }}>
      <View style={{ marginBottom: 40, alignItems: 'center' }}>
        <LinearGradient
          colors={[COLORS.primary, '#FF9F43']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowRadius: 20, shadowOpacity: 0.5 }}
        >
          <Ionicons name="sparkles" size={40} color="#fff" />
        </LinearGradient>
      </View>
      
      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 24, textAlign: 'center', marginBottom: 12 }}>
        Styling Your Week
      </Text>
      
      <View style={{ height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center' }}>
          {tips[tipIdx]}
        </Text>
      </View>

      <View style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 32, overflow: 'hidden' }}>
        <View style={{ width: '40%', height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 }} />
      </View>

      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 }}>
        This usually takes about 2-3 minutes
      </Text>
    </View>
  );
}

// ─── Day Selector ───────────────────────────────────────────────────────────
function DaySelector({ 
  selectedIdx, 
  onSelect, 
  plans 
}: { 
  selectedIdx: number, 
  onSelect: (idx: number) => void,
  plans: any[]
}) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={{ marginBottom: 28 }}
      contentContainerStyle={{ paddingRight: 20 }}
    >
      {days.map((day, idx) => {
        const isSelected = selectedIdx === idx;
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const hasPlan = plans.some(p => p.day_of_week === day || p.day_of_week === dayNames[idx]);
        
        return (
          <TouchableOpacity
            key={day}
            onPress={() => onSelect(idx)}
            activeOpacity={0.7}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 54,
              height: 72,
              borderRadius: 20,
              backgroundColor: isSelected ? COLORS.primary : 'rgba(255,255,255,0.05)',
              marginRight: 10,
              borderWidth: 1,
              borderColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ 
              fontFamily: 'HelveticaNeue-Medium', 
              color: isSelected ? '#fff' : 'rgba(255,255,255,0.4)', 
              fontSize: 12,
              marginBottom: 4
            }}>
              {day}
            </Text>
            <View style={{ 
              width: 4, height: 4, borderRadius: 2, 
              backgroundColor: isSelected ? '#fff' : (hasPlan ? COLORS.primary : 'transparent') 
            }} />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function WeeklyPlanScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch existing plans ──────────────────────────────────────────────────
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

  // ─── Stop polling util ─────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
    setJobId(null);
  }, []);

  // ─── Poll job status every 5 s ────────────────────────────────────────────
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
          Alert.alert(
            'Generation Failed',
            res.data?.error ?? 'The weekly plan could not be generated. Please try again.'
          );
        }
      } catch {
        // Network hiccup
      }
    }, 5000);
  }, [stopPolling, qc]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ─── Generate mutation ─────────────────────────────────────────────────────
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
      const msg = err?.response?.data?.error ?? 'Could not start weekly plan generation.';
      Alert.alert('Error', msg);
    },
  });

  // ─── Save a day's outfit ───────────────────────────────────────────────────
  const handleSave = useCallback(async (planId: string) => {
    setSavingId(planId);
    try {
      await apiClient.post(`/recommendations/weekly/plans/${planId}/save`);
      qc.invalidateQueries({ queryKey: ['weekly-plans'] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
    } catch (err: any) {
      Alert.alert('Save Failed', 'Could not save outfit.');
    } finally {
      setSavingId(null);
    }
  }, [qc]);

  const isGenerating = generateMutation.isPending || polling;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient
        colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => refetchPlans()}
                tintColor={COLORS.primary}
              />
            }
          >
            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>

              {/* ── Header ── */}
              <View
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 28,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#fff" />
                  </TouchableOpacity>
                  <View>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 26 }}>
                      Weekly Plan
                    </Text>
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>
                      Next 7 Days • AI Curated
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => setShowPrefs(true)}
                  style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.1)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="options-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              {/* ── Day Selector ── */}
              {!isGenerating && plans.length > 0 && (
                <DaySelector 
                  selectedIdx={selectedDayIdx} 
                  onSelect={setSelectedDayIdx} 
                  plans={plans}
                />
              )}

              {/* ── Content Area ── */}
              {isGenerating ? (
                <GeneratingOverlay />
              ) : plansLoading ? (
                <View style={{ marginTop: 80 }}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
              ) : plans.length === 0 ? (
                <View style={{ marginTop: 20 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderWidth: 1, borderColor: 'rgba(255,107,53,0.15)',
                      borderRadius: 32, padding: 40,
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,107,53,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                      <Ionicons name="calendar" size={32} color={COLORS.primary} />
                    </View>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
                      Start Your Week Right
                    </Text>
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                      Let our AI analyze your wardrobe and create the perfect 7-day styling plan.
                    </Text>
                    
                    <TouchableOpacity
                      onPress={() => generateMutation.mutate([])}
                      activeOpacity={0.9}
                      style={{
                        backgroundColor: COLORS.primary,
                        borderRadius: 18, paddingHorizontal: 32, paddingVertical: 16,
                        shadowColor: COLORS.primary, shadowRadius: 15, shadowOpacity: 0.3,
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>Generate Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  {/* Find the plan for the selected day */}
                  {(() => {
                    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const targetDay = dayNames[selectedDayIdx];
                    const targetShortDay = shortDayNames[selectedDayIdx];
                    
                    const dayPlan = plans.find(p => p.day_of_week === targetDay || p.day_of_week === targetShortDay);
                    
                    if (dayPlan) {
                      return (
                        <DayView
                          key={dayPlan.id}
                          plan={dayPlan}
                          onSave={handleSave}
                          saving={savingId === dayPlan.id}
                        />
                      );
                    } else {
                      return (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'HelveticaNeue' }}>No plan found for this day.</Text>
                        </View>
                      );
                    }
                  })()}

                  {/* Regenerate Button (Bottom) */}
                  <TouchableOpacity
                    onPress={() => generateMutation.mutate([])}
                    style={{
                      marginTop: 32,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 18, paddingVertical: 16,
                      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                      Regenerate Entire Week
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
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
