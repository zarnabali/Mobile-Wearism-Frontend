import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useVendor } from '../contexts/VendorContext';

type VendorTab = 'dashboard' | 'inventory' | 'ads' | 'analytics' | 'profile';

const vendorTabs = [
    { key: 'dashboard', icon: 'grid', label: 'Dashboard', href: '/screens/vendor/dashboard' },
    { key: 'inventory', icon: 'cube', label: 'Inventory', href: '/screens/vendor/inventory' },
    { key: 'ads', icon: 'megaphone', label: 'Ads', href: '/screens/vendor/ads' },
    { key: 'analytics', icon: 'stats-chart', label: 'Analytics', href: '/screens/vendor/analytics' },
    { key: 'profile', icon: 'person', label: 'Profile', href: '/profile' },
];

interface VendorNavProps {
    active: VendorTab;
}

const VendorNav: React.FC<VendorNavProps> = ({ active }) => {
    const { setVendorMode } = useVendor();

    return (
        <View className="absolute bottom-0 left-0 right-0 pb-5 px-6">
            <LinearGradient
                colors={['rgba(255,107,53,0.15)', 'rgba(255,107,53,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    borderRadius: 24,
                    borderWidth: 0.5,
                    borderColor: '#FF6B35',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(20px)',
                    shadowColor: '#FF6B35',
                    shadowOpacity: 0.3,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 10,
                }}
            >
                {/* Vendor Tabs */}
                {vendorTabs.map((tab) => {
                    const isActive = tab.key === active;
                    return (
                        <Link key={tab.key} href={tab.href} asChild>
                            <TouchableOpacity
                                className="items-center justify-center"
                                activeOpacity={0.6}
                                style={{
                                    paddingVertical: 6,
                                    paddingHorizontal: 8,
                                }}
                            >
                                <Ionicons
                                    name={`${tab.icon}${isActive ? '' : '-outline'}` as any}
                                    size={20}
                                    color={isActive ? '#FF6B35' : 'rgba(255,255,255,0.65)'}
                                    style={{ marginBottom: 2 }}
                                />
                                <Text
                                    className="text-[9px]"
                                    style={{
                                        fontFamily: 'HelveticaNeue',
                                        color: isActive ? '#FF6B35' : 'rgba(255,255,255,0.65)',
                                        letterSpacing: 0.3,
                                    }}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        </Link>
                    );
                })}
            </LinearGradient>
        </View>
    );
};

export default VendorNav;
