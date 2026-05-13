import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DAY_SHORT: Record<string, string> = {
  Monday: 'MON', Tuesday: 'TUE', Wednesday: 'WED', Thursday: 'THU',
  Friday: 'FRI', Saturday: 'SAT', Sunday: 'SUN',
};

const OCCASIONS = [
  { value: 'casual',           label: 'Casual' },
  { value: 'smart_casual',     label: 'Smart Casual' },
  { value: 'business_casual',  label: 'Biz Casual' },
  { value: 'business_formal',  label: 'Biz Formal' },
  { value: 'formal',           label: 'Formal' },
  { value: 'athletic',         label: 'Athletic' },
  { value: 'party',            label: 'Party' },
  { value: 'streetwear',       label: 'Streetwear' },
  { value: 'outdoor',          label: 'Outdoor' },
  { value: 'beach',            label: 'Beach' },
  { value: 'evening',          label: 'Evening' },
];

const WEATHER = [
  { value: 'hot',  label: '☀️ Hot' },
  { value: 'warm', label: '🌤 Warm' },
  { value: 'mild', label: '🌥 Mild' },
  { value: 'cool', label: '🌬 Cool' },
  { value: 'cold', label: '❄️ Cold' },
];

const DEFAULT_OCCASION = 'smart_casual';
const DEFAULT_WEATHER  = 'mild';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DayPref = {
  day_of_week: string;
  occasion: string;
  weather: string;
};

type PickerField = { day: string; field: 'occasion' | 'weather' } | null;

