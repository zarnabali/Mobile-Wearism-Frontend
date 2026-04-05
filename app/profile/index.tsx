import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, Image, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BottomNav from '../components/BottomNav';
import Settings from '../settings';
import { useVendor } from '../contexts/VendorContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import * as ImagePicker from 'expo-image-picker';
import { Skeleton } from '../../src/components/Skeleton';
import { useAuthStore } from '../../src/stores/authStore';

const ProfileScreen = () => {
  const params = useLocalSearchParams<{ id?: string }>();
  const currentUserId = useAuthStore(s => s.user?.id);
  const paramId = params.id != null ? String(Array.isArray(params.id) ? params.id[0] : params.id) : undefined;
  const shouldRedirectToPublic = Boolean(paramId && currentUserId && paramId !== currentUserId);

  useEffect(() => {
    if (shouldRedirectToPublic && paramId) {
      router.replace(`/profile/${paramId}` as any);
    }
  }, [shouldRedirectToPublic, paramId]);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const queryClient = useQueryClient();
  const { vendorData } = useVendor();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/user/profile').then(r => r.data),
  });

  const profile = data?.profile;
  const completionScore = data?.completion_score ?? 0;
  const postsLoading = isLoading || !profile;
  const myPosts: { id: string; image_url: string }[] = profile?.recent_posts ?? [];

  const pickAndUploadAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const form = new FormData();
    const mimeType = asset.mimeType || (asset as any).type || 'image/jpeg';
    const filename = asset.fileName || asset.uri.split('/').pop() || 'avatar.jpg';
    form.append('file', {
      uri: asset.uri,
      name: filename,
      type: mimeType,
    } as any);

    try {
      // IMPORTANT: Do not set Content-Type manually; axios needs to add the multipart boundary.
      await apiClient.post('/user/profile/avatar', form);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    } catch (err) {
      Alert.alert(
        'Upload Failed',
        (err as any)?.response?.data?.error || 'Could not upload your photo.'
      );
    }
  };

  const handleSettingsPress = () => {
    setSettingsVisible(true);
  };

  if (shouldRedirectToPublic) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          bounces
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor="#FF6B35" colors={['#FF6B35']} />
          }
        >
          {/* Header Image */}
          <View className="h-[380px] w-full relative">
            <ImageBackground
              source={require('../../assets/pictures/wardrobe2.jpeg')}
              style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
              imageStyle={{ opacity: 0.95 }}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
                style={{ height: '100%', width: '100%', position: 'absolute' }}
              />

              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <View className="flex-row justify-between items-center px-5 py-2">
                  <TouchableOpacity className="bg-black/20 p-2 rounded-full backdrop-blur-md">
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSettingsPress} className="bg-black/20 p-2 rounded-full backdrop-blur-md">
                    <Ionicons name="settings-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              <View className="px-5 pb-6">
                <View className="flex-row items-end justify-between">
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={pickAndUploadAvatar} className="relative">
                      {profile?.avatar_url ? (
                        <Image
                          source={{ uri: profile.avatar_url }}
                          style={{ width: 80, height: 80, borderRadius: 24, borderWidth: 2, borderColor: '#FF6B35' }}
                        />
                      ) : (
                        <View
                          style={{ width: 80, height: 80, borderRadius: 24, borderWidth: 2, borderColor: '#FF6B35', backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Ionicons name="person" size={40} color="rgba(255,255,255,0.3)" />
                        </View>
                      )}
                      <View
                        className="absolute -bottom-1 -right-1 bg-black/60 p-1.5 rounded-lg border border-white/20"
                      >
                        <Ionicons name="camera" color="#FF6B35" size={14} />
                      </View>
                    </TouchableOpacity>
                    <View className="ml-4 mb-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                          {profile?.full_name ?? 'Your Name'}
                        </Text>
                        {vendorData.isVendor && (
                          <View className="bg-[#FF6B35] px-2 py-1 rounded-lg">
                            <Text className="text-white text-xs font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                              VENDOR
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white/70 text-base" style={{ fontFamily: 'HelveticaNeue' }}>
                        {profile?.email ?? ''}
                      </Text>

                      {/* Completion bar */}
                      <View className="w-48 mt-2">
                        <View className="w-full bg-white/10 rounded-full h-1">
                          <View
                            className="bg-[#FF6B35] h-1 rounded-full"
                            style={{ width: `${completionScore}%` }}
                          />
                        </View>
                        <Text className="text-white/40 text-[10px] mt-1" style={{ fontFamily: 'HelveticaNeue' }}>
                          {completionScore}% complete
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View className="flex-row mt-6 justify-between bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <View className="items-center flex-1 border-r border-white/10">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {profile?.followers_count ?? 0}
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Followers
                    </Text>
                  </View>
                  <View className="items-center flex-1 border-r border-white/10">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {profile?.following_count ?? 0}
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Following
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {profile?.posts_count ?? 0}
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Posts
                    </Text>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>

          <View className="px-5 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-medium" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                Recent posts
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => router.push('/social/create-post' as any)}
                  className="p-1"
                >
                  <Ionicons name="add-circle" size={22} color="#FF6B35" />
                </TouchableOpacity>
                <Ionicons name="grid-outline" size={20} color="rgba(255,255,255,0.5)" />
              </View>
            </View>
            {postsLoading ? (
              <View className="flex-row flex-wrap -mx-1">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <View key={i} className="w-1/3 px-1 mb-2">
                      <Skeleton className="w-full aspect-square rounded-2xl" />
                    </View>
                  ))}
              </View>
            ) : myPosts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14 }}>
                  No posts yet
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap -mx-1">
                {myPosts.map((post) => (
                  <View key={post.id} className="w-1/3 px-1 mb-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="rounded-2xl overflow-hidden"
                      onPress={() => router.push(`/social/post-detail?id=${post.id}` as any)}
                    >
                      <Image
                        source={{ uri: post.image_url }}
                        style={{ width: '100%', aspectRatio: 1 }}
                        className="border border-white/10"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <BottomNav active="profile" />
        <Settings visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      </LinearGradient>
    </View>
  );
};

export default ProfileScreen;


