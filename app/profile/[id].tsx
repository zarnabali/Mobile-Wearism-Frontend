import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import BottomNav from '../components/BottomNav';
import { apiClient } from '../../src/lib/apiClient';
import { Skeleton } from '../../src/components/Skeleton';
import { FollowButton } from '../../src/components/FollowButton';
import { useAuthStore } from '../../src/stores/authStore';

export default function PublicProfileScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = rawId != null ? String(Array.isArray(rawId) ? rawId[0] : rawId) : '';
  const currentUserId = useAuthStore(s => s.user?.id);

  useEffect(() => {
    if (id && currentUserId && id === currentUserId) {
      router.replace('/profile' as any);
    }
  }, [id, currentUserId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: () => apiClient.get(`/users/${id}/profile`).then(r => r.data),
    enabled: Boolean(id) && Boolean(currentUserId) && id !== currentUserId,
  });

  const profile = data?.profile;
  const posts: { id: string; image_url: string | null }[] = profile?.recent_posts ?? [];

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)' }}>Invalid profile</Text>
      </View>
    );
  }

  if (!currentUserId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (id && currentUserId && id === currentUserId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (isError || (!isLoading && !profile)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.2)" />
        <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', marginTop: 16, textAlign: 'center' }}>
          User not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#FF6B35', borderRadius: 999 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false} bounces={false}>
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
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-black/20 p-2 rounded-full backdrop-blur-md"
                  >
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <View className="w-10" />
                </View>
              </SafeAreaView>

              <View className="px-5 pb-6">
                <View className="flex-row items-end justify-between">
                  <View className="flex-row items-center flex-1">
                    {isLoading ? (
                      <Skeleton className="w-20 h-20 rounded-3xl" />
                    ) : profile?.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        style={{ width: 80, height: 80, borderRadius: 24, borderWidth: 2, borderColor: '#FF6B35' }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 24,
                          borderWidth: 2,
                          borderColor: '#FF6B35',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="person" size={40} color="rgba(255,255,255,0.3)" />
                      </View>
                    )}
                    <View className="ml-4 mb-1 flex-1">
                      <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                        {isLoading ? '…' : profile?.full_name ?? 'User'}
                      </Text>
                    </View>
                  </View>
                  {!isLoading && id ? <FollowButton userId={id} /> : null}
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
              <Ionicons name="grid-outline" size={20} color="rgba(255,255,255,0.5)" />
            </View>
            {isLoading ? (
              <View className="flex-row flex-wrap -mx-1">
                {Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <View key={i} className="w-1/3 px-1 mb-2">
                      <Skeleton className="w-full aspect-square rounded-2xl" />
                    </View>
                  ))}
              </View>
            ) : posts.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14 }}>
                  No public posts yet
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap -mx-1">
                {posts.map((post) => (
                  <View key={post.id} className="w-1/3 px-1 mb-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      className="rounded-2xl overflow-hidden"
                      onPress={() =>
                        router.push(`/social/post-detail?id=${post.id}&fromProfileId=${encodeURIComponent(id)}` as any)
                      }
                    >
                      {post.image_url ? (
                        <Image
                          source={{ uri: post.image_url }}
                          style={{ width: '100%', aspectRatio: 1 }}
                          className="border border-white/10"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            aspectRatio: 1,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          className="border border-white/10 rounded-2xl"
                        >
                          <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.2)" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
        <BottomNav active="profile" />
      </LinearGradient>
    </View>
  );
}
