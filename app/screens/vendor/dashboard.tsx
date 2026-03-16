import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import VendorNav from '../../components/VendorNav';
import { useVendor } from '../../contexts/VendorContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const VendorDashboard = () => {
    const { vendorData } = useVendor();

    const summaryCards = [
        { id: 1, label: 'Products', value: '24', icon: 'cube', color: '#4CAF50', gradient: ['rgba(76,175,80,0.3)', 'rgba(56,142,60,0.15)', 'rgba(27,94,32,0.05)'] as const },
        { id: 2, label: 'Active Ads', value: '8', icon: 'megaphone', color: '#FF6B35', gradient: ['rgba(255,107,53,0.3)', 'rgba(230,81,0,0.15)', 'rgba(191,54,12,0.05)'] as const },
        { id: 3, label: 'Total Sales', value: '$12.5K', icon: 'trending-up', color: '#2196F3', gradient: ['rgba(33,150,243,0.3)', 'rgba(25,118,210,0.15)', 'rgba(13,71,161,0.05)'] as const },
        { id: 4, label: 'Engagement', value: '87%', icon: 'heart', color: '#E91E63', gradient: ['rgba(233,30,99,0.3)', 'rgba(194,24,91,0.15)', 'rgba(136,14,79,0.05)'] as const },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <LinearGradient
                colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                        <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Welcome back
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Thin', color: '#fff', flex: 1 }}>
                                {vendorData.brandName || 'Your Brand'}
                            </Text>
                            <View
                                style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 25,
                                    backgroundColor: 'rgba(255,107,53,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: '#FF6B35',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="storefront" size={24} color="#FF6B35" />
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Summary Cards with Images */}
                        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                {summaryCards.map((card) => (
                                    <TouchableOpacity
                                        key={card.id}
                                        activeOpacity={0.8}
                                        style={{
                                            width: cardWidth,
                                            height: 160,
                                            borderRadius: 20,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <LinearGradient
                                            colors={card.gradient}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={{ flex: 1 }}
                                        >
                                            <View
                                                style={{
                                                    flex: 1,
                                                    padding: 16,
                                                    justifyContent: 'space-between',
                                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                                    borderWidth: 1,
                                                    borderColor: `${card.color}25`,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: 42,
                                                        height: 42,
                                                        borderRadius: 12,
                                                        backgroundColor: `${card.color}30`,
                                                        borderWidth: 1,
                                                        borderColor: `${card.color}40`,
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <Ionicons name={card.icon as any} size={22} color={card.color} />
                                                </View>
                                                <View>
                                                    <Text
                                                        style={{
                                                            fontSize: 12,
                                                            fontFamily: 'HelveticaNeue-Light',
                                                            color: 'rgba(255,255,255,0.6)',
                                                            letterSpacing: 0.5,
                                                            textTransform: 'uppercase',
                                                            marginBottom: 4,
                                                        }}
                                                    >
                                                        {card.label}
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 28,
                                                            fontFamily: 'HelveticaNeue-Thin',
                                                            color: '#fff',
                                                        }}
                                                    >
                                                        {card.value}
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Best Performing Product with Image */}
                        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: 'HelveticaNeue-Light',
                                    color: 'rgba(255,255,255,0.5)',
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    marginBottom: 16,
                                }}
                            >
                                Best Performing
                            </Text>
                            <TouchableOpacity activeOpacity={0.9}>
                                <View
                                    style={{
                                        borderRadius: 20,
                                        overflow: 'hidden',
                                        height: 200,
                                    }}
                                >
                                    <ImageBackground
                                        source={require('../../../assets/pictures/shop.jpeg')}
                                        style={{ width: '100%', height: '100%' }}
                                        imageStyle={{ opacity: 0.4 }}
                                    >
                                        <LinearGradient
                                            colors={['rgba(255,107,53,0.3)', 'rgba(60,0,8,0.95)']}
                                            style={{ flex: 1, padding: 20, justifyContent: 'flex-end' }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                                <View
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 14,
                                                        backgroundColor: '#FFD700',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: 10,
                                                    }}
                                                >
                                                    <Ionicons name="trophy" size={16} color="#000" />
                                                </View>
                                                <Text
                                                    style={{
                                                        fontSize: 20,
                                                        fontFamily: 'HelveticaNeue-Light',
                                                        color: '#fff',
                                                    }}
                                                >
                                                    Classic Denim Jacket
                                                </Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 24 }}>
                                                <View>
                                                    <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Sales
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                        145
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Revenue
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                                                        $4,350
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </ImageBackground>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Quick Actions */}
                        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontFamily: 'HelveticaNeue-Light',
                                    color: 'rgba(255,255,255,0.5)',
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    marginBottom: 16,
                                }}
                            >
                                Quick Actions
                            </Text>
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => router.push('/screens/vendor/inventory')}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,107,53,0.3)',
                                        borderRadius: 16,
                                        padding: 18,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(255,107,53,0.15)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 14,
                                            }}
                                        >
                                            <Ionicons name="add-circle-outline" size={24} color="#FF6B35" />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                                Add New Product
                                            </Text>
                                            <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                                Expand your inventory
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.push('/screens/vendor/ads')}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: 16,
                                        padding: 18,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(255,255,255,0.08)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 14,
                                            }}
                                        >
                                            <Ionicons name="rocket-outline" size={24} color="rgba(255,255,255,0.7)" />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                                Create Ad Campaign
                                            </Text>
                                            <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                                Boost your visibility
                                            </Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>

                <VendorNav active="dashboard" />
            </LinearGradient>
        </View>
    );
};

export default VendorDashboard;
