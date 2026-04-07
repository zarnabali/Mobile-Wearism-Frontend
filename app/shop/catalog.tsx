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

const CATEGORIES = ['All', 'Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'];
const SORT_OPTIONS = [
  { value: 'newest',      label: 'Newest First' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular',    label: 'Most Popular' },
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

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {/* Sort */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
                Sort By
              </Text>
              <View style={{ gap: 8, marginBottom: 28 }}>
                {SORT_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setSort(opt.value)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: sort === opt.value ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.05)',
                      borderWidth: 1,
                      borderColor: sort === opt.value ? 'rgba(255,107,53,0.5)' : 'rgba(255,255,255,0.1)',
                      borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: sort === opt.value ? '#FF6B35' : 'rgba(255,255,255,0.7)', fontSize: 15 }}>
                      {opt.label}
                    </Text>
                    {sort === opt.value && <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price range */}
              <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.5)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
                Price Range
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>Min ($)</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>Max ($)</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Any"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 16 }}
                  />
                </View>
              </View>

              {/* Apply */}
              <TouchableOpacity
                onPress={onApply}
                style={{ backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>Apply Filters</Text>
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
  const vendorName =
    item?.vendor_profiles?.shop_name ??
    item?.vendor?.brand_name ??
    item?.vendor?.shop_name ??
    'Vendor';
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={{ flex: 1, margin: 6 }}>
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: item.primary_image_url ?? item.images?.[0] ?? 'https://via.placeholder.com/300' }}
            style={{ width: '100%', aspectRatio: 1 }}
            resizeMode="cover"
          />
          {item.condition === 'preloved' && (
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.75)', borderWidth: 1, borderColor: '#FF6B35', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Preloved
              </Text>
            </View>
          )}
        </View>
        <View style={{ padding: 12 }}>
          <TouchableOpacity onPress={onVendorPress} activeOpacity={0.8} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
              {vendorName}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 13, marginBottom: 4 }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 18 }}>
            ${item.price?.toFixed(2)}
          </Text>
          {item.condition && item.condition !== 'new' && item.condition !== 'preloved' && (
            <View style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'capitalize' }}>
                {item.condition}
              </Text>
            </View>
          )}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 26 }}>Shop</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setPendingSort(sort);
                  setPendingMin(minPrice);
                  setPendingMax(maxPrice);
                  setFilterOpen(true);
                }}
                style={{
                  backgroundColor: activeFilters ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: activeFilters ? 'rgba(255,107,53,0.5)' : 'transparent',
                  borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="options-outline" size={20} color={activeFilters ? '#FF6B35' : 'white'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/orders/buyer' as any)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="bag-outline" size={22} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/shop/cart' as any)}
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="cart-outline" size={22} color="white" />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: '#ef4444',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#000',
                    }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, paddingVertical: 11 }}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products, brands…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={{ flex: 1, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 15, marginLeft: 10 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category chips */}
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={x => x}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item)}
                style={{
                  height: 34,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  borderWidth: 1,
                  backgroundColor: selectedCategory === item ? '#FF6B35' : 'rgba(255,255,255,0.07)',
                  borderColor: selectedCategory === item ? '#FF6B35' : 'rgba(255,255,255,0.14)',
                  alignItems: 'center', justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: selectedCategory === item ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Product grid */}
          {isLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 }}>
              {Array(6).fill(0).map((_, i) => (
                <View key={i} style={{ width: '50%', padding: 6 }}>
                  <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Skeleton style={{ width: '100%', aspectRatio: 1 }} />
                    <View style={{ padding: 12, gap: 8 }}>
                      <Skeleton style={{ width: 64, height: 10, borderRadius: 4 }} />
                      <Skeleton style={{ width: '75%', height: 13, borderRadius: 4 }} />
                      <Skeleton style={{ width: 48, height: 18, borderRadius: 4 }} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
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
