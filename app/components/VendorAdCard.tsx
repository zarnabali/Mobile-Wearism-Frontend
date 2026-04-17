import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface VendorAd {
    id: string;
    brandName: string;
    productName: string;
    productImage: any;
    price: string;
    isVerified: boolean;
}

interface VendorAdCardProps {
    ad: VendorAd;
    onPress?: () => void;
    onShopNow?: () => void;
    onViewMore?: () => void;
}

const VendorAdCard: React.FC<VendorAdCardProps> = ({ ad, onPress, onShopNow, onViewMore }) => {
    return (
        <View style={{ marginBottom: 6 }}>
            {/* Sponsored Label */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="megaphone" size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: 'HelveticaNeue',
                            color: 'rgba(255,255,255,0.5)',
                            letterSpacing: 0.5,
                        }}
                    >
                        SPONSORED
                    </Text>
                </View>
            </View>

            {/* Ad Card Header */}
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LinearGradient
                        colors={['#FF6B35', '#3C0008']}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            padding: 2,
                        }}
                    >
                        <View
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 17,
                                backgroundColor: '#FF6B35',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="storefront" size={20} color="#fff" />
                        </View>
                    </LinearGradient>
                    <View style={{ marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontFamily: 'HelveticaNeue-Bold',
                                    color: '#fff',
                                    marginRight: 4,
                                }}
                            >
                                {ad.brandName}
                            </Text>
                            {ad.isVerified && (
                                <Ionicons name="checkmark-circle" size={16} color="#FF6B35" />
                            )}
                        </View>
                        <Text
                            style={{
                                fontSize: 12,
                                fontFamily: 'HelveticaNeue',
                                color: 'rgba(255,255,255,0.6)',
                            }}
                        >
                            Sponsored
                        </Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Product Image */}
            <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
                <ImageBackground
                    source={ad.productImage}
                    style={{ width: '100%', height: 420 }}
                    imageStyle={{ opacity: 0.96 }}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
                        style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                    >
                        <View
                            style={{
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: 16,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(255,107,53,0.3)',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontFamily: 'HelveticaNeue-Bold',
                                    color: '#fff',
                                    marginBottom: 4,
                                }}
                            >
                                {ad.productName}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 22,
                                    fontFamily: 'HelveticaNeue-Bold',
                                    color: '#FF6B35',
                                }}
                            >
                                {ad.price}
                            </Text>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>

            {/* Ad Actions */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={onShopNow ?? onPress}
                        disabled={!onShopNow && !onPress}
                        style={{
                            flex: 1,
                            backgroundColor: '#FF6B35',
                            borderRadius: 12,
                            paddingVertical: 12,
                            alignItems: 'center',
                            opacity: (!onShopNow && !onPress) ? 0.5 : 1,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>
                            Shop Now
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onViewMore}
                        disabled={!onViewMore}
                        style={{
                            flex: 1,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.2)',
                            paddingVertical: 12,
                            alignItems: 'center',
                            opacity: onViewMore ? 1 : 0.5,
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>
                            View More
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default VendorAdCard;
