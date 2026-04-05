import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView, Modal, FlatList,
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

const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all_season'];
const VISIBILITY_OPTIONS = [
  { value: 'public',        label: 'Public',    icon: 'globe-outline' },
  { value: 'followers_only', label: 'Followers', icon: 'people-outline' },
  { value: 'private',       label: 'Private',   icon: 'lock-closed-outline' },
];

// ─── Outfit picker modal ─────────────────────────────────────────────────
function OutfitPickerModal({ visible, onSelect, onClose }: {
  visible: boolean;
  onSelect: (outfit: any) => void;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['outfits'],
    queryFn: () => apiClient.get('/wardrobe/outfits?limit=50').then(r => r.data),
    enabled: visible,
  });
  const outfits: any[] = data?.outfits ?? data?.data ?? [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={{ maxHeight: '70%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(30,0,4,0.99)', 'rgba(10,0,2,0.99)']} style={{ flex: 1 }}>
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
              {/* Modal header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>Tag an Outfit</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={26} color="white" />
                </TouchableOpacity>
              </View>

              {isLoading ? (
                <ActivityIndicator color="#FF6B35" style={{ marginTop: 40 }} />
              ) : outfits.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 40 }}>
                  <Ionicons name="shirt-outline" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
                    No outfits yet. Create one first.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={outfits}
                  keyExtractor={o => o.id}
                  numColumns={2}
                  columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
                  contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => { onSelect(item); onClose(); }}
                      activeOpacity={0.85}
                      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
                    >
                      {/* Mini item thumbnails */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 10 }}>
                        {(item.items ?? []).slice(0, 4).map((wi: any, idx: number) => (
                          <View key={idx} style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <Image source={{ uri: wi.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          </View>
                        ))}
                        {(item.items ?? []).length === 0 && (
                          <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="shirt-outline" size={20} color="rgba(255,255,255,0.3)" />
                          </View>
                        )}
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingBottom: 12 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 13 }} numberOfLines={1}>
                          {item.name || 'Untitled'}
                        </Text>
                        {item.occasion && (
                          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2, textTransform: 'capitalize' }}>
                            {item.occasion.replace(/_/g, ' ')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </SafeAreaView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────
export default function CreatePostScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore(s => s.user?.id) ?? 'unknown';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [season, setSeason] = useState(SEASONS[4]);
  const [visibility, setVisibility] = useState(VISIBILITY_OPTIONS[0].value);
  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [outfitPickerOpen, setOutfitPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async (useCamera = false) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    };
    let result;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Camera access denied');
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handlePost = async () => {
    if (!imageUri && !caption.trim()) {
      return Alert.alert('Empty Post', 'Add a photo or caption to post.');
    }
    setLoading(true);
    try {
      const postId = uuidv4();
      const filename = `${postId}.jpg`;
      const imagePath = `${userId}/${filename}`;

      const form = new FormData();
      form.append('post_id', postId);
      form.append('image_path', imagePath);
      if (caption) form.append('caption', caption);
      if (season) form.append('season', season);
      if (visibility) form.append('visibility', visibility);
      if (selectedOutfit?.id) form.append('outfit_id', selectedOutfit.id);

      form.append('file', { uri: imageUri, name: filename, type: 'image/jpeg' } as any);

      await apiClient.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });

      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['user-posts', userId] });
      router.back();
    } catch (err: any) {
      Alert.alert('Post Failed', err.response?.data?.error ?? 'Could not create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 56, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 17 }}>New Post</Text>
            <TouchableOpacity onPress={handlePost} disabled={loading || !imageUri}>
              {loading ? (
                <ActivityIndicator color="#FF6B35" size="small" />
              ) : (
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: !imageUri ? 'rgba(255,107,53,0.4)' : '#FF6B35', fontSize: 16 }}>
                  Post
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Image area */}
            <View style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
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
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="images-outline" size={52} color="rgba(255,255,255,0.18)" />
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12, marginBottom: 24 }}>
                    Add a photo
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

            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>
              {/* Caption */}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', padding: 14, marginBottom: 6 }}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Write a caption..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  maxLength={500}
                  style={{ fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 15, minHeight: 72, textAlignVertical: 'top' }}
                />
              </View>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'right', marginBottom: 24 }}>
                {caption.length}/500
              </Text>

              {/* Outfit tag */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                Outfit Tag
              </Text>
              <TouchableOpacity
                onPress={() => setOutfitPickerOpen(true)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: selectedOutfit ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: selectedOutfit ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.12)',
                  borderRadius: 16, padding: 14, marginBottom: 24,
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={selectedOutfit ? 'shirt' : 'shirt-outline'}
                  size={20}
                  color={selectedOutfit ? '#FF6B35' : 'rgba(255,255,255,0.4)'}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: selectedOutfit ? '#FF6B35' : 'rgba(255,255,255,0.45)', fontSize: 15, flex: 1 }}>
                  {selectedOutfit ? selectedOutfit.name || 'Untitled Outfit' : 'Tag an outfit (optional)'}
                </Text>
                {selectedOutfit ? (
                  <TouchableOpacity onPress={() => setSelectedOutfit(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={20} color="rgba(255,107,53,0.6)" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                )}
              </TouchableOpacity>

              {/* Season */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                Season
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 24 }}>
                {SEASONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSeason(s)}
                    style={{
                      marginRight: 8, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, borderWidth: 1,
                      backgroundColor: season === s ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                      borderColor: season === s ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: season === s ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                      {s.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Visibility */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                Visibility
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {VISIBILITY_OPTIONS.map(v => (
                  <TouchableOpacity
                    key={v.value}
                    onPress={() => setVisibility(v.value)}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      paddingVertical: 10, borderRadius: 999, borderWidth: 1,
                      backgroundColor: visibility === v.value ? '#FF6B35' : 'rgba(255,255,255,0.06)',
                      borderColor: visibility === v.value ? '#FF6B35' : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Ionicons name={v.icon as any} size={14} color={visibility === v.value ? '#fff' : 'rgba(255,255,255,0.5)'} style={{ marginRight: 5 }} />
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: visibility === v.value ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      <OutfitPickerModal
        visible={outfitPickerOpen}
        onSelect={setSelectedOutfit}
        onClose={() => setOutfitPickerOpen(false)}
      />
    </View>
  );
}
