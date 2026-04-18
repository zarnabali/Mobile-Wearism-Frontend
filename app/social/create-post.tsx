import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView, Modal, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

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
      {loading ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => router.back()} disabled={loading} style={{ padding: 4 }}>
              <Ionicons name="close-outline" size={30} color="white" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image 
                source={require('../../assets/logo/wearism-short-w.png')} 
                style={{ width: 22, height: 22 }} 
                resizeMode="contain" 
              />
              <Text className="text-white text-[17px] font-h-bold">New Post</Text>
            </View>
            <TouchableOpacity onPress={handlePost} disabled={loading || !imageUri} style={{ padding: 4 }}>
              {loading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text 
                  style={{ color: !imageUri ? 'rgba(255,107,53,0.3)' : COLORS.primary, fontSize: 16 }} 
                  className="font-h-bold"
                >
                  Share
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
          >
            <ScrollView 
              style={{ flex: 1 }} 
              showsVerticalScrollIndicator={false} 
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
            {/* Image area */}
            <View style={{ width: '100%', aspectRatio: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {!loading && (
                      <TouchableOpacity
                        onPress={() => pickImage(false)}
                        className="absolute bottom-4 right-4 bg-black/60 rounded-full px-4 py-2 flex-row items-center border border-white/20"
                        activeOpacity={0.8}
                      >
                        <Ionicons name="images-outline" size={16} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white text-[12px] font-h-medium">Replace</Text>
                      </TouchableOpacity>
                  )}
                </>
              ) : (
                <View className="items-center px-10">
                  <View className="w-20 h-20 rounded-full bg-white/2 items-center justify-center border border-white/5 mb-6">
                    <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.3)" />
                  </View>
                  <Text className="text-white/40 text-[15px] font-h-light text-center mb-10 leading-6">
                    Select a photo of your outfit to share with the community
                  </Text>
                  <View className="flex-row gap-4">
                    <TouchableOpacity
                      onPress={() => pickImage(true)}
                      className="flex-row items-center bg-white/10 border border-white/10 rounded-2xl px-6 py-4"
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera" size={20} color="white" style={{ marginRight: 12 }} />
                      <Text className="text-white text-[15px] font-h-medium">Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickImage(false)}
                      className="flex-row items-center bg-primary rounded-2xl px-6 py-4 shadow-lg shadow-orange-500/20"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images" size={20} color="white" style={{ marginRight: 12 }} />
                      <Text className="text-white text-[15px] font-h-medium">Library</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View className="px-5 pt-8 pb-12">
              {/* Caption */}
              <View className="bg-white/5 rounded-2xl border border-white/10 p-4 mb-2">
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Tell us about your style..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  multiline
                  maxLength={500}
                  className="text-white text-[16px] font-h-light min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
              <Text className="text-white/20 text-[11px] font-h-light text-right mb-8">
                {caption.length}/500
              </Text>

              {/* Outfit tag */}
              <Text className="text-white/40 text-[11px] font-h-bold uppercase tracking-[2px] mb-3 ml-1">
                Outfit Tag
              </Text>
              <TouchableOpacity
                onPress={() => setOutfitPickerOpen(true)}
                className={`flex-row items-center p-4 rounded-2xl mb-8 border ${
                  selectedOutfit 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-white/5 border-white/10'
                }`}
                activeOpacity={0.7}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                  selectedOutfit ? 'bg-primary/20' : 'bg-white/5'
                }`}>
                  <Ionicons
                    name="shirt-outline"
                    size={20}
                    color={selectedOutfit ? COLORS.primary : 'rgba(255,255,255,0.3)'}
                  />
                </View>
                <View className="flex-1">
                  <Text className={`text-[15px] ${selectedOutfit ? 'text-primary font-h-medium' : 'text-white/40 font-h-light'}`}>
                    {selectedOutfit ? selectedOutfit.name || 'Untitled Outfit' : 'Tag an outfit from wardrobe'}
                  </Text>
                  {selectedOutfit && (
                    <Text className="text-primary/60 text-[11px] font-h-light mt-0.5">
                      Successfully tagged
                    </Text>
                  )}
                </View>
                {selectedOutfit ? (
                  <TouchableOpacity onPress={() => setSelectedOutfit(null)} className="p-2">
                    <Ionicons name="close-circle" size={22} color={COLORS.primary} className="opacity-60" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                )}
              </TouchableOpacity>

              {/* Season */}
              <Text className="text-white/40 text-[11px] font-h-bold uppercase tracking-[2px] mb-4 ml-1">
                Select Season
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={{ marginHorizontal: -20, marginBottom: 40 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {SEASONS.map(s => {
                  const isActive = season === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSeason(s)}
                      activeOpacity={0.7}
                      style={{
                        marginRight: 12,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 16,
                        borderWidth: 1,
                        backgroundColor: isActive ? COLORS.primary : 'rgba(255,255,255,0.05)',
                        borderColor: isActive ? COLORS.primary : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Text style={{ 
                        fontSize: 14, 
                        textTransform: 'capitalize',
                        fontFamily: isActive ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Light',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.6)'
                      }}>
                        {s.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Visibility */}
              <Text className="text-white/40 text-[11px] font-h-bold uppercase tracking-[2px] mb-4 ml-1">
                Who can see this?
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {VISIBILITY_OPTIONS.map(v => {
                  const isVActive = visibility === v.value;
                  return (
                    <TouchableOpacity
                      key={v.value}
                      onPress={() => setVisibility(v.value)}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingVertical: 16,
                        borderRadius: 16,
                        borderWidth: 1,
                        backgroundColor: isVActive ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                        borderColor: isVActive ? COLORS.primary : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <Ionicons 
                        name={v.icon as any} 
                        size={16} 
                        color={isVActive ? COLORS.primary : 'rgba(255,255,255,0.3)'} 
                        style={{ marginRight: 8 }} 
                      />
                      <Text style={{ 
                        fontSize: 13, 
                        fontFamily: isVActive ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Light',
                        color: isVActive ? COLORS.primary : 'rgba(255,255,255,0.4)'
                      }}>
                        {v.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
      )}
      <OutfitPickerModal
        visible={outfitPickerOpen}
        onSelect={setSelectedOutfit}
        onClose={() => setOutfitPickerOpen(false)}
      />
    </View>
  );
}
