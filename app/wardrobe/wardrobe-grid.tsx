import React from 'react';
import {
  View, Text, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';

function GridItem({ item }: { item: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/wardrobe/item-detail?id=${item.id}` as any)}
      style={{ width: '48%', marginBottom: 16 }}
      activeOpacity={0.85}
    >
      <View className="w-full aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative">
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          resizeMode="cover"
        />
        {item.worn_count > 0 && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="shirt" size={10} color="rgba(255,255,255,0.8)" style={{ marginRight: 4 }} />
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 10 }}>
              {item.worn_count}
            </Text>
          </View>
        )}
      </View>
      <Text 
        style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', marginTop: 8, paddingHorizontal: 2 }} 
        className="text-white text-xs" 
        numberOfLines={2}
      >
        {item.name || item.fashionclip_main_category || 'Untitled Item'}
      </Text>
    </TouchableOpacity>
  );
}

export default function WardrobeGridScreen() {
  const { slot, title } = useLocalSearchParams<{ slot: string; title: string }>();
  const router = useRouter();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['wardrobe-grid', slot],
    queryFn: async ({ pageParam = 1 }) => {
      // Backend paginates, just pass slot and page
      const res = await apiClient.get(`/wardrobe/items?slot=${slot}&page=${pageParam}&limit=20`);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      // Assuming paginated response with generic standard: has_next/next_page or items array length
      const hasNext = lastPage.has_next ?? (lastPage.items && lastPage.items.length === 20) ?? false;
      return hasNext ? (lastPage.current_page ?? 1) + 1 : undefined;
    },
    enabled: !!slot,
  });

  const flattenItems = data?.pages.flatMap(p => p.items ?? p.data ?? p) ?? [];

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 h-14 border-b border-white/10">
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              {title || slot || 'Wardrobe'}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {isLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 }}>
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-[48%] aspect-square" />
              ))}
            </View>
          ) : flattenItems.length === 0 ? (
            <EmptyState
              icon="shirt-outline"
              title="Nothing here yet"
              subtitle="Add items to start building this category."
              actionLabel="Upload Item"
              onAction={() => router.push('/wardrobe/item-upload' as any)}
            />
          ) : (
            <FlatList
              key={2} // Forces a remount during Fast Refresh to avoid the invariant violation
              data={flattenItems}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
              renderItem={({ item }) => <GridItem item={item} />}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              refreshing={isRefetching}
              onRefresh={refetch}
              ListFooterComponent={
                isFetchingNextPage ? <ActivityIndicator color="#FF6B35" className="my-4" /> : null
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
