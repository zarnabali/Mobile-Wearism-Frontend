import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../src/lib/apiClient';

function parseMaybeJson<T>(value: any, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function ScoreCard({ label, value, accent = false }: { label: string; value: any; accent?: boolean }) {
  const numeric = value != null && value !== '' ? Number(value) : null;
  return (
    <View
      style={{
        width: '48%',
        marginBottom: 12,
        borderRadius: 24,
        padding: 18,
        backgroundColor: accent ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.045)',
        borderWidth: 1,
        borderColor: accent ? 'rgba(255,107,53,0.35)' : 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: accent ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Light',
          color: accent ? '#FF6B35' : '#fff',
          fontSize: accent ? 30 : 25,
          marginTop: 8,
        }}
      >
        {numeric != null && !Number.isNaN(numeric) ? numeric.toFixed(1) : '—'}
      </Text>
    </View>
  );
}

function ListCard({
  title,
  icon,
  items,
  emptyText,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  emptyText: string;
}) {
  return (
    <View
      style={{
        borderRadius: 28,
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name={icon} size={16} color="#FF6B35" style={{ marginRight: 8 }} />
        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>
          {title}
        </Text>
      </View>
      {items.length === 0 ? (
        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          {emptyText}
        </Text>
      ) : (
        items.map((item, idx) => (
          <View key={`${title}-${idx}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: idx === items.length - 1 ? 0 : 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF6B35', marginTop: 7, marginRight: 10 }} />
            <Text style={{ flex: 1, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20 }}>
              {item}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function RateDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['outfit-photo-rating', id],
    queryFn: () => apiClient.get(`/outfit-photo-ratings/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const row = (query.state.data as any)?.rating;
      return row?.status === 'pending' || row?.status === 'processing' ? 5000 : false;
    },
  });

  const rating = data?.rating;
  const feedback = parseMaybeJson<string[]>(rating?.feedback, []);
  const strengths = parseMaybeJson<string[]>(rating?.strengths, []);
  const improvements = parseMaybeJson<string[]>(rating?.improvements, []);
  const warnings = parseMaybeJson<string[]>(rating?.warnings, []);
  const breakdown = parseMaybeJson<Record<string, any>>(rating?.breakdown, {});

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (!rating) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
          Rating not found.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>
                Rating Details
              </Text>
              <View style={{ width: 42 }} />
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <View
                style={{
                  borderRadius: 34,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.045)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  marginBottom: 20,
                }}
              >
                <Image source={{ uri: rating.image_url }} style={{ width: '100%', height: 360 }} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
                  style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18 }}
                >
                  <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', marginBottom: 10 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.85)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      AI rating
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 28 }}>
                    {(rating.dominant_aesthetic || 'Outfit Rating').replace(/_/g, ' ')}
                  </Text>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 6 }}>
                    {[rating.occasion, rating.weather, rating.season, rating.style_preference].filter(Boolean).join(' • ').replace(/_/g, ' ')}
                  </Text>
                </LinearGradient>
              </View>

              <View
                style={{
                  borderRadius: 28,
                  padding: 22,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  marginBottom: 18,
                }}
              >
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Overall Rating
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 50, lineHeight: 54 }}>
                      {rating.rating != null ? Number(rating.rating).toFixed(1) : '—'}
                    </Text>
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.48)', fontSize: 14, marginLeft: 6, marginBottom: 7 }}>
                      / 10
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: 'rgba(255,107,53,0.10)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,107,53,0.20)' }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 12 }}>
                        {rating.status}
                      </Text>
                    </View>
                    {rating.color_harmony_type ? (
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 8, textTransform: 'capitalize' }}>
                        {String(rating.color_harmony_type).replace(/_/g, ' ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 }}>
                <ScoreCard label="Color" value={rating.color_score} />
                <ScoreCard label="Proportion" value={rating.proportion_score} />
                <ScoreCard label="Style" value={rating.style_score} />
                <ScoreCard label="Compatibility" value={rating.compatibility_score} />
              </View>

              <View
                style={{
                  borderRadius: 28,
                  padding: 20,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16, marginBottom: 12 }}>
                  Breakdown
                </Text>
                {Object.keys(breakdown).length === 0 ? (
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                    No detailed breakdown was returned.
                  </Text>
                ) : (
                  Object.entries(breakdown).map(([key, value]) => (
                    <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.75)', fontSize: 14, textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 14 }}>
                        {typeof value === 'number' ? value.toFixed(1) : String(value)}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <ListCard title="Feedback" icon="chatbubble-ellipses-outline" items={feedback} emptyText="No feedback returned." />
              <ListCard title="Strengths" icon="sparkles-outline" items={strengths.map((x) => x.replace(/_/g, ' '))} emptyText="No strengths returned." />
              <ListCard title="Improvements" icon="trending-up-outline" items={improvements.map((x) => x.replace(/_/g, ' '))} emptyText="No improvements returned." />

              {warnings.length > 0 ? (
                <ListCard title="Warnings" icon="warning-outline" items={warnings} emptyText="No warnings." />
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
