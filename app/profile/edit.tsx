import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

// ─── Option lists ─────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const AGE_RANGE_OPTIONS = [
  { value: '13-17', label: '13 – 17' },
  { value: '18-24', label: '18 – 24' },
  { value: '25-34', label: '25 – 34' },
  { value: '35-44', label: '35 – 44' },
  { value: '45-54', label: '45 – 54' },
  { value: '55+', label: '55+' },
];

const BODY_TYPES = [
  { value: 'slim', label: 'Slim', icon: 'body-outline' },
  { value: 'athletic', label: 'Athletic', icon: 'fitness-outline' },
  { value: 'average', label: 'Average', icon: 'person-outline' },
  { value: 'curvy', label: 'Curvy', icon: 'people-outline' },
  { value: 'plus', label: 'Plus', icon: 'person-circle-outline' },
];

const SKIN_TONES = [
  { value: 'fair', color: '#FFE0C3' },
  { value: 'light', color: '#F5C5A3' },
  { value: 'medium', color: '#C68642' },
  { value: 'olive', color: '#8D5524' },
  { value: 'brown', color: '#5C3317' },
  { value: 'dark', color: '#2C1810' },
];

// ─── Sub-components ───────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      className="text-white/50 text-xs uppercase tracking-widest mb-3 mt-6"
      style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}
    >
      {children}
    </Text>
  );
}

function OptionPill({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="px-4 h-11 rounded-full mr-2 mb-2"
      style={{
        backgroundColor: selected ? '#FF6B35' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: selected ? '#FF6B35' : 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: 'HelveticaNeue-Medium',
          fontSize: 14,
          color: selected ? '#fff' : 'rgba(255,255,255,0.6)',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
const EditProfileScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Pre-fill from cache
  const { data } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/user/profile').then(r => r.data),
  });
  const profile = data?.profile ?? data?.data ?? data;

  // ─── Form state ───────────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [skinTone, setSkinTone] = useState('');

  // Pre-fill once data arrives
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setGender(profile.gender ?? '');
    setAgeRange(profile.age_range ?? '');
    setHeightCm(profile.height_cm != null ? String(profile.height_cm) : '');
    setWeightKg(profile.weight_kg != null ? String(profile.weight_kg) : '');
    setBodyType(profile.body_type ?? '');
    setSkinTone(profile.skin_tone ?? '');
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send changed fields
      const payload: Record<string, any> = {};
      if (fullName !== (profile?.full_name ?? '')) payload.full_name = fullName;
      if (gender !== (profile?.gender ?? '')) payload.gender = gender;
      if (ageRange !== (profile?.age_range ?? '')) payload.age_range = ageRange;
      if (heightCm !== String(profile?.height_cm ?? '')) payload.height_cm = Number(heightCm) || null;
      if (weightKg !== String(profile?.weight_kg ?? '')) payload.weight_kg = Number(weightKg) || null;
      if (bodyType !== (profile?.body_type ?? '')) payload.body_type = bodyType;
      if (skinTone !== (profile?.skin_tone ?? '')) payload.skin_tone = skinTone;

      if (Object.keys(payload).length > 0) {
        await apiClient.patch('/user/profile', payload);
        queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err.response?.data?.error ?? 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-5 h-14"
            style={{ borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}
          >
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FF6B35" size="small" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 16 }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Full Name */}
            <SectionLabel>Full Name</SectionLabel>
            <View className="bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
              <Ionicons name="person-outline" size={20} color="#FF6B35" />
              <TextInput
                className="flex-1 ml-3"
                placeholder="Your full name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={fullName}
                onChangeText={setFullName}
                style={{ paddingVertical: 0, paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
              />
            </View>

            {/* Gender */}
            <SectionLabel>Gender</SectionLabel>
            <View className="flex-row flex-wrap">
              {GENDER_OPTIONS.map(o => (
                <OptionPill
                  key={o.value}
                  label={o.label}
                  selected={gender === o.value}
                  onPress={() => setGender(o.value)}
                />
              ))}
            </View>

            {/* Age Range */}
            <SectionLabel>Age Range</SectionLabel>
            <View className="flex-row flex-wrap">
              {AGE_RANGE_OPTIONS.map(o => (
                <OptionPill
                  key={o.value}
                  label={o.label}
                  selected={ageRange === o.value}
                  onPress={() => setAgeRange(o.value)}
                />
              ))}
            </View>

            {/* Height & Weight */}
            <SectionLabel>Measurements</SectionLabel>
            <View className="flex-row space-x-3">
              <View className="flex-1 bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
                <Ionicons name="resize-outline" size={20} color="#FF6B35" />
                <TextInput
                  className="flex-1 ml-3"
                  placeholder="Height (cm)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  keyboardType="numeric"
                  style={{ paddingVertical: 0, paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                />
              </View>
              <View className="flex-1 bg-white/10 rounded-xl px-4 h-14 flex-row items-center border border-white/20">
                <Ionicons name="barbell-outline" size={20} color="#FF6B35" />
                <TextInput
                  className="flex-1 ml-3"
                  placeholder="Weight (kg)"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  keyboardType="numeric"
                  style={{ paddingVertical: 0, paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                />
              </View>
            </View>

            {/* Body Type */}
            <SectionLabel>Body Type</SectionLabel>
            <View className="flex-row flex-wrap">
              {BODY_TYPES.map(b => (
                <TouchableOpacity
                  key={b.value}
                  onPress={() => setBodyType(b.value)}
                  activeOpacity={0.7}
                  className="items-center mr-3 mb-3"
                  style={{
                    backgroundColor: bodyType === b.value ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: bodyType === b.value ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    minWidth: 80,
                  }}
                >
                  <Ionicons
                    name={b.icon as any}
                    size={24}
                    color={bodyType === b.value ? '#FF6B35' : 'rgba(255,255,255,0.5)'}
                  />
                  <Text
                    className="mt-1 text-xs"
                    style={{
                      paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium',
                      color: bodyType === b.value ? '#FF6B35' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Skin Tone */}
            <SectionLabel>Skin Tone</SectionLabel>
            <View className="flex-row space-x-3 flex-wrap">
              {SKIN_TONES.map(s => (
                <TouchableOpacity
                  key={s.value}
                  onPress={() => setSkinTone(s.value)}
                  activeOpacity={0.8}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: s.color,
                    borderWidth: skinTone === s.value ? 3 : 1.5,
                    borderColor: skinTone === s.value ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                    marginRight: 12,
                    marginBottom: 12,
                  }}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default EditProfileScreen;
