import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../src/lib/apiClient';
import BottomNav from './components/BottomNav';
import { COLORS, FONTS } from '../src/constants/theme';

const { width } = Dimensions.get('window');

const OCCASIONS = ['casual', 'smart_casual', 'business_casual', 'business_formal', 'black_tie', 'athletic', 'party', 'old_money', 'streetwear', 'outdoor'] as const;

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

const RateScreen = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [occasion, setOccasion] = useState<typeof OCCASIONS[number]>('casual');

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
      form.append('gender', 'unspecified');
      form.append('occasion', occasion);
      form.append('weather', 'mild');
      form.append('season', 'spring');
      form.append('style_preference', 'any');
      form.append('mode', 'direct_vision');
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
      Alert.alert('Analysis Started', 'AI is now rating your look.');
    },
    onError: (err: any) => {
      Alert.alert('Upload Failed', err?.response?.data?.error ?? 'Something went wrong.');
    },
  });

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
        allowsEditing: false,
        quality: 0.85,
      })
      : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a0a0a', '#121212']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>RATE MY LOOK</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Upload Area */}
            <View style={styles.uploadCard}>
              {selectedImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => pickImage(false)} style={styles.dropZone}>
                  <View style={styles.dropZoneIcon}>
                    <Ionicons name="add" size={32} color="rgba(255,255,255,0.2)" />
                  </View>
                  <Text style={styles.dropZoneTitle}>Upload your outfit</Text>
                  <Text style={styles.dropZoneSubtitle}>Full body shots work best</Text>
                </TouchableOpacity>
              )}

              {/* Quick Actions */}
              <View style={styles.uploadActions}>
                {!selectedImage && (
                  <TouchableOpacity onPress={() => pickImage(true)} style={styles.actionBtn}>
                    <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                )}
                {selectedImage && (
                  <TouchableOpacity onPress={() => pickImage(false)} style={styles.actionBtn}>
                    <Ionicons name="images-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Occasion Selector */}
              <Text style={styles.occasionLabel}>OCCASION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.occasionScroll}>
                {OCCASIONS.map((opt) => {
                  const selected = opt === occasion;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setOccasion(opt)}
                      activeOpacity={0.8}
                      style={[styles.occasionChip, selected && styles.occasionChipActive]}
                    >
                      <Text style={[styles.occasionChipText, selected && styles.occasionChipTextActive]}>
                        {opt.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Submit */}
              <TouchableOpacity
                onPress={() => uploadMutation.mutate()}
                disabled={!selectedImage || uploadMutation.isPending}
                style={[styles.submitBtn, !selectedImage && styles.submitBtnDisabled]}
              >
                {uploadMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>ANALYZE</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Recent */}
            {recentRatings.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>RECENT</Text>
                <View style={styles.ratingList}>
                  {recentRatings.map((row) => (
                    <TouchableOpacity
                      key={row.id}
                      onPress={() => router.push(`/rate-detail?id=${row.id}` as any)}
                      activeOpacity={0.8}
                      style={styles.ratingItem}
                    >
                      {row.image_url ? (
                        <Image source={{ uri: row.image_url }} style={styles.ratingThumb} />
                      ) : (
                        <View style={[styles.ratingThumb, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.1)" />
                        </View>
                      )}
                      <View style={styles.ratingInfo}>
                        <Text style={styles.ratingMainText} numberOfLines={1}>
                          {(row.occasion || 'Look').replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.ratingSubText}>
                          {formatRelativeDate(row.created_at)}
                        </Text>
                      </View>
                      <View style={styles.ratingScoreContainer}>
                        <Text style={styles.ratingScoreValue}>
                          {row.status === 'completed' ? Number(row.rating).toFixed(1) : '...'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
          <BottomNav active="rate" />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 25, paddingVertical: 20 },
  headerTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 22, letterSpacing: 4 },
  
  scrollContent: { paddingBottom: 140 },
  uploadCard: { marginHorizontal: 20, padding: 20 },
  
  previewContainer: { height: 320, borderRadius: 20, overflow: 'hidden', marginBottom: 15, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  
  dropZone: { height: 200, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  dropZoneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dropZoneTitle: { fontFamily: FONTS.light, color: '#fff', fontSize: 14 },
  dropZoneSubtitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 },
  
  uploadActions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  actionBtnText: { fontFamily: FONTS.light, color: '#fff', fontSize: 13 },
  
  occasionLabel: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 2, marginBottom: 10 },
  occasionScroll: { gap: 8, paddingBottom: 20 },
  occasionChip: { paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  occasionChipActive: { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: COLORS.primary },
  occasionChipText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  occasionChipTextActive: { color: COLORS.primary },
  
  submitBtn: { height: 54, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontFamily: FONTS.light, color: '#fff', fontSize: 14, letterSpacing: 2 },
  
  recentSection: { marginTop: 30, paddingHorizontal: 25 },
  recentTitle: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 3, marginBottom: 15 },
  
  ratingList: { gap: 10 },
  ratingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  ratingThumb: { width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  ratingInfo: { flex: 1, marginLeft: 12 },
  ratingMainText: { fontFamily: FONTS.light, color: '#fff', fontSize: 13 },
  ratingSubText: { fontFamily: FONTS.light, color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3 },
  ratingScoreContainer: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,107,53,0.1)', marginRight: 8 },
  ratingScoreValue: { fontFamily: FONTS.light, color: '#fff', fontSize: 13 },
});

export default RateScreen;