type Props = {
  visible: boolean;
  onClose: () => void;
  onGenerate: (prefs: DayPref[]) => void;
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

function OptionsRow({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.optionsRowContent}
    >
      {options.map(o => {
        const selected = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
            style={[styles.optionPill, selected && styles.optionPillActive]}
          >
            <Text style={[styles.optionPillText, selected && styles.optionPillTextActive]}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function Chip({ label, highlight }: { label: string; highlight: boolean }) {
  return (
    <View style={[styles.chip, highlight && styles.chipHighlighted]}>
      <Text style={[styles.chipText, highlight && styles.chipTextHighlighted]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WeeklyPreferencesSheet({ visible, onClose, onGenerate }: Props) {
  const [prefs, setPrefs] = useState<Record<string, DayPref>>(() =>
    Object.fromEntries(
      DAYS.map(d => [d, { day_of_week: d, occasion: DEFAULT_OCCASION, weather: DEFAULT_WEATHER }])
    )
  );

  const [expanded, setExpanded] = useState<string | null>(null);
  const [picker, setPicker] = useState<PickerField>(null);

  const toggle = (day: string) => {
    setExpanded(prev => (prev === day ? null : day));
    setPicker(null);
  };

  const setField = (day: string, field: 'occasion' | 'weather', val: string) => {
    setPrefs(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
    setPicker(null);
  };

  const handleGenerate = () => {
    const changed = Object.values(prefs).filter(
      p => p.occasion !== DEFAULT_OCCASION || p.weather !== DEFAULT_WEATHER
    );
    onGenerate(changed);
    onClose();
  };

  const occasionLabel = (v: string) => OCCASIONS.find(o => o.value === v)?.label ?? v;
  const weatherLabel  = (v: string) => WEATHER.find(o => o.value === v)?.label ?? v;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          <LinearGradient
            colors={['#1A1A1A', '#0D0D0D']}
            style={styles.sheetBackground}
          >
            {/* Handle */}
            <View style={styles.sheetHandleContainer}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>PERSONALISE YOUR WEEK</Text>
                <Text style={styles.sheetSubtitle}>Set preferences for each day</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetContentScroll}
              contentContainerStyle={styles.sheetContentContainer}
            >
              {DAYS.map(day => {
                const p = prefs[day];
                const isOpen = expanded === day;
                const modified = p.occasion !== DEFAULT_OCCASION || p.weather !== DEFAULT_WEATHER;

                return (
                  <View key={day} style={styles.dayRowWrapper}>
                    <TouchableOpacity
                      onPress={() => toggle(day)}
                      activeOpacity={0.9}
                      style={[
                        styles.dayRow,
                        isOpen && styles.dayRowOpen,
                        modified && !isOpen && styles.dayRowModified
                      ]}
                    >
                      <View style={styles.dayLabelContainer}>
                        <Text style={[styles.dayLabelText, isOpen && styles.dayLabelTextActive]}>
                          {DAY_SHORT[day]}
                        </Text>
                      </View>

                      <View style={styles.chipsContainer}>
                        <Chip label={occasionLabel(p.occasion)} highlight={p.occasion !== DEFAULT_OCCASION} />
                        <Chip label={weatherLabel(p.weather)} highlight={p.weather !== DEFAULT_WEATHER} />
                      </View>

                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={isOpen ? COLORS.primary : 'rgba(255,255,255,0.2)'}
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.expandedContent}>
                        <View style={styles.selectorTabs}>
                          <TouchableOpacity 
                            onPress={() => setPicker({ day, field: 'occasion' })}
                            style={[styles.selectorTab, picker?.field === 'occasion' && styles.selectorTabActive]}
                          >
                            <Text style={[styles.selectorTabText, picker?.field === 'occasion' && styles.selectorTabTextActive]}>Occasion</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => setPicker({ day, field: 'weather' })}
                            style={[styles.selectorTab, picker?.field === 'weather' && styles.selectorTabActive]}
                          >
                            <Text style={[styles.selectorTabText, picker?.field === 'weather' && styles.selectorTabTextActive]}>Weather</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.optionsWrapper}>
                          {picker?.field === 'occasion' ? (
                            <OptionsRow options={OCCASIONS} value={p.occasion} onChange={v => setField(day, 'occasion', v)} />
                          ) : picker?.field === 'weather' ? (
                            <OptionsRow options={WEATHER} value={p.weather} onChange={v => setField(day, 'weather', v)} />
                          ) : (
                            <View style={styles.selectorPlaceholder}>
                              <Text style={styles.placeholderText}>Choose a category above to customize</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <SafeAreaView style={styles.sheetFooter}>
              <TouchableOpacity
                onPress={handleGenerate}
                activeOpacity={0.9}
                style={styles.primaryActionButton}
              >
                <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.primaryActionButtonText}>GENERATE CUSTOM PLAN</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  sheetContainer: { height: SCREEN_HEIGHT * 0.85, width: '100%' },
  sheetBackground: { flex: 1, borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  sheetHandleContainer: { alignItems: 'center', paddingVertical: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  sheetTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 18, letterSpacing: 2 },
  sheetSubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  sheetContentScroll: { flex: 1 },
  sheetContentContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  
  dayRowWrapper: { marginBottom: 12 },
  dayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  dayRowOpen: { backgroundColor: 'rgba(255,107,53,0.05)', borderColor: 'rgba(255,107,53,0.2)', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  dayRowModified: { borderColor: 'rgba(255,107,53,0.15)', backgroundColor: 'rgba(255,107,53,0.02)' },
  
  dayLabelContainer: { width: 50 },
  dayLabelText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14, letterSpacing: 1 },
  dayLabelTextActive: { color: COLORS.primary },
  
  chipsContainer: { flex: 1, flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipHighlighted: { backgroundColor: 'rgba(255,107,53,0.1)', borderColor: 'rgba(255,107,53,0.2)' },
  chipText: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  chipTextHighlighted: { color: COLORS.primary },
  
  expandedContent: { backgroundColor: 'rgba(255,107,53,0.03)', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,107,53,0.2)', paddingBottom: 10 },
  selectorTabs: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  selectorTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  selectorTabActive: { backgroundColor: COLORS.primary },
  selectorTabText: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  selectorTabTextActive: { color: '#fff' },
  
  optionsWrapper: { marginTop: 10, minHeight: 60 },
  optionsRowContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  optionPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionPillActive: { backgroundColor: 'rgba(255,107,53,0.1)', borderColor: COLORS.primary },
  optionPillText: { fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  optionPillTextActive: { color: COLORS.primary },
  
  selectorPlaceholder: { paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  placeholderText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.2)', fontSize: 12 },
  
  sheetFooter: { paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryActionButton: { backgroundColor: COLORS.primary, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: COLORS.primary, shadowRadius: 15, shadowOpacity: 0.3 },
  primaryActionButtonText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14, letterSpacing: 1 },
});
