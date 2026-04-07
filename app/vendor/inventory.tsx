import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VendorNav from '../components/VendorNav';
import { apiClient } from '../../src/lib/apiClient';
import { Skeleton } from '../../src/components/Skeleton';
import { EmptyState } from '../../src/components/EmptyState';

interface VendorProduct {
    id: string;
    name: string;
    primary_image_url?: string;
    price: number;
    stock_quantity?: number;
    sales_count?: number;
    status?: 'active' | 'archived' | 'draft';
    is_active?: boolean;
    is_trending?: boolean;
}

function ProductRow({ product }: { product: VendorProduct }) {
    const qc = useQueryClient();

    const isActive = product.status === 'active' || product.is_active === true;

    const toggleMutation = useMutation({
        mutationFn: () => apiClient.patch(`/products/${product.id}`, {
            status: isActive ? 'archived' : 'active',
        }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['vendor-products'] }),
    });

    return (
        <TouchableOpacity
            onPress={() => router.push(`/vendor/product-create?id=${product.id}` as any)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.07)',
                padding: 12,
                marginBottom: 12,
            }}
            activeOpacity={0.75}
        >
            {product.primary_image_url ? (
                <Image
                    source={{ uri: product.primary_image_url }}
                    style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    resizeMode="cover"
                />
            ) : (
                <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.3)" />
                </View>
            )}

            <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 15 }} numberOfLines={2}>
                    {product.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 14 }}>
                        ${product.price.toFixed(2)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="cube-outline" size={12} color="rgba(255,255,255,0.4)" />
                        <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                            {(product.stock_quantity ?? 0)} in stock
                        </Text>
                    </View>
                    {product.is_trending && (
                        <View style={{ backgroundColor: 'rgba(255,107,53,0.18)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 10 }}>TRENDING</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); toggleMutation.mutate(); }}
                    disabled={toggleMutation.isPending}
                    style={{
                        backgroundColor: isActive ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.07)',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isActive ? 'rgba(76,175,80,0.35)' : 'rgba(255,255,255,0.12)',
                        minWidth: 58,
                        alignItems: 'center',
                    }}
                >
                    {toggleMutation.isPending ? (
                        <ActivityIndicator size="small" color={isActive ? '#4CAF50' : 'rgba(255,255,255,0.4)'} style={{ height: 14 }} />
                    ) : (
                        <Text style={{ fontFamily: 'HelveticaNeue-Bold', fontSize: 11, color: isActive ? '#4CAF50' : 'rgba(255,255,255,0.4)' }}>
                            {isActive ? 'ACTIVE' : 'DRAFT'}
                        </Text>
                    )}
                </TouchableOpacity>
                {product.sales_count !== undefined && (
                    <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {product.sales_count} sold
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const VendorInventory = () => {
    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['vendor-products'],
        queryFn: () => apiClient.get('/vendors/me/products').then((r) => r.data),
    });

    const products: VendorProduct[] = data?.products ?? [];
    const activeCount = products.filter((p) => p.status === 'active' || p.is_active === true).length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <LinearGradient
                colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                    Your
                                </Text>
                                <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>
                                    Inventory
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/vendor/product-create' as any)}
                                style={{
                                    backgroundColor: '#FF6B35',
                                    borderRadius: 14,
                                    paddingHorizontal: 20,
                                    paddingVertical: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    shadowColor: '#FF6B35',
                                    shadowOpacity: 0.3,
                                    shadowRadius: 10,
                                    shadowOffset: { width: 0, height: 4 },
                                }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                    Add Product
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Stats Bar */}
                        <View style={{
                            flexDirection: 'row',
                            marginTop: 20,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.08)',
                            padding: 16,
                            gap: 20,
                        }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {isLoading ? (
                                    <Skeleton className="w-10 h-7 mb-1" />
                                ) : (
                                    <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#fff' }}>
                                        {products.length}
                                    </Text>
                                )}
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Products
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {isLoading ? (
                                    <Skeleton className="w-10 h-7 mb-1" />
                                ) : (
                                    <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#4CAF50' }}>
                                        {activeCount}
                                    </Text>
                                )}
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Active
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                {isLoading ? (
                                    <Skeleton className="w-10 h-7 mb-1" />
                                ) : (
                                    <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35' }}>
                                        {totalStock}
                                    </Text>
                                )}
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    In Stock
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8, flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF6B35" />}
                    >
                        {isLoading ? (
                            <View style={{ gap: 12 }}>
                                {Array(4).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="w-full h-[88px]" />
                                ))}
                            </View>
                        ) : products.length === 0 ? (
                            <EmptyState
                                icon="cube-outline"
                                title="No Products Yet"
                                subtitle="Add your first product to start selling on Wearism."
                                actionLabel="Add Product"
                                onAction={() => router.push('/vendor/product-create' as any)}
                            />
                        ) : (
                            products.map((product) => (
                                <ProductRow key={product.id} product={product} />
                            ))
                        )}
                    </ScrollView>
                </SafeAreaView>

                <VendorNav active="inventory" />
            </LinearGradient>
        </View>
    );
};

export default VendorInventory;
