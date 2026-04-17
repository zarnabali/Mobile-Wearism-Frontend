import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../src/lib/apiClient';
import BottomNav from './components/BottomNav';

const GENDERS = ['male', 'female', 'non_binary', 'unspecified'] as const;
const OCCASIONS = ['casual', 'smart_casual', 'business_casual', 'business_formal', 'black_tie', 'athletic', 'party', 'old_money', 'streetwear', 'outdoor'] as const;
const WEATHERS = ['hot', 'warm', 'mild', 'cool', 'cold'] as const;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
const STYLE_PREFERENCES = ['any', 'minimal', 'classic', 'streetwear', 'boho', 'edgy', 'preppy', 'old_money', 'sporty', 'feminine', 'masculine', 'business'] as const;

function formatRelativeDate(value?: string) {
  if (!value) return '';
  const now = Date.now();
  const ts = new Date(value).getTime();
  const diffMs = Math.max(0, now - ts);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function OptionChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => onChange(option)}
              activeOpacity={0.85}
              style={{
                marginRight: 8,
                paddingHorizontal: 14,
                height: 40,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                backgroundColor: selected ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.05)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: selected ? '#FF6B35' : 'rgba(255,255,255,0.72)', fontSize: 12 }}>
                {option.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const RateScreen = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [gender, setGender] = useState<typeof GENDERS[number]>('unspecified');
  const [occasion, setOccasion] = useState<typeof OCCASIONS[number]>('casual');
  const [weather, setWeather] = useState<typeof WEATHERS[number]>('mild');
  const [season, setSeason] = useState<typeof SEASONS[number]>('spring');
  const [stylePreference, setStylePreference] = useState<typeof STYLE_PREFERENCES[number]>('any');

  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['outfit-photo-ratings', 'recent'],
    queryFn: () => apiClient.get('/outfit-photo-ratings/recent?limit=5').then(r => r.data),
    refetchInterval: (query) => {
      const raw = query.state.data as { data?: any[] } | undefined;
      const rows = raw?.data ?? [];
      return Array.isArray(rows) && rows.some((row) => row?.status === 'pending' || row?.status === 'processing')
        ? 5000
        : false;
    },
  });

  const recentRatings: any[] = recentData?.data ?? [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error('Select an image first.');
      const form = new FormData();
      form.append('gender', gender);
      form.append('occasion', occasion);
      form.append('weather', weather);
      form.append('season', season);
      form.append('style_preference', stylePreference);
      form.append('mode', 'heavyweight');
      form.append('file', {
        uri: selectedImage.uri,
        name: 'outfit-rating.jpg',
        type: 'image/jpeg',
      } as any);

      return apiClient.post('/outfit-photo-ratings', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfit-photo-ratings', 'recent'] });
      setSelectedImage(null);
      Alert.alert('Queued', 'Your outfit photo was uploaded. AI rating is now processing.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.message ?? 'Upload failed.';
      Alert.alert('Upload Failed', msg);
    },
  });

  const averageScore = useMemo(() => {
    const completed = recentRatings.filter((row) => row?.status === 'completed' && row?.rating != null);
    if (completed.length === 0) return null;
    const total = completed.reduce((sum, row) => sum + Number(row.rating || 0), 0);
    return total / completed.length;
  }, [recentRatings]);

  const pickImage = async (useCamera = false) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access denied');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          // Do NOT force an editor crop; users should be able to upload any aspect ratio.
          allowsEditing: false,
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          // Do NOT force an editor crop; users should be able to upload any aspect ratio.
          allowsEditing: false,
          quality: 0.85,
        });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
            <View className="px-5 pt-4" style={{ gap: 26 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-3xl font-light tracking-wide" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                  AI Outfit Ratings
                </Text>
                <View className="bg-white/10 px-3 py-2 rounded-full border border-white/10">
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 12 }}>
                    {averageScore != null ? `${averageScore.toFixed(1)} avg` : 'No ratings yet'}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  borderRadius: 32,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <LinearGradient
                  colors={['rgba(255, 107, 53, 0.14)', 'rgba(0,0,0,0.0)', 'rgba(255,255,255,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ padding: 24, borderRadius: 30 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                        Rate your outfit
                      </Text>
                      <Text className="text-white/60 text-sm leading-5" style={{ fontFamily: 'HelveticaNeue' }}>
                        Upload one look and get fast AI feedback in a clean, premium format.
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,107,53,0.12)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,107,53,0.22)',
                      }}
                    >
                      <Ionicons name="sparkles-outline" size={24} color="#FF6B35" />
                    </View>
                  </View>

                  {selectedImage ? (
                    <Image
                      source={{ uri: selectedImage.uri }}
                      style={{ width: '100%', height: 240, borderRadius: 24, marginBottom: 16 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ height: 210, borderRadius: 24, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.34)" />
                      </View>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.72)', fontSize: 14, marginTop: 14 }}>
                        Add an outfit photo
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.42)', fontSize: 12, marginTop: 6 }}>
                        Minimal input, instant rating
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => pickImage(true)}
                      className="flex-1 flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10"
                      activeOpacity={0.9}
                    >
                      <Ionicons name="camera-outline" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                        Camera
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      className="flex-1 flex-row items-center justify-center bg-white/10 py-4 rounded-2xl border border-white/10"
                      activeOpacity={0.9}
                    >
                      <Ionicons name="images-outline" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text className="text-white" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                        Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 13 }}>
                        Advanced parameters
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
                        Optional context for a more specific rating
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowAdvanced((s) => !s)}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        borderRadius: 999,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 12, marginRight: 6 }}>
                        {showAdvanced ? 'Hide' : 'Customize'}
                      </Text>
                      <Ionicons name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={14} color="#FF6B35" />
                    </TouchableOpacity>
                  </View>

                  {showAdvanced ? (
                    <View
                      style={{
                        marginTop: 10,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <OptionChips label="Gender" options={GENDERS} value={gender} onChange={(v) => setGender(v as any)} />
                      <OptionChips label="Occasion" options={OCCASIONS} value={occasion} onChange={(v) => setOccasion(v as any)} />
                      <OptionChips label="Weather" options={WEATHERS} value={weather} onChange={(v) => setWeather(v as any)} />
                      <OptionChips label="Season" options={SEASONS} value={season} onChange={(v) => setSeason(v as any)} />
                      <OptionChips label="Style Preference" options={STYLE_PREFERENCES} value={stylePreference} onChange={(v) => setStylePreference(v as any)} />
                    </View>
                  ) : (
                    <View
                      style={{
                        marginTop: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                        Default context:
                        <Text style={{ color: '#fff' }}> {occasion.replace(/_/g, ' ')}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.42)' }}> • </Text>
                        <Text style={{ color: '#fff' }}>{weather}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.42)' }}> • </Text>
                        <Text style={{ color: '#fff' }}>{season}</Text>
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (!selectedImage) {
                        Alert.alert('Missing Image', 'Please select an outfit photo first.');
                        return;
                      }
                      uploadMutation.mutate();
                    }}
                    className="flex-row items-center justify-center bg-[#FF6B35] py-4 rounded-2xl shadow-lg shadow-orange-500/20 mt-5"
                    activeOpacity={0.9}
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="scan-outline" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                          Analyze Outfit
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Recent Analysis */}
              <View>
                <View className="flex-row items-center justify-between mb-2 px-1">
                  <Text className="text-white text-xl font-light" style={{ fontFamily: 'HelveticaNeue-Light' }}>
                    Recent Analysis
                  </Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                    <Text className="text-white/50 text-sm" style={{ fontFamily: 'HelveticaNeue' }}>
                      Latest 5
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 10 }}>
                  {recentLoading ? (
                    <ActivityIndicator color="#FF6B35" style={{ alignSelf: 'flex-start', marginTop: 8 }} />
                  ) : recentRatings.length === 0 ? (
                    <View className="bg-white/05 border border-white/10 rounded-3xl p-5">
                      <Text className="text-white/60" style={{ fontFamily: 'HelveticaNeue' }}>
                        No outfit photo ratings yet.
                      </Text>
                    </View>
                  ) : (
                    recentRatings.map((row) => (
                      <TouchableOpacity
                        key={row.id}
                        onPress={() => router.push(`/rate-detail?id=${row.id}` as any)}
                        activeOpacity={0.85}
                        className="flex-row items-center justify-between bg-white/05 border border-white/10 rounded-3xl p-3"
                      >
                        <View className="flex-row items-center" style={{ flex: 1 }}>
                          <Image
                            source={{ uri: row.image_url }}
                            style={{ width: 68, height: 68, borderRadius: 20, marginRight: 14, backgroundColor: 'rgba(255,255,255,0.08)' }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text className="text-white text-base font-medium mb-1" style={{ fontFamily: 'HelveticaNeue-Medium' }} numberOfLines={1}>
                              {(row.dominant_aesthetic || row.occasion || 'Outfit rating').replace(/_/g, ' ')}
                            </Text>
                            <Text className="text-white/40 text-xs" style={{ fontFamily: 'HelveticaNeue' }}>
                              {[row.occasion, row.weather, row.season].filter(Boolean).join(' • ') || formatRelativeDate(row.created_at)}
                            </Text>
                            {row.status !== 'completed' ? (
                              <Text style={{ fontFamily: 'HelveticaNeue', color: '#FF6B35', fontSize: 11, marginTop: 4 }}>
                                {row.status === 'failed' ? (row.error_message || 'Failed') : 'Processing...'}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <View className="flex-row items-center pr-2">
                          <View className="items-end">
                            <View className="flex-row items-center bg-[#FF6B35]/10 px-3 py-1.5 rounded-xl border border-[#FF6B35]/20">
                              <Text className="text-white text-base font-bold mr-1" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                                {row.status === 'completed' && row.rating != null ? Number(row.rating).toFixed(1) : '...'}
                              </Text>
                              <Ionicons name="star" size={12} color="#FF6B35" />
                            </View>
                            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 5 }}>
                              {formatRelativeDate(row.created_at)}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.28)" style={{ marginLeft: 10 }} />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="rate" />
      </LinearGradient>
    </View>
  );
};

export default RateScreen;

