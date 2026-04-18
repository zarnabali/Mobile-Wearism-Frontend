import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VendorNav from '../components/VendorNav';
import { apiClient } from '../../src/lib/apiClient';
import { EmptyState } from '../../src/components/EmptyState';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

const { width } = Dimensions.get('window');

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
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderRadius: 24,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.05)',
            }}
            activeOpacity={0.8}
        >
            <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' }}>
              {product.primary_image_url ? (
                  <Image
                      source={{ uri: product.primary_image_url }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                  />
              ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="shirt-outline" size={24} color="rgba(255,255,255,0.1)" />
                  </View>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                  {isActive ? 'Live on Store' : 'Draft'}
                </Text>
                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.9)', fontSize: 15, marginBottom: 6 }} numberOfLines={1}>
                    {product.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Light', color: '#fff', fontSize: 16 }}>
                        ${product.price.toFixed(0)}
                    </Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                            {(product.stock_quantity ?? 0)} in stock
                        </Text>
                    </View>
                </View>
            </View>

            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); toggleMutation.mutate(); }}
                    disabled={toggleMutation.isPending}
                    style={{
                        backgroundColor: isActive ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isActive ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.1)',
                    }}
                >
                    {toggleMutation.isPending ? (
                        <ActivityIndicator size="small" color={isActive ? '#4ade80' : 'rgba(255,255,255,0.3)'} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isActive ? '#4ade80' : 'rgba(255,255,255,0.2)' }} />
                          <Text style={{ fontFamily: 'HelveticaNeue-Medium', fontSize: 10, color: isActive ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                              {isActive ? 'ACTIVE' : 'DRAFT'}
                          </Text>
                        </View>
                    )}
                </TouchableOpacity>
                {product.is_trending && (
                  <View style={{ marginTop: 8 }}>
                    <Ionicons name="flash" size={14} color="#FF6B35" />
                  </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const VendorInventory = () => {
    const qc = useQueryClient();
    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['vendor-products'],
        queryFn: () => apiClient.get('/vendors/me/products').then((r) => r.data),
    });

    const products: VendorProduct[] = data?.products ?? [];
    const activeCount = products.filter((p) => p.status === 'active' || p.is_active === true).length;
    const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0);
    const estimatedRevenue = products.reduce((sum, p) => sum + (p.price * (p.sales_count ?? 0)), 0);

    return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : (
        <LinearGradient
            colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>
                                    Manage
                                </Text>
                                <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Light', color: '#fff', marginTop: 2 }}>
                                    Inventory
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => router.push('/vendor/product-create' as any)}
                                style={{
                                    backgroundColor: '#FF6B35',
                                    borderRadius: 16,
                                    paddingHorizontal: 20,
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    shadowColor: '#FF6B35',
                                    shadowOpacity: 0.25,
                                    shadowRadius: 15,
                                    shadowOffset: { width: 0, height: 8 },
                                    elevation: 5
                                }}
                                activeOpacity={0.9}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue-Light', color: '#fff', marginLeft: 8 }}>
                                    New Product
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Revenue Card (Wow Factor) */}
                        <LinearGradient
                            colors={['rgba(255,107,53,0.15)', 'rgba(255,107,53,0.05)']}
                            style={{
                                marginTop: 24,
                                borderRadius: 32,
                                padding: 24,
                                borderWidth: 1,
                                borderColor: 'rgba(255,107,53,0.2)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            <View style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}>
                                <Ionicons name="wallet-outline" size={160} color="#FF6B35" />
                            </View>
                            
                            <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                Total Estimated Revenue
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                                <Text style={{ fontSize: 42, fontFamily: 'HelveticaNeue-Light', color: '#fff' }}>
                                    ${estimatedRevenue.toFixed(0)}
                                </Text>
                                <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                                    USD
                                </Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', marginTop: 24, gap: 16 }}>
                                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Active</Text>
                                    <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Light', color: '#4ade80', marginTop: 4 }}>{activeCount}</Text>
                                </View>
                                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Stock</Text>
                                    <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Light', color: '#FF6B35', marginTop: 4 }}>{totalStock}</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8, flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF6B35" />}
                    >
                        <Text style={{ paddingHorizontal: 4, marginBottom: 16, fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>
                            Your Catalog
                        </Text>
                        
                        {products.length === 0 ? (
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
            )}
        </View>
    );
};

export default VendorInventory;
