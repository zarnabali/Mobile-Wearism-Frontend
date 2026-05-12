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
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

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

  // Fetch Access Status
  const { data: accessData } = useQuery({
    queryKey: ['wardrobe-access', id],
    queryFn: () => apiClient.get('/social/swaps/access-requests').then(r => r.data),
    enabled: !!id
  });

  const profile = data?.profile;
  const accessRequest = accessData?.data?.find((r: any) => 
    (r.requester_id === currentUserId && r.owner_id === id) || 
    (r.requester_id === id && r.owner_id === currentUserId)
  );
  
  const hasAccess = accessRequest?.status === 'accepted';
  const isPending = accessRequest?.status === 'pending';

  const [activeTab, setActiveTab] = React.useState<'posts' | 'wardrobe'>('posts');

  // Fetch Shared Wardrobe (only if access is accepted)
  const { data: wardrobeData, isLoading: wardrobeLoading } = useQuery({
    queryKey: ['shared-wardrobe', id],
    queryFn: () => apiClient.get(`/social/swaps/shared-wardrobe/${id}`).then(r => r.data),
    enabled: !!id && hasAccess
  });

  const sharedItems = wardrobeData?.data || [];
  const posts: { id: string; image_url: string | null }[] = profile?.recent_posts ?? [];

  if (isLoading) {
    return <ModeSwitchOverlay />;
  }

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)' }}>Invalid profile</Text>
      </View>
    );
  }

  if (!currentUserId) {
    return <ModeSwitchOverlay />;
  }

  if (id && currentUserId && id === currentUserId) {
    return <ModeSwitchOverlay />;
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
                <View className="flex-row items-center">
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
                  <View className="ml-4 flex-1">
                    <Text className="text-white text-3xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {isLoading ? '…' : profile?.full_name ?? 'User'}
                    </Text>
                    
                    <View className="flex-row items-center gap-3 mt-3">
                      {!isLoading && id ? <FollowButton userId={id} /> : null}
                      <TouchableOpacity 
                        onPress={() => {
                          if (hasAccess) {
                            setActiveTab('wardrobe');
                          } else if (!isPending) {
                            router.push(`/social/requests?targetUserId=${id}` as any);
                          }
                        }}
                        disabled={isPending}
                        className={`px-4 py-2 rounded-xl border backdrop-blur-md flex-row items-center gap-2 ${
                          hasAccess ? 'bg-green-500/10 border-green-500/30' : 
                          isPending ? 'bg-white/5 border-white/10 opacity-50' : 
                          'bg-[#FF6B35]/20 border-[#FF6B35]/30'
                        }`}
                      >
                        <Ionicons 
                          name={hasAccess ? "repeat" : isPending ? "time-outline" : "lock-open-outline"} 
                          size={16} 
                          color={hasAccess ? "#4ADE80" : "#FF6B35"} 
                        />
                        <Text 
                          className="text-white text-xs font-bold" 
                          style={{ fontFamily: 'HelveticaNeue-Bold', color: hasAccess ? "#4ADE80" : "white" }}
                        >
                          {hasAccess ? "Swap" : isPending ? "Pending" : "Access"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View className="flex-row mt-6 justify-between bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                  <TouchableOpacity
                    className="items-center flex-1 border-r border-white/10"
                    activeOpacity={0.8}
                    onPress={() => router.push(`/social/follows?userId=${encodeURIComponent(id)}&type=followers` as any)}
                  >
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {profile?.followers_count ?? 0}
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Followers
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="items-center flex-1 border-r border-white/10"
                    activeOpacity={0.8}
                    onPress={() => router.push(`/social/follows?userId=${encodeURIComponent(id)}&type=following` as any)}
                  >
                    <Text className="text-white text-xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                      {profile?.following_count ?? 0}
                    </Text>
                    <Text className="text-white/60 text-xs uppercase tracking-wider mt-1" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                      Following
                    </Text>
                  </TouchableOpacity>
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
            {/* Tab Selector */}
            <View className="flex-row items-center justify-between mb-6 bg-white/5 p-1 rounded-2xl border border-white/10">
              <TouchableOpacity 
                onPress={() => setActiveTab('posts')}
                className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'posts' ? 'bg-[#FF6B35]' : ''}`}
              >
                <Text className={`font-bold ${activeTab === 'posts' ? 'text-white' : 'text-white/40'}`}>Posts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setActiveTab('wardrobe')}
                className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'wardrobe' ? 'bg-[#FF6B35]' : ''}`}
              >
                <View className="flex-row items-center gap-2">
                  {!hasAccess && <Ionicons name="lock-closed" size={12} color="rgba(255,255,255,0.2)" />}
                  <Text className={`font-bold ${activeTab === 'wardrobe' ? 'text-white' : 'text-white/40'}`}>Wardrobe</Text>
                </View>
              </TouchableOpacity>
            </View>

            {activeTab === 'posts' ? (
              <View>
                {isLoading ? (
                  <View className="flex-row flex-wrap -mx-1">
                    {Array(6).fill(0).map((_, i) => (
                      <View key={i} className="w-1/3 px-1 mb-2"><Skeleton className="w-full aspect-square rounded-2xl" /></View>
                    ))}
                  </View>
                ) : posts.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="images-outline" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14 }}>No public posts yet</Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap -mx-1">
                    {posts.map((post) => (
                      <View key={post.id} className="w-1/3 px-1 mb-2">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          className="rounded-2xl overflow-hidden"
                          onPress={() => router.push(`/social/post-detail?id=${post.id}&fromProfileId=${encodeURIComponent(id)}` as any)}
                        >
                          <Image source={{ uri: post.image_url ?? '' }} style={{ width: '100%', aspectRatio: 1 }} className="border border-white/10" resizeMode="cover" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View>
                {!hasAccess ? (
                  <View className="items-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Ionicons name="lock-closed-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text className="text-white/40 mt-4 text-center px-10" style={{ fontFamily: 'HelveticaNeue' }}>
                      Wardrobe is private. Request access to see items and propose swaps.
                    </Text>
                    {!isPending && (
                      <TouchableOpacity 
                        onPress={() => router.push(`/social/requests?targetUserId=${id}` as any)}
                        className="mt-6 bg-[#FF6B35]/20 px-6 py-2 rounded-xl border border-[#FF6B35]/30"
                      >
                        <Text className="text-[#FF6B35] font-bold">Request Access</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : wardrobeLoading ? (
                  <ActivityIndicator color="#FF6B35" className="py-20" />
                ) : sharedItems.length === 0 ? (
                  <View className="items-center py-20">
                    <Ionicons name="shirt-outline" size={48} color="rgba(255,255,255,0.1)" />
                    <Text className="text-white/40 mt-4">No swappable items found</Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap -mx-1">
                    {sharedItems.map((item: any) => (
                      <View key={item.id} className="w-1/3 px-1 mb-2">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          className="rounded-2xl overflow-hidden relative"
                          onPress={() => router.push(`/social/swap-propose?targetUserId=${id}&targetItemId=${item.id}` as any)}
                        >
                          <Image source={{ uri: item.image_url }} style={{ width: '100%', aspectRatio: 1 }} className="border border-white/10" resizeMode="cover" />
                          <View className="absolute bottom-1 right-1 bg-black/60 p-1 rounded-lg">
                            <Ionicons name="repeat" size={12} color="#FF6B35" />
                          </View>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        <BottomNav active="profile" />
      </LinearGradient>
    </View>
  );
}
