import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import VendorNav from '../components/VendorNav';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { router } from 'expo-router';

const VendorAds = () => {
    const { data, isLoading } = useQuery({
        queryKey: ['vendor-campaigns'],
        queryFn: () => apiClient.get('/campaigns/me').then((r) => r.data),
    });

    const campaigns: any[] = data?.campaigns ?? [];
    const aiCampaigns = campaigns.filter((c) => c.type === 'ai');
    const activeCampaigns = campaigns.filter((c) => c.type !== 'ai');

    const formatCompact = (n: number) => {
        if (!Number.isFinite(n)) return '0';
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return String(n);
    };

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
                                onPress={() => router.push('/vendor/campaign-create' as any)}
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

                            {isLoading ? (
                                <View style={{ height: 140, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator color="rgba(255,107,53,0.6)" />
                                </View>
                            ) : aiCampaigns.length === 0 ? (
                                <View style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 }}>
                                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)' }}>
                                        No AI campaigns yet.
                                    </Text>
                                    <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                                        AI campaigns will appear here once the recommendation models are live.
                                    </Text>
                                </View>
                            ) : aiCampaigns.map((campaign) => (
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
                                        source={campaign.cover_image_url ? { uri: campaign.cover_image_url } : require('../../assets/pictures/wardrobe.jpeg')}
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
                                                        {campaign.title}
                                                    </Text>
                                                    <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        {(campaign.products?.length ?? 0)} products • Automated
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={{ flexDirection: 'row', gap: 20 }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Impressions
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#fff', marginTop: 4 }}>
                                                        {formatCompact(Number(campaign.impressions ?? 0))}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Clicks
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FFD700', marginTop: 4 }}>
                                                        {formatCompact(Number(campaign.product_clicks ?? 0))}
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

                            {isLoading ? (
                                <View style={{ height: 140, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
                                    <ActivityIndicator color="rgba(255,107,53,0.6)" />
                                </View>
                            ) : activeCampaigns.length === 0 ? (
                                <View style={{ borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 18 }}>
                                    <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.65)' }}>
                                        No campaigns yet.
                                    </Text>
                                    <Text style={{ fontSize: 12, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                                        Tap Create to launch a collection campaign.
                                    </Text>
                                </View>
                            ) : activeCampaigns.map((campaign) => (
                                <TouchableOpacity
                                    key={campaign.id}
                                    activeOpacity={0.8}
                                    onPress={() => router.push(`/vendor/campaign-create?id=${campaign.id}` as any)}
                                    style={{
                                        borderRadius: 18,
                                        overflow: 'hidden',
                                        marginBottom: 14,
                                        height: 160,
                                    }}
                                >
                                    <ImageBackground
                                        source={campaign.cover_image_url ? { uri: campaign.cover_image_url } : require('../../assets/pictures/shop.jpeg')}
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
                                                        {campaign.title}
                                                    </Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View
                                                            style={{
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: campaign.status === 'active' ? '#4CAF50' : '#FF9800',
                                                                marginRight: 6,
                                                            }}
                                                        />
                                                        <Text style={{ fontSize: 11, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {(campaign.products?.length ?? 0)} products • {String(campaign.status || 'draft').toUpperCase()}
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
                                                        {formatCompact(Number(campaign.impressions ?? 0))}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontSize: 10, fontFamily: 'HelveticaNeue-Light', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                        Clicks
                                                    </Text>
                                                    <Text style={{ fontSize: 22, fontFamily: 'HelveticaNeue-Thin', color: '#FF6B35', marginTop: 4 }}>
                                                        {formatCompact(Number(campaign.product_clicks ?? 0))}
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
