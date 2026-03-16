import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import VendorNav from '../components/VendorNav';

const VendorAds = () => {
    const activeCampaigns = [
        {
            id: 'c1',
            name: 'Summer Collection Launch',
            products: 5,
            impressions: '12.5K',
            clicks: 842,
            status: 'active',
            budget: '$500',
            image: require('../../assets/pictures/shop.jpeg'),
        },
        {
            id: 'c2',
            name: 'Clearance Sale',
            products: 3,
            impressions: '8.2K',
            clicks: 567,
            status: 'active',
            budget: '$300',
            image: require('../../assets/pictures/social2.jpeg'),
        },
    ];

    const aiCampaigns = [
        {
            id: 'ai1',
            name: 'AI - Popular Products',
            products: 4,
            impressions: '18.3K',
            clicks: 1245,
            image: require('../../assets/pictures/wardrobe.jpeg'),
        },
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
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                    Manage
                                </Text>
                                <Text style={{ fontSize: 32, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 2 }}>
                                    Campaigns
                                </Text>
                            </View>
                            <TouchableOpacity
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
                                    Create
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* AI-Generated Campaigns */}
                        <View style={{ marginBottom: 32 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: 'rgba(255,215,0,0.2)',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 10,
                                    }}
                                >
                                    <Ionicons name="sparkles" size={14} color="#FFD700" />
                                </View>
                                <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                    AI-Powered Campaigns
                                </Text>
                            </View>

                            {aiCampaigns.map((campaign) => (
                                <View
                                    key={campaign.id}
                                    style={{
                                        borderRadius: 18,
                                        overflow: 'hidden',
                                        marginBottom: 14,
                                        height: 160,
                                    }}
                                >
                                    <ImageBackground
                                        source={campaign.image}
                                        style={{ width: '100%', height: '100%' }}
                                        imageStyle={{ opacity: 0.3 }}
                                    >
                                        <LinearGradient
                                            colors={['rgba(255,215,0,0.25)', 'rgba(60,0,8,0.9)']}
                                            style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue', color: '#fff', marginBottom: 6 }}>
                                                        {campaign.name}
                                                    </Text>
                                                    <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        {campaign.products} products • Automated
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Impressions
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                        {campaign.impressions}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Clicks
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FFD700', marginTop: 4 }}>
                                                        {campaign.clicks}
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </ImageBackground>
                                </View>
                            ))}
                        </View>

                        {/* Your Campaigns */}
                        <View>
                            <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                                Your Campaigns
                            </Text>

                            {activeCampaigns.map((campaign) => (
                                <TouchableOpacity
                                    key={campaign.id}
                                    activeOpacity={0.8}
                                    style={{
                                        borderRadius: 18,
                                        overflow: 'hidden',
                                        marginBottom: 14,
                                        height: 160,
                                    }}
                                >
                                    <ImageBackground
                                        source={campaign.image}
                                        style={{ width: '100%', height: '100%' }}
                                        imageStyle={{ opacity: 0.3 }}
                                    >
                                        <LinearGradient
                                            colors={['rgba(255,107,53,0.2)', 'rgba(60,0,8,0.9)']}
                                            style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}
                                        >
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue', color: '#fff', marginBottom: 6 }}>
                                                        {campaign.name}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: '#4CAF50',
                                                                marginRight: 6,
                                                            }}
                                                        />
                                                        <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {campaign.products} products • {campaign.budget}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Impressions
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                        {campaign.impressions}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Clicks
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                                                        {campaign.clicks}
                                                    </Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
                                    </ImageBackground>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>

                <VendorNav active="ads" />
            </LinearGradient>
        </View>
    );
};

export default VendorAds;
