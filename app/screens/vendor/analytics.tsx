import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import VendorNav from '../../components/VendorNav';

const VendorAnalytics = () => {
    const overallStats = [
        { label: 'Total Sales', value: '$12,543', change: '+18%', positive: true, icon: 'cash-outline' },
        { label: 'Total Engagement', value: '45.2K', change: '+24%', positive: true, icon: 'heart-outline' },
        { label: 'Conversion Rate', value: '6.8%', change: '+1.2%', positive: true, icon: 'trending-up-outline' },
    ];

    const productPerformance = [
        { name: 'Classic Denim Jacket', views: '8.2K', clicks: 1245, saves: 324, purchases: 145, image: require('../../../assets/pictures/shop.jpeg') },
        { name: 'Casual White Sneakers', views: '5.1K', clicks: 892, saves: 198, purchases: 89, image: require('../../../assets/pictures/shop2.jpeg') },
        { name: 'Summer Floral Dress', views: '4.3K', clicks: 756, saves: 167, purchases: 67, image: require('../../../assets/pictures/wardrobe.jpeg') },
    ];

    const ageGroups = [
        { age: '13-19', label: 'Teens', percentage: 35, color: '#E91E63' },
        { age: '20-30', label: 'Young Adults', percentage: 45, color: '#FF6B35' },
        { age: '30+', label: 'Adults', percentage: 20, color: '#2196F3' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <LinearGradient
                colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
                        <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                            Performance
                        </Text>
                        <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>
                            Analytics
                        </Text>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Overall Performance */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                                Overview
                            </Text>
                            {overallStats.map((stat, index) => (
                                <View
                                    key={index}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.08)',
                                        padding: 18,
                                        marginBottom: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                >
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
                                        <Ionicons name={stat.icon as any} size={22} color="rgba(255,255,255,0.7)" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {stat.label}
                                        </Text>
                                        <Text style={{ fontSize: 26, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>
                                            {stat.value}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            backgroundColor: stat.positive ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
                                            borderRadius: 10,
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Ionicons
                                            name={stat.positive ? 'trending-up' : 'trending-down'}
                                            size={14}
                                            color={stat.positive ? '#4CAF50' : '#F44336'}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text
                                            style={{
                                                fontSize: 13,
                                                fontFamily: 'HelveticaNeue',
                                                color: stat.positive ? '#4CAF50' : '#F44336',
                                            }}
                                        >
                                            {stat.change}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Product Performance */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                                Product Performance
                            </Text>
                            {productPerformance.map((product, index) => (
                                <View
                                    key={index}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.08)',
                                        marginBottom: 12,
                                        flexDirection: 'row',
                                        overflow: 'hidden',
                                        height: 140,
                                    }}
                                >
                                    <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
                                        <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                            {product.name}
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                            <View style={{ minWidth: '45%' }}>
                                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Views
                                                </Text>
                                                <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                    {product.views}
                                                </Text>
                                            </View>
                                            <View style={{ minWidth: '45%' }}>
                                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Clicks
                                                </Text>
                                                <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                    {product.clicks}
                                                </Text>
                                            </View>
                                            <View style={{ minWidth: '45%' }}>
                                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Saves
                                                </Text>
                                                <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                    {product.saves}
                                                </Text>
                                            </View>
                                            <View style={{ minWidth: '45%' }}>
                                                <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                    Purchases
                                                </Text>
                                                <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                                                    {product.purchases}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    {/* Product Image - Centered */}
                                    <View style={{ justifyContent: 'center', alignItems: 'center' }} className='pr-4 overflow-hidden'>
                                        <Image
                                            source={product.image}
                                            style={{
                                                width: 120,
                                                height: '80%',
                                            }}
                                            className='rounded-2xl'
                                            resizeMode="cover"
                                        />
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Age Group Insights */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                                Audience Demographics
                            </Text>
                            <View
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    padding: 18,
                                }}
                            >
                                {ageGroups.map((group, index) => (
                                    <View key={index} style={{ marginBottom: index < ageGroups.length - 1 ? 20 : 0 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                                {group.label} ({group.age})
                                            </Text>
                                            <Text style={{ fontSize: 20, fontFamily: 'HelveticaNeue-Thin', color: group.color }}>
                                                {group.percentage}%
                                            </Text>
                                        </View>
                                        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                            <View style={{ width: `${group.percentage}%`, height: '100%', backgroundColor: group.color, borderRadius: 3 }} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Ad Comparison */}
                        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                                Campaign Performance
                            </Text>
                            <View style={{ gap: 12 }}>
                                <View
                                    style={{
                                        backgroundColor: 'rgba(255,215,0,0.1)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,215,0,0.2)',
                                        padding: 18,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                        <View
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 14,
                                                backgroundColor: 'rgba(255,215,0,0.2)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 10,
                                            }}
                                        >
                                            <Ionicons name="sparkles" size={16} color="#FFD700" />
                                        </View>
                                        <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                            AI-Generated Ads
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Avg. CTR
                                            </Text>
                                            <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                6.8%
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Conversions
                                            </Text>
                                            <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FFD700', marginTop: 4 }}>
                                                342
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        borderRadius: 16,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.08)',
                                        padding: 18,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                                        <View
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 14,
                                                backgroundColor: 'rgba(255,107,53,0.2)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 10,
                                            }}
                                        >
                                            <Ionicons name="megaphone" size={16} color="#FF6B35" />
                                        </View>
                                        <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                            Your Custom Ads
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Avg. CTR
                                            </Text>
                                            <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                5.2%
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                Conversions
                                            </Text>
                                            <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                                                267
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>

                <VendorNav active="analytics" />
            </LinearGradient>
        </View>
    );
};

export default VendorAnalytics;
