import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { useAuthStore } from '../src/stores/authStore';

/** Masonry tile heights (same rhythm as the old static grid). */
const EXPLORE_TILE_HEIGHTS = [220, 300, 180, 260, 240, 200, 280, 210, 250, 190, 270, 230];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const categories = ['IGTV', 'Shop', 'Style', 'Auto', 'Gaming', 'Food', 'Travel'];

type DirectoryRow = {
  kind: 'vendor' | 'user';
  id: string;
  name: string;
  subtitle: string | null;
  image_url: string | null;
  user_id: string;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const SearchScreen = () => {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [rawQuery, setRawQuery] = useState('');
  const debounced = useDebouncedValue(rawQuery.trim(), 280);
  const activeQuery = debounced.length >= 1 ? debounced : '';

  const { data: directoryData, isFetching, isError } = useQuery({
    queryKey: ['directory-search', activeQuery],
    queryFn: () =>
      apiClient
        .get('/users/search', { params: { q: activeQuery, limit: 30 } })
        .then((r) => r.data),
    enabled: activeQuery.length >= 1,
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const results: DirectoryRow[] = useMemo(() => directoryData?.results ?? [], [directoryData]);

  const {
    data: explorePage,
    isLoading: exploreLoading,
    isError: exploreError,
    refetch: refetchExplore,
  } = useQuery({
    queryKey: ['search-explore', currentUserId],
    queryFn: () =>
      apiClient.get('/feed/explore', { params: { page: 1, limit: 40 } }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const explorePosts = useMemo(() => {
    const rows: any[] = explorePage?.data ?? [];
    const uid = currentUserId;
    const filtered = rows.filter(
      (p) =>
        p?.id &&
        p?.user_id &&
        p.user_id !== uid &&
        !!(p.image_url || p.image_path),
    );
    const capped = filtered.slice(0, 20);
    return capped.map((p, i) => ({
      ...p,
      tileHeight: EXPLORE_TILE_HEIGHTS[i % EXPLORE_TILE_HEIGHTS.length],
      /** Prefer API `image_url` (set from `image_path` on server). */
      displayUri: String(p.image_url || '').trim() || null,
    }));
  }, [explorePage, currentUserId]);

  // Masonry columns from trending API (`explorePosts`); do not use removed dummy `exploreContent`.
  const leftColumn = explorePosts.filter((_, i) => i % 2 === 0);
  const rightColumn = explorePosts.filter((_, i) => i % 2 !== 0);

  const openResult = (item: DirectoryRow) => {
    Keyboard.dismiss();
    if (item.kind === 'vendor') {
      router.push(`/shop/vendor?vendorId=${encodeURIComponent(item.id)}` as any);
    } else {
      router.push(`/profile/${encodeURIComponent(item.id)}` as any);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Search Header */}
          <View className="px-4 pt-2 pb-4">
            <View className="flex-row items-center bg-white/10 rounded-xl px-4 py-2.5 mb-4 border border-white/10">
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={rawQuery}
                onChangeText={setRawQuery}
                placeholder="Search"
                placeholderTextColor="rgba(255,255,255,0.6)"
                className="flex-1 ml-3 text-white text-[16px]"
                style={{ paddingVertical: 0, fontFamily: 'HelveticaNeue' }}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat}
                  className={`px-5 py-2 rounded-lg border border-white/10 mr-2 ${index === 0 ? 'bg-white text-black' : 'bg-transparent'}`}
                  style={{ backgroundColor: index === 0 ? 'white' : 'rgba(255,255,255,0.05)' }}
                >
                  <Text
                    className={`text-sm font-medium ${index === 0 ? 'text-black' : 'text-white'}`}
                    style={{ fontFamily: 'HelveticaNeue-Medium' }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            {activeQuery.length >= 1 ? (
              <View className="px-4">
                {isError ? (
                  <Text className="text-white/50 text-center mt-6" style={{ fontFamily: 'HelveticaNeue' }}>
                    Search failed. Try again.
                  </Text>
                ) : isFetching && results.length === 0 ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator color="#FF6B35" />
                  </View>
                ) : results.length === 0 ? (
                  <Text className="text-white/50 text-center mt-6" style={{ fontFamily: 'HelveticaNeue' }}>
                    No results.
                  </Text>
                ) : (
                  results.map((item) => {
                    const isVendor = item.kind === 'vendor';
                    return (
                      <TouchableOpacity
                        key={`${item.kind}-${item.id}`}
                        onPress={() => openResult(item)}
                        activeOpacity={0.75}
                        className="flex-row items-center py-3 border-b border-white/10"
                      >
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} className="w-11 h-11 rounded-full bg-white/10" />
                        ) : (
                          <View className="w-11 h-11 rounded-full bg-white/10 items-center justify-center">
                            <Ionicons name={isVendor ? 'storefront-outline' : 'person-outline'} size={20} color="rgba(255,255,255,0.45)" />
                          </View>
                        )}
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center flex-wrap">
                            <Text className="text-white text-[15px] mr-2" style={{ fontFamily: 'HelveticaNeue-Medium' }} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <View
                              className="px-2 py-0.5 rounded-full border"
                              style={{
                                backgroundColor: isVendor ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.08)',
                                borderColor: isVendor ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.15)',
                              }}
                            >
                              <Text
                                className="text-[10px]"
                                style={{
                                  fontFamily: 'HelveticaNeue-Bold',
                                  color: isVendor ? '#FF6B35' : 'rgba(255,255,255,0.65)',
                                  textTransform: 'uppercase',
                                }}
                              >
                                {isVendor ? 'Vendor' : 'Member'}
                              </Text>
                            </View>
                          </View>
                          {item.subtitle ? (
                            <Text className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'HelveticaNeue' }} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : exploreError ? (
              <View className="py-12 px-6 items-center">
                <Text className="text-white/55 text-center" style={{ fontFamily: 'HelveticaNeue' }}>
                  Could not load explore posts.
                </Text>
                <TouchableOpacity onPress={() => refetchExplore()} className="mt-4 px-5 py-2.5 rounded-full bg-white/10 border border-white/15">
                  <Text className="text-[#FF6B35]" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : exploreLoading ? (
              <View className="py-16 items-center justify-center">
                <ActivityIndicator color="#FF6B35" />
              </View>
            ) : explorePosts.length === 0 ? (
              <View className="py-12 px-6 items-center">
                <Text className="text-white/45 text-center text-[15px]" style={{ fontFamily: 'HelveticaNeue' }}>
                  No posts from other people to show yet. When more creators publish public posts, trending picks will appear here.
                </Text>
              </View>
            ) : (
              <View className="flex-row px-2">
                {/* Left Column */}
                <View className="flex-1 mr-1">
                  {leftColumn.map((item: any) =>
                    item.displayUri ? (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        className="mb-2"
                        onPress={() => router.push(`/social/post-detail?id=${encodeURIComponent(item.id)}` as any)}
                      >
                        <Image
                          source={{ uri: item.displayUri }}
                          style={{ width: '100%', height: item.tileHeight, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : null,
                  )}
                </View>

                {/* Right Column */}
                <View className="flex-1 ml-1">
                  {rightColumn.map((item: any) => {
                    const h = hashString(String(item.id));
                    if (!item.displayUri) return null;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        className="mb-2"
                        onPress={() => router.push(`/social/post-detail?id=${encodeURIComponent(item.id)}` as any)}
                      >
                        <Image
                          source={{ uri: item.displayUri }}
                          style={{ width: '100%', height: item.tileHeight, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                        {h % 3 === 0 && (
                          <View className="absolute top-3 right-3">
                            <Ionicons name="copy-outline" size={20} color="white" />
                          </View>
                        )}
                        {h % 5 === 0 && (
                          <View className="absolute top-3 right-3">
                            <Ionicons name="play-outline" size={24} color="white" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
        <BottomNav active="search" />
      </LinearGradient>
    </View>
  );
};

export default SearchScreen;
