import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

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
        <View className="mx-3 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
            {/* Ad Card Header */}
            <View className="px-4 py-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                    <LinearGradient
                        colors={[COLORS.primary, '#FF9F6A']}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            padding: 1.5,
                        }}
                    >
                        <View className="flex-1 rounded-full bg-black items-center justify-center">
                            <Ionicons name="storefront" size={16} color={COLORS.primary} />
                        </View>
                    </LinearGradient>
                    <View className="ml-3">
                        <View className="flex-row items-center">
                            <Text className="text-white text-[14px] font-h-bold mr-1">
                                {ad.brandName}
                            </Text>
                            {ad.isVerified && (
                                <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                            )}
                        </View>
                        <Text className="text-white/40 text-[11px] font-h-light">
                            Sponsored
                        </Text>
                    </View>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
            </View>

            {/* Product Image */}
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <ImageBackground
                    source={ad.productImage}
                    style={{ width: '100%', height: 380 }}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                        style={{ flex: 1, justifyContent: 'flex-end', padding: 16 }}
                    >
                        <View className="flex-row items-end justify-between">
                            <View className="flex-1 mr-4">
                                <Text className="text-white text-[18px] font-h-bold mb-1" numberOfLines={1}>
                                    {ad.productName}
                                </Text>
                                <Text className="text-primary text-[20px] font-h-heavy">
                                    {ad.price}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={onShopNow ?? onPress}
                                className="bg-primary px-6 py-2.5 rounded-full"
                                activeOpacity={0.8}
                            >
                                <Text className="text-white text-[14px] font-h-bold">
                                    Shop Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>

            {/* View More Link */}
            {onViewMore && (
                <TouchableOpacity 
                    onPress={onViewMore}
                    className="py-3 items-center border-t border-white/5"
                    activeOpacity={0.7}
                >
                    <Text className="text-white/60 text-[13px] font-h-medium">
                        View Store Profile
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default VendorAdCard;
