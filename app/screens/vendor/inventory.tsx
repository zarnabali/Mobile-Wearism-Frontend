import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import VendorNav from '../../components/VendorNav';
import ProductCard from '../../components/ProductCard';

// Sample products data
const sampleProducts = [
    {
        id: 'p1',
        name: 'Classic Denim Jacket',
        image: require('../../../assets/pictures/shop.jpeg'),
        price: '$89.99',
        stock: 24,
        sales: 145,
        isActive: true,
        isTrending: true,
    },
    {
        id: 'p2',
        name: 'Casual White Sneakers',
        image: require('../../../assets/pictures/shop2.jpeg'),
        price: '$65.00',
        stock: 8,
        sales: 89,
        isActive: true,
        isTrending: false,
    },
    {
        id: 'p3',
        name: 'Summer Floral Dress',
        image: require('../../../assets/pictures/wardrobe.jpeg'),
        price: '$120.00',
        stock: 15,
        sales: 67,
        isActive: true,
        isTrending: false,
    },
    {
        id: 'p4',
        name: 'Leather Crossbody Bag',
        image: require('../../../assets/pictures/wardrobe2.jpeg'),
        price: '$95.50',
        stock: 12,
        sales: 52,
        isActive: true,
        isTrending: false,
    },
];

const VendorInventory = () => {
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
                                onPress={() => router.push('/vendor/add-product')}
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
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 20,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.08)',
                                padding: 16,
                                gap: 20,
                            }}
                        >
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#fff' }}>
                                    {sampleProducts.length}
                                </Text>
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Products
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#4CAF50' }}>
                                    {sampleProducts.filter(p => p.isActive).length}
                                </Text>
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Active
                                </Text>
                            </View>
                            <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35' }}>
                                    {sampleProducts.reduce((sum, p) => sum + p.stock, 0)}
                                </Text>
                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    In Stock
                                </Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {sampleProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}

                        {/* Empty state if no products */}
                        {sampleProducts.length === 0 && (
                            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                                <View
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 40,
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 20,
                                    }}
                                >
                                    <Ionicons name="cube-outline" size={40} color="rgba(255,255,255,0.3)" />
                                </View>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontFamily: 'HelveticaNeue-Light',
                                        color: 'rgba(255,255,255,0.5)',
                                        marginBottom: 8,
                                    }}
                                >
                                    No Products Yet
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontFamily: 'HelveticaNeue-Light',
                                        color: 'rgba(255,255,255,0.4)',
                                        textAlign: 'center',
                                    }}
                                >
                                    Add your first product to start selling
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>

                <VendorNav active="inventory" />
            </LinearGradient>
        </View>
    );
};

export default VendorInventory;
