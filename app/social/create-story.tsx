import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';

export default function CreateStoryScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id) ?? '';

  const { data: statusData } = useQuery({
    queryKey: ['stories-status'],
    queryFn: () => apiClient.get('/stories/status').then((r) => r.data),
    enabled: !!userId,
  });

  const canPost = statusData?.can_post !== false;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    };
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera access denied');
        return;
      }
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleUpload = async () => {
    if (!imageUri || !userId) return;
    if (!canPost) {
      Alert.alert('Daily limit', 'You can only post one story per day.');
      return;
    }
    setLoading(true);
    try {
      const storyId = uuidv4();
      const filename = `${storyId}.jpg`;
      const imagePath = `${userId}/stories/${filename}`;

      const form = new FormData();
      form.append('story_id', storyId);
      form.append('image_path', imagePath);
      form.append('file', { uri: imageUri, name: filename, type: 'image/jpeg' } as any);

      await apiClient.post('/stories', form, { headers: { 'Content-Type': 'multipart/form-data' } });

      await qc.invalidateQueries({ queryKey: ['stories-feed'] });
      await qc.invalidateQueries({ queryKey: ['stories-status'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Upload failed', err.response?.data?.error ?? 'Could not upload story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 17 }}>New Story</Text>
            <TouchableOpacity onPress={handleUpload} disabled={loading || !imageUri || !canPost}>
              {loading ? (
                <ActivityIndicator color="#FF6B35" size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'HelveticaNeue-Bold',
                    color: !imageUri || !canPost ? 'rgba(255,107,53,0.4)' : '#FF6B35',
                    fontSize: 16,
                  }}
                >
                  Share
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 520, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {!loading && (
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      style={{ position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Ionicons name="sync" size={14} color="white" style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 12 }}>Change</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                  <Ionicons name="images-outline" size={52} color="rgba(255,255,255,0.18)" />
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12, marginBottom: 24 }}>
                    Add a photo for your story
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => pickImage(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 }}
                    >
                      <Ionicons name="camera-outline" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14 }}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 }}
                    >
                      <Ionicons name="image-outline" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 14 }}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {statusData && statusData.can_post === false ? (
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,180,120,0.95)', fontSize: 14, paddingHorizontal: 24, paddingTop: 16 }}>
                You already shared a story today. Come back tomorrow.
              </Text>
            ) : null}
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 13, paddingHorizontal: 24, paddingTop: 20, lineHeight: 20 }}>
              Stories disappear after 24 hours. You can post one story per day.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
