import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
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

// ─── Pill Picker (inline options row) ────────────────────────────────────────

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
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
    >
      {options.map(o => {
        const selected = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: selected ? COLORS.primary : 'rgba(255,255,255,0.06)',
              borderWidth: 1,
              borderColor: selected ? COLORS.primary : 'rgba(255,255,255,0.1)',
            }}
          >
            <Text
              style={{
                fontFamily: 'HelveticaNeue-Medium',
                fontSize: 12,
                color: selected ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WeeklyPreferencesSheet({ visible, onClose, onGenerate }: Props) {
  const [prefs, setPrefs] = useState<Record<string, DayPref>>(() =>
    Object.fromEntries(
      DAYS.map(d => [d, { day_of_week: d, occasion: DEFAULT_OCCASION, weather: DEFAULT_WEATHER }])
    )
  );

  // Which day row is expanded
  const [expanded, setExpanded] = useState<string | null>(null);
  // Which sub-picker is open: 'occasion' | 'weather'
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
    // Only send days that differ from defaults
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
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
        <View
          style={{
            backgroundColor: '#0E0E0E',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            maxHeight: '88%',
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 38, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 4,
            }}
          >
            <View>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>
                Customize Week
              </Text>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                Tap a day to set occasion & weather
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          {/* Day rows */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ marginTop: 8 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          >
            {DAYS.map(day => {
              const p = prefs[day];
              const isOpen = expanded === day;
              const modified =
                p.occasion !== DEFAULT_OCCASION || p.weather !== DEFAULT_WEATHER;

              return (
                <View key={day} style={{ marginBottom: 8 }}>
                  {/* Row header */}
                  <TouchableOpacity
                    onPress={() => toggle(day)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isOpen
                        ? 'rgba(255,107,53,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      borderWidth: 1,
                      borderColor: isOpen
                        ? 'rgba(255,107,53,0.3)'
                        : modified
                        ? 'rgba(255,107,53,0.15)'
                        : 'rgba(255,255,255,0.07)',
                      borderRadius: isOpen ? 18 : 16,
                      borderBottomLeftRadius: isOpen ? 0 : 16,
                      borderBottomRightRadius: isOpen ? 0 : 16,
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                    }}
                  >
                    {/* Day name */}
                    <Text
                      style={{
                        fontFamily: 'HelveticaNeue-Bold',
                        color: isOpen ? COLORS.primary : '#fff',
                        fontSize: 14,
                        width: 36,
                      }}
                    >
                      {DAY_SHORT[day]}
                    </Text>

                    {/* Chips */}
                    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
                      <Chip label={occasionLabel(p.occasion)} highlight={p.occasion !== DEFAULT_OCCASION} />
                      <Chip label={weatherLabel(p.weather)} highlight={p.weather !== DEFAULT_WEATHER} />
                    </View>

                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="rgba(255,255,255,0.3)"
                    />
                  </TouchableOpacity>

                  {/* Expanded picker area */}
                  {isOpen && (
                    <View
                      style={{
                        backgroundColor: 'rgba(255,107,53,0.05)',
                        borderWidth: 1,
                        borderTopWidth: 0,
                        borderColor: 'rgba(255,107,53,0.25)',
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                        paddingBottom: 4,
                      }}
                    >
                      {/* Sub-section toggles */}
                      <View
                        style={{
                          flexDirection: 'row',
                          paddingHorizontal: 14,
                          paddingTop: 10,
                          gap: 8,
                        }}
                      >
                        <SectionTab
                          label="Occasion"
                          active={picker?.field === 'occasion' && picker.day === day}
                          onPress={() =>
                            setPicker(prev =>
                              prev?.field === 'occasion' && prev.day === day
                                ? null
                                : { day, field: 'occasion' }
                            )
                          }
                        />
                        <SectionTab
                          label="Weather"
                          active={picker?.field === 'weather' && picker.day === day}
                          onPress={() =>
                            setPicker(prev =>
                              prev?.field === 'weather' && prev.day === day
                                ? null
                                : { day, field: 'weather' }
                            )
                          }
                        />
                      </View>

                      {/* Occasion pills */}
                      {picker?.field === 'occasion' && picker.day === day && (
                        <OptionsRow
                          options={OCCASIONS}
                          value={p.occasion}
                          onChange={v => setField(day, 'occasion', v)}
                        />
                      )}

                      {/* Weather pills */}
                      {picker?.field === 'weather' && picker.day === day && (
                        <OptionsRow
                          options={WEATHER}
                          value={p.weather}
                          onChange={v => setField(day, 'weather', v)}
                        />
                      )}

                      {/* Placeholder when nothing selected */}
                      {!picker && (
                        <Text
                          style={{
                            fontFamily: 'HelveticaNeue',
                            color: 'rgba(255,255,255,0.25)',
                            fontSize: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                          }}
                        >
                          Tap Occasion or Weather to customise
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Generate button */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: Platform.OS === 'ios' ? 32 : 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.88}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: COLORS.primary,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Ionicons name="sparkles" size={17} color="#fff" />
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>
                Generate Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function Chip({ label, highlight }: { label: string; highlight: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: highlight ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: highlight ? 'rgba(255,107,53,0.35)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <Text
        style={{
          fontFamily: 'HelveticaNeue-Medium',
          fontSize: 11,
          color: highlight ? COLORS.primary : 'rgba(255,255,255,0.45)',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionTab({
  label, active, onPress,
}: {
  label: string; active: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: active ? COLORS.primary : 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: active ? COLORS.primary : 'rgba(255,255,255,0.1)',
      }}
    >
      <Text
        style={{
          fontFamily: 'HelveticaNeue-Medium',
          fontSize: 12,
          color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
