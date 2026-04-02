import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import StoriesStrip from './components/StoriesStrip';
import StoryViewer from './components/StoryViewer';
import BottomNav from './components/BottomNav';
import VendorAdCard from './components/VendorAdCard';
import { LikeButton } from '../src/components/LikeButton';
import { FollowButton } from '../src/components/FollowButton';
import { Skeleton } from '../src/components/Skeleton';
import { ReportModal } from '../src/components/ReportModal';
import { useAuthStore } from '../src/stores/authStore';
import { apiClient } from '../src/lib/apiClient';

// ─── Hardcoded stories (Phase 5 will wire to Stories API) ─────────────────
const STORIES = [
  { id: 's1', name: 'Ava', img: require('../assets/pictures/social.jpeg') },
  { id: 's2', name: 'Mia', img: require('../assets/pictures/social2.jpeg') },
  { id: 's3', name: 'Leo', img: require('../assets/pictures/social3.jpeg') },
  { id: 's4', name: 'Kai', img: require('../assets/pictures/social4.jpeg') },
  { id: 's5', name: 'Zoe', img: require('../assets/pictures/wardrobe.jpeg') },
];

// Hardcoded vendor ads — Phase 6 will fetch from /ads
const VENDOR_ADS = [
  {
    id: 'ad1',
    brandName: 'UrbanStyle Co.',
    productName: 'Premium Denim Jacket',
    productImage: require('../assets/pictures/shop.jpeg'),
    price: '$129.99',
    isVerified: true,
  },
  {
    id: 'ad2',
    brandName: 'Sneaker Haven',
    productName: 'Classic White Sneakers',
    productImage: require('../assets/pictures/shop2.jpeg'),
    price: '$89.00',
    isVerified: true,
  },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Post card ─────────────────────────────────────────────────────────────
function PostCard({ post, feedType, currentUserId, onPress, onUserPress }: {
  post: any;
  feedType: 'home' | 'trending';
  currentUserId?: string;
  onPress: () => void;
  onUserPress: () => void;
}) {
  const [reportVisible, setReportVisible] = useState(false);
  const author = post.profiles ?? post.user ?? {};
  return (
    <View style={{ marginBottom: 24 }}>
      {/* Author row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={onUserPress} activeOpacity={0.8}>
          <LinearGradient colors={['#FF6B35', '#3C0008']} style={{ width: 38, height: 38, borderRadius: 19, padding: 2 }}>
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 17 }} />
            ) : (
              <View style={{ width: '100%', height: '100%', borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={18} color="white" />
              </View>
            )}
          </LinearGradient>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 15 }}>
              {author.username ?? author.full_name ?? 'User'}
            </Text>
            {post.location && (
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {post.location}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {author.id && author.id !== currentUserId && (
            <FollowButton userId={author.id} />
          )}
          <TouchableOpacity onPress={() => setReportVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.97}>
        {post.image_url ? (
          <Image
            source={{ uri: post.image_url }}
            style={{ width: '100%', height: 420, backgroundColor: 'rgba(255,255,255,0.05)' }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: 120, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.2)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <LikeButton post={post} feedType={feedType} size={26} showCount />
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chatbubble-outline" size={24} color="rgba(255,255,255,0.7)" />
              {post.comments_count > 0 && (
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.6)', fontSize: 13, marginLeft: 6 }}>
                  {post.comments_count}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="paper-plane-outline" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {post.caption ? (
          <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 4 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold' }}>
              {author.username ?? author.full_name ?? 'User'}{' '}
            </Text>
            {post.caption}
          </Text>
        ) : null}

        {/* Comments link */}
        {post.comments_count > 0 && (
          <TouchableOpacity onPress={onPress} style={{ marginBottom: 4 }}>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
              View all {post.comments_count} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
          {post.created_at ? timeAgo(post.created_at) : ''}
        </Text>
      </View>

      <ReportModal postId={post.id} visible={reportVisible} onClose={() => setReportVisible(false)} />
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const router = useRouter();
  const currentUserId = useAuthStore(s => s.user?.id);

  const [feedType, setFeedType] = useState<'home' | 'trending'>('home');
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['feed', feedType],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get(`/feed/${feedType}?page=${pageParam}&limit=20`).then(r => r.data),
    getNextPageParam: (last: any) =>
      last.pagination?.has_next ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const rawPosts: any[] = data?.pages.flatMap((p: any) => p.posts ?? []) ?? [];

  // Inject vendor ads every 7 posts
  const feedItems: any[] = [];
  let adIdx = 0;
  rawPosts.forEach((post, i) => {
    feedItems.push({ type: 'post', data: post, key: `post-${post.id}` });
    if ((i + 1) % 7 === 0) {
      feedItems.push({ type: 'ad', data: VENDOR_ADS[adIdx % VENDOR_ADS.length], key: `ad-${i}` });
      adIdx++;
    }
  });

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'ad') {
      return <VendorAdCard ad={item.data} />;
    }
    const post = item.data;
    const author = post.profiles ?? post.user ?? {};
    return (
      <PostCard
        post={post}
        feedType={feedType}
        currentUserId={currentUserId}
        onPress={() => router.push(`/social/post-detail?id=${post.id}` as any)}
        onUserPress={() => router.push(`/profile?id=${author.id}` as any)}
      />
    );
  }, [feedType, currentUserId, router]);

  const ListHeader = (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 30 }}>Wearism</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={() => router.push('/social/create-post' as any)}>
            <Ionicons name="add-circle-outline" size={28} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={26} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories strip */}
      <StoriesStrip
        stories={STORIES.map((s, idx) => ({
          ...s,
          onPress: () => { setSelectedStoryIndex(idx); setStoryViewerVisible(true); },
        }))}
        onAddStory={() => router.push('/social/create-post' as any)}
      />

      {/* Feed type toggle */}
      <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 999, padding: 4 }}>
        {(['home', 'trending'] as const).map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setFeedType(type)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center',
              backgroundColor: feedType === type ? '#FF6B35' : 'transparent',
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              fontFamily: feedType === type ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Medium',
              color: feedType === type ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
            }}>
              {type === 'home' ? 'For You' : 'Trending'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {isLoading ? (
            <>
              {ListHeader}
              <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 16 }}>
                {Array(3).fill(0).map((_, i) => (
                  <View key={i} style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <View style={{ gap: 6, flex: 1 }}>
                        <Skeleton className="w-32 h-3" />
                        <Skeleton className="w-20 h-2.5" />
                      </View>
                    </View>
                    <Skeleton className="w-full" style={{ aspectRatio: 1 }} />
                    <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 4 }}>
                      <Skeleton className="w-16 h-3" />
                      <Skeleton className="w-16 h-3" />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <FlatList
              data={feedItems}
              keyExtractor={(item) => item.key}
              renderItem={renderItem}
              ListHeaderComponent={ListHeader}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF6B35" />
              }
              ListFooterComponent={
                isFetchingNextPage
                  ? <ActivityIndicator color="#FF6B35" style={{ marginVertical: 20 }} />
                  : null
              }
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 }}>
                  <Ionicons name="shirt-outline" size={48} color="rgba(255,255,255,0.15)" />
                  <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
                    Your feed is empty
                  </Text>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.25)', fontSize: 14, marginTop: 6, textAlign: 'center' }}>
                    Follow people or share your first post
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/social/create-post' as any)}
                    style={{ marginTop: 24, backgroundColor: '#FF6B35', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 }}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 15 }}>Create a post</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </SafeAreaView>

        <BottomNav active="feed" />

        <StoryViewer
          stories={STORIES}
          initialIndex={selectedStoryIndex}
          visible={storyViewerVisible}
          onClose={() => setStoryViewerVisible(false)}
        />
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;
