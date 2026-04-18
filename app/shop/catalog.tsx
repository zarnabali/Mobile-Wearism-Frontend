import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import BottomNav from '../components/BottomNav';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';
import { useCartStore } from '../../src/stores/cartStore';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Popular' },
];

// ─── Sort / Filter bottom sheet ──────────────────────────────────────────────
function FilterSheet({
  visible, onClose,
  sort, setSort,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  sort: string; setSort: (s: string) => void;
  minPrice: string; setMinPrice: (v: string) => void;
  maxPrice: string; setMaxPrice: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
        <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(30,0,4,0.99)', 'rgba(8,0,2,0.99)']} style={{ paddingBottom: 40 }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 18 }}>Sort & Filter</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={26} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}>
              {/* Sort */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                Sort By
              </Text>
              <View style={{ gap: 10, marginBottom: 32 }}>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setSort(opt.value)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: sort === opt.value ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.03)',
                      borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: sort === opt.value ? '#FF6B35' : 'rgba(255,255,255,0.6)', fontSize: 15 }}>
                      {opt.label}
                    </Text>
                    {sort === opt.value && <Ionicons name="checkmark" size={20} color="#FF6B35" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price range */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                Price Range
              </Text>
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Min ($)</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    keyboardType="numeric"
                    className="bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white font-h-light"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 8 }}>Max ($)</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Any"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    keyboardType="numeric"
                    className="bg-white/5 border border-white/5 rounded-xl px-4 py-3.5 text-white font-h-light"
                  />
                </View>
              </View>

              {/* Apply */}
              <TouchableOpacity
                onPress={onApply}
                activeOpacity={0.9}
                className="bg-[#FF6B35] py-4 rounded-2xl"
                style={{ shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 5 }}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16, textAlign: 'center' }}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({
  item,
  onPress,
  onVendorPress,
}: {
  item: any;
  onPress: () => void;
  onVendorPress: () => void;
}) {
  const vendorName = item?.vendor_profiles?.shop_name ?? item?.vendor?.brand_name ?? 'Vendor';
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ flex: 1, margin: 8 }}>
      <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)' }}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.primary_image_url ?? item.images?.[0] ?? 'https://via.placeholder.com/300' }}
            style={{ width: '100%', aspectRatio: 0.85, backgroundColor: 'rgba(255,255,255,0.02)' }}
            resizeMode="cover"
          />
          {item.condition === 'preloved' && (
            <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#FF6B35', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>
                Preloved
              </Text>
            </View>
          )}
        </View>
        <View style={{ padding: 14 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
            {vendorName}
          </Text>
          <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 8 }} numberOfLines={1}>
            {item.name}
          </Text>
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 17 }}>
              ${item.price?.toFixed(0)}
            </Text>
            <View className="w-6 h-6 rounded-full bg-white/5 items-center justify-center">
              <Ionicons name="add" size={14} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.count);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state (pending in sheet, committed on Apply)
  const [pendingSort, setPendingSort] = useState('newest');
  const [pendingMin, setPendingMin] = useState('');
  const [pendingMax, setPendingMax] = useState('');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const activeFilters = sort !== 'newest' || minPrice || maxPrice;

  // 500ms search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const {
    data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, refetch,
  } = useInfiniteQuery({
    queryKey: ['products', selectedCategory, debouncedSearch, sort, minPrice, maxPrice],
    queryFn: ({ pageParam = 1 }) => {
      let url = `/products?page=${pageParam}&limit=20`;
      if (selectedCategory !== 'All') url += `&category=${selectedCategory.toLowerCase()}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (sort) url += `&sort=${sort}`;
      if (minPrice) url += `&min_price=${minPrice}`;
      if (maxPrice) url += `&max_price=${maxPrice}`;
      return apiClient.get(url).then(r => r.data);
    },
    getNextPageParam: (last: any) => last?.pagination?.has_next ? last.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const products = data?.pages.flatMap((p: any) => p.data ?? p.products ?? []) ?? [];

  const handleApplyFilters = useCallback(() => {
    setSort(pendingSort);
    setMinPrice(pendingMin);
    setMaxPrice(pendingMax);
    setFilterOpen(false);
  }, [pendingSort, pendingMin, pendingMax]);

  const renderProduct = useCallback(({ item }: { item: any }) => (
    <ProductCard
      item={item}
      onPress={() => router.push(`/shop/product-detail?id=${item.id}` as any)}
      onVendorPress={() => {
        const vendorId = item?.vendor_id ?? item?.vendor_profiles?.id;
        if (vendorId) router.push(`/shop/vendor?vendorId=${encodeURIComponent(vendorId)}` as any);
      }}
    />
  ), [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 }}>Explore</Text>
              <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 32, marginTop: 2 }}>Shop</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={() => router.push('/shop/cart' as any)}
                activeOpacity={0.7}
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cart-outline" size={24} color="white" />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary,
                    }}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setPendingSort(sort);
                  setPendingMin(minPrice);
                  setPendingMax(maxPrice);
                  setFilterOpen(true);
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: activeFilters ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="options-outline" size={24} color={activeFilters ? '#FF6B35' : 'white'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 20 }}>
            <View className="flex-row items-center bg-white/5 rounded-2xl px-5 py-4 border border-white/5">
              <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.3)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Find your next style..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={{ flex: 1, fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16, marginLeft: 12 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category chips */}
          <View style={{ height: 60, marginBottom: 8 }}>
            <FlatList
              horizontal
              data={CATEGORIES}
              keyExtractor={x => x}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 10, alignItems: 'center' }}
              renderItem={({ item }) => {
                const isActive = selectedCategory === item;
                return (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory(item)}
                    activeOpacity={0.85}
                    style={{ 
                      height: 42,
                      paddingHorizontal: 20, 
                      backgroundColor: isActive ? '#FF6B35' : 'rgba(255,255,255,0.05)', 
                      borderRadius: 21,
                      borderWidth: 1,
                      borderColor: isActive ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      ...(isActive ? { shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 } : {})
                    }}
                  >
                    <Text style={{ 
                      fontFamily: isActive ? 'HelveticaNeue-Bold' : 'HelveticaNeue-Light', 
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', 
                      fontSize: 13 
                    }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Product grid */}
          {isLoading ? (
            <ModeSwitchOverlay />
          ) : (
            <FlatList
              data={products}
              keyExtractor={item => item.id.toString()}
              numColumns={2}
              contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 110 }}
              renderItem={renderProduct}
              onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
              onEndReachedThreshold={0.5}
              refreshing={isLoading}
              onRefresh={refetch}
              ListEmptyComponent={
                <EmptyState
                  icon="cube-outline"
                  title="No products found"
                  subtitle="Try adjusting your search or filters."
                />
              }
              ListFooterComponent={
                isFetchingNextPage
                  ? <ActivityIndicator color="#FF6B35" style={{ marginVertical: 20 }} />
                  : null
              }
            />
          )}
        </SafeAreaView>

        <BottomNav active="shop" />
      </LinearGradient>

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        sort={pendingSort} setSort={setPendingSort}
        minPrice={pendingMin} setMinPrice={setPendingMin}
        maxPrice={pendingMax} setMaxPrice={setPendingMax}
        onApply={handleApplyFilters}
      />
    </View>
  );
}
