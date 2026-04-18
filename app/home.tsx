import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../src/constants/theme';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import StoriesStrip from './components/StoriesStrip';
import StoryViewer from './components/StoryViewer';
import BottomNav from './components/BottomNav';
import VendorAdCard from './components/VendorAdCard';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { HeartAnimation } from '../src/components/HeartAnimation';
import { useLikeMutation } from '../src/hooks/useLikeMutation';
import { LikeButton } from '../src/components/LikeButton';
import { FollowButton } from '../src/components/FollowButton';
import { Skeleton } from '../src/components/Skeleton';
import { ReportModal } from '../src/components/ReportModal';
import { useAuthStore } from '../src/stores/authStore';
import { apiClient } from '../src/lib/apiClient';
import ModeSwitchOverlay from './components/ModeSwitchOverlay';

/** Survives Home unmount when opening campaign/post detail so back restores scroll. */
const feedScrollByType: Record<'home' | 'trending', number> = { home: 0, trending: 0 };

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
// ─── Post card ─────────────────────────────────────────────────────────────
function PostCard({ post, feedType, currentUserId, onUserPress }: {
  post: any;
  feedType: 'home' | 'trending';
  currentUserId?: string;
  onUserPress: () => void;
}) {
  const router = useRouter();
  const [reportVisible, setReportVisible] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const author = post.profiles ?? post.user ?? {};
  
  const likeMutation = useLikeMutation(post, feedType);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      runOnJS(setShowHeart)(true);
      if (!post.viewer_has_liked) {
        likeMutation.mutate();
      }
    });

  return (
    <View style={{ marginBottom: 32, backgroundColor: 'transparent' }}>
      {/* Author row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 12 }}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }} onPress={onUserPress} activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.primary, '#3C0008']} style={{ width: 34, height: 34, borderRadius: 17, padding: 2 }}>
            {author.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 15 }} />
            ) : (
              <View style={{ width: '100%', height: '100%', borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="person" size={16} color="white" />
              </View>
            )}
          </LinearGradient>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: '#fff', fontSize: 14 }} className="font-h-bold">
              {author.username ?? author.full_name ?? 'User'}
            </Text>
            {post.location && (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }} className="font-h-light">
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
            <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image with Double Tap */}
      <GestureDetector gesture={doubleTap}>
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#111', overflow: 'hidden', position: 'relative' }}>
          {post.image_url ? (
            <Image
              source={{ uri: post.image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.1)" />
            </View>
          )}
          {showHeart && (
            <HeartAnimation onAnimationComplete={() => setShowHeart(false)} />
          )}
        </View>
      </GestureDetector>

      {/* Actions */}
      <View style={{ paddingHorizontal: 12, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <LikeButton post={post} feedType={feedType} size={24} showCount={false} />
            <TouchableOpacity 
              onPress={() => router.push(`/social/post-detail?id=${post.id}` as any)} 
              activeOpacity={0.7} 
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="chatbubble-outline" size={23} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Ionicons name="paper-plane-outline" size={23} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="bookmark-outline" size={23} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Likes Count */}
        {post.likes_count > 0 && (
          <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }} className="font-h-bold">
            {post.likes_count.toLocaleString()} likes
          </Text>
        )}

        {/* Caption */}
        {post.caption ? (
          <Text style={{ color: '#fff', fontSize: 14, lineHeight: 18, marginBottom: 4 }} className="font-h-light">
            <Text className="font-h-bold">
              {author.username ?? author.full_name ?? 'User'}{' '}
            </Text>
            {post.caption}
          </Text>
        ) : null}

        {/* Comments link */}
        {post.comments_count > 0 && (
          <TouchableOpacity 
            onPress={() => router.push(`/social/post-detail?id=${post.id}` as any)} 
            style={{ marginBottom: 4 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }} className="font-h-light">
              View all {post.comments_count} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2, textTransform: 'uppercase' }} className="font-h-light">
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
  const qc = useQueryClient();
  const currentUserId = useAuthStore(s => s.user?.id);

  const [feedType, setFeedType] = useState<'home' | 'trending'>('home');
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  const sessionIdRef = useRef(`feed_${Date.now()}_${Math.random().toString(16).slice(2)}`);
  const listRef = useRef<FlatList>(null);

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

  const { data: storiesPayload } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: () => apiClient.get('/stories/feed').then((r) => r.data),
    enabled: !!currentUserId,
    staleTime: 60_000,
  });

  const stripStoryItems = useMemo(() => {
    const rows = storiesPayload?.stories ?? [];
    return rows.map((s: any, idx: number) => ({
      id: s.id,
      name: s.full_name ?? 'User',
      coverUri: s.avatar_url,
      seen: false,
      onPress: () => {
        setSelectedStoryIndex(idx);
        setStoryViewerVisible(true);
      },
    }));
  }, [storiesPayload]);

  const viewerStoryItems = useMemo(() => {
    const rows = storiesPayload?.stories ?? [];
    return rows.map((s: any) => ({
      id: s.id,
      name: s.full_name ?? 'User',
      imageUri: s.image_url,
      avatarUri: s.avatar_url,
      timeLabel: s.created_at ? timeAgo(s.created_at) : '',
    }));
  }, [storiesPayload]);

  const rawPosts: any[] = data?.pages.flatMap((p: any) => p.posts ?? p.data ?? []) ?? [];

  // Load active campaigns for feed injection
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    apiClient.get('/campaigns/active?limit=6')
      .then((r) => {
        if (!mounted) return;
        setActiveCampaigns(r.data?.campaigns ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setActiveCampaigns([]);
      });
    return () => { mounted = false; };
  }, []);

  const impressed = useRef<Set<string>>(new Set());

  // Inject campaigns every 7 posts (only if any active campaigns exist)
  const feedItems: any[] = [];
  let adIdx = 0;
  rawPosts.forEach((post, i) => {
    feedItems.push({ type: 'post', data: post, key: `post-${post.id}` });
    if ((i + 1) % 7 === 0 && activeCampaigns.length > 0) {
      const campaign = activeCampaigns[adIdx % activeCampaigns.length];
      if (campaign) {
        feedItems.push({ type: 'campaign', data: campaign, key: `campaign-${campaign.id}-${i}` });
        adIdx++;
      }
    }
  });

  useFocusEffect(
    useCallback(() => {
      const y = feedScrollByType[feedType];
      if (y < 1) return;
      const id = requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: y, animated: false });
      });
      return () => cancelAnimationFrame(id);
    }, [feedType]),
  );

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'campaign') {
      const c = item.data;
      const vendorName = c.vendor_profiles?.shop_name ?? 'Brand';
      const firstProduct = Array.isArray(c.products) ? c.products[0] : null;
      const productName = c.title ?? firstProduct?.name ?? 'Campaign';
      const price = firstProduct?.price != null ? `PKR ${Number(firstProduct.price).toFixed(0)}` : 'Shop now';
      const imageSource =
        c.cover_image_url
          ? { uri: c.cover_image_url }
          : (firstProduct?.primary_image_url ? { uri: firstProduct.primary_image_url } : require('../assets/pictures/shop.jpeg'));

      // Track impression once per campaign per session
      if (c?.id && !impressed.current.has(c.id)) {
        impressed.current.add(c.id);
        apiClient.post(`/campaigns/${c.id}/event`, {
          event_type: 'impression',
          product_id: firstProduct?.id,
          session_id: sessionIdRef.current,
        }).catch(() => {});
      }

      return (
        <View style={{ marginBottom: 32 }}>
          <VendorAdCard
            ad={{
              id: c.id,
              brandName: vendorName,
              productName,
              productImage: imageSource as any,
              price,
              isVerified: true,
            }}
            onPress={() => {
              if (c?.id) {
                apiClient.post(`/campaigns/${c.id}/event`, {
                  event_type: 'open',
                  product_id: firstProduct?.id,
                  session_id: sessionIdRef.current,
                }).catch(() => {});
              }
              if (c?.id) router.push(`/shop/campaign?campaignId=${encodeURIComponent(c.id)}` as any);
            }}
            onShopNow={() => {
              if (c?.id) {
                apiClient.post(`/campaigns/${c.id}/event`, {
                  event_type: 'product_click',
                  product_id: firstProduct?.id,
                  session_id: sessionIdRef.current,
                }).catch(() => {});
              }
              if (c?.id) router.push(`/shop/campaign?campaignId=${encodeURIComponent(c.id)}` as any);
            }}
            onViewMore={() => {
              const vendorId = c.vendor_profiles?.id ?? c.vendor_id;
              if (vendorId) router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendorId)}` as any);
            }}
          />
        </View>
      );
    }
    const post = item.data;
    const author = post.profiles ?? post.user ?? {};
    return (
      <PostCard
        post={post}
        feedType={feedType}
        currentUserId={currentUserId}
        onUserPress={() => router.push(`/profile/${author.id}` as any)}
      />
    );
  }, [feedType, currentUserId, router]);

  const ListHeader = (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Header bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Image
          source={require('../assets/logo/wearism-w.png')}
          style={{ width: 100, height: 32 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <TouchableOpacity onPress={() => router.push('/social/create-post' as any)}>
            <Ionicons name="add-circle-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/messages' as any)}>
            <Ionicons name="paper-plane-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories strip */}
      <StoriesStrip
        stories={stripStoryItems}
        onAddStory={() => router.push('/social/create-story' as any)}
      />

      {/* Feed type toggle */}
      <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
        {(['home', 'trending'] as const).map(type => (
          <TouchableOpacity
            key={type}
            onPress={() => setFeedType(type)}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
              backgroundColor: feedType === type ? 'rgba(255,255,255,0.08)' : 'transparent',
            }}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               {feedType === type && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary }} />}
               <Text style={{
                color: feedType === type ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 13,
                letterSpacing: 0.3,
              }} className={feedType === type ? 'font-h-bold' : 'font-h-medium'}>
                {type === 'home' ? 'For You' : 'Trending'}
              </Text>
            </View>
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
            <ModeSwitchOverlay />
          ) : (
            <FlatList
              ref={listRef}
              data={feedItems}
              keyExtractor={(item) => item.key}
              renderItem={renderItem}
              ListHeaderComponent={ListHeader}
              contentContainerStyle={{ paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                feedScrollByType[feedType] = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.5}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => {
                    refetch();
                    qc.invalidateQueries({ queryKey: ['stories-feed'] });
                  }}
                  tintColor={COLORS.primary}
                />
              }
              ListFooterComponent={
                isFetchingNextPage
                  ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
                  : null
              }
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 }}>
                  <Ionicons name="shirt-outline" size={48} color="rgba(255,255,255,0.15)" />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 16, textAlign: 'center' }} className="font-h-medium">
                    Your feed is empty
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, marginTop: 6, textAlign: 'center' }} className="font-h-light">
                    Follow people or share your first post
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/social/create-post' as any)}
                    style={{ marginTop: 24, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 15 }} className="font-h-bold">Create a post</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </SafeAreaView>
        <BottomNav active="feed" />
        <StoryViewer
          stories={viewerStoryItems}
          initialIndex={selectedStoryIndex}
          visible={storyViewerVisible}
          onClose={() => setStoryViewerVisible(false)}
        />
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;
