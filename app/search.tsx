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
import ModeSwitchOverlay from './components/ModeSwitchOverlay';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import BottomNav from './components/BottomNav';
import { apiClient } from '../src/lib/apiClient';
import { useAuthStore } from '../src/stores/authStore';
import { COLORS } from '../src/constants/theme';

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
          <View style={{ paddingHorizontal: 16, paddingTop: 12, pb: 16 }}>
            <View className="flex-row items-center bg-white/5 rounded-2xl px-5 py-3.5 mb-6 border border-white/5">
              <Ionicons name="search-outline" size={22} color="rgba(255,255,255,0.4)" />
              <TextInput
                value={rawQuery}
                onChangeText={setRawQuery}
                placeholder="Search outfits, creators, shops..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                className="flex-1 ml-4 text-white text-[16px] font-h-light"
                style={{ paddingVertical: 0 }}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {rawQuery.length > 0 && (
                <TouchableOpacity onPress={() => setRawQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
              {categories.map((cat, index) => {
                const isActive = index === 0 && rawQuery === ''; // Mocking first as active
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.8}
                    style={{ marginRight: 10, borderRadius: 14, overflow: 'hidden' }}
                  >
                    {isActive ? (
                      <LinearGradient
                        colors={[COLORS.primary, '#FF9F6A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ paddingHorizontal: 20, paddingVertical: 10 }}
                      >
                        <Text className="text-white text-[13px] font-h-bold">{cat}</Text>
                      </LinearGradient>
                    ) : (
                      <View 
                        className="px-5 py-2.5 bg-white/5 border border-white/10"
                        style={{ borderRadius: 14 }}
                      >
                        <Text className="text-white/60 text-[13px] font-h-medium">{cat}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
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
                        activeOpacity={0.7}
                        className="flex-row items-center py-4 border-b border-white/5"
                      >
                        <LinearGradient
                          colors={isVendor ? [COLORS.primary, '#FF9F6A'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                          style={{ width: 50, height: 50, borderRadius: 25, padding: 1.5 }}
                        >
                          {item.image_url ? (
                            <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%', borderRadius: 23.5 }} />
                          ) : (
                            <View className="flex-1 rounded-full bg-black items-center justify-center">
                              <Ionicons 
                                name={isVendor ? 'storefront-outline' : 'person-outline'} 
                                size={20} 
                                color={isVendor ? COLORS.primary : 'rgba(255,255,255,0.3)'} 
                              />
                            </View>
                          )}
                        </LinearGradient>
                        
                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center">
                            <Text className="text-white text-[15px] font-h-bold mr-2" numberOfLines={1}>
                              {item.name}
                            </Text>
                            {isVendor && (
                              <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                            )}
                          </View>
                          <Text className="text-white/40 text-[12px] font-h-light mt-0.5" numberOfLines={1}>
                            {item.subtitle || (isVendor ? 'Verified Partner' : 'Fashion Explorer')}
                          </Text>
                        </View>
                        
                        <View 
                          className={`px-3 py-1 rounded-full border ${isVendor ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}
                        >
                          <Text className={`text-[9px] font-h-bold uppercase tracking-widest ${isVendor ? 'text-primary' : 'text-white/40'}`}>
                            {isVendor ? 'Vendor' : 'Member'}
                          </Text>
                        </View>
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
              <ModeSwitchOverlay />
            ) : explorePosts.length === 0 ? (
              <View className="py-12 px-6 items-center">
                <Text className="text-white/45 text-center text-[15px]" style={{ fontFamily: 'HelveticaNeue' }}>
                  No posts from other people to show yet. When more creators publish public posts, trending picks will appear here.
                </Text>
              </View>
            ) : (
              <View className="flex-row px-4">
                {/* Left Column */}
                <View className="flex-1 mr-2">
                  {leftColumn.map((item: any) =>
                    item.displayUri ? (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}
                        onPress={() => router.push(`/social/post-detail?id=${encodeURIComponent(item.id)}` as any)}
                      >
                        <Image
                          source={{ uri: item.displayUri }}
                          style={{ width: '100%', height: item.tileHeight }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : null,
                  )}
                </View>

                {/* Right Column */}
                <View className="flex-1 ml-2">
                  {rightColumn.map((item: any) => {
                    const h = hashString(String(item.id));
                    if (!item.displayUri) return null;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.9}
                        style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}
                        onPress={() => router.push(`/social/post-detail?id=${encodeURIComponent(item.id)}` as any)}
                      >
                        <Image
                          source={{ uri: item.displayUri }}
                          style={{ width: '100%', height: item.tileHeight }}
                          resizeMode="cover"
                        />
                        <View className="absolute bottom-4 left-4 flex-row items-center">
                          <Ionicons 
                            name={h % 3 === 0 ? "copy" : "play"} 
                            size={14} 
                            color="white" 
                            style={{ opacity: 0.8 }} 
                          />
                        </View>
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
