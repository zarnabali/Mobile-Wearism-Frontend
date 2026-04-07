import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVendor } from './contexts/VendorContext';
import { useAuthStore } from '../src/stores/authStore';
import * as WebBrowser from 'expo-web-browser';
import { apiClient } from '../src/lib/apiClient';

interface SettingsProps {
    visible: boolean;
    onClose: () => void;
}

const settingsOptions = [
    { id: 'edit', icon: 'person-outline', label: 'Edit Profile' },
    { id: 'privacy', icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
    { id: 'gdpr', icon: 'download-outline', label: 'GDPR Data Export' },
    { id: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
    { id: 'saved', icon: 'bookmark-outline', label: 'Saved Items' },
    { id: 'orders', icon: 'bag-outline', label: 'Orders' },
    { id: 'help', icon: 'help-circle-outline', label: 'Help & Support' },
];

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
    const { vendorData, isVendorMode, setVendorMode } = useVendor();

    const handleVendorRegistration = () => {
        onClose();
        router.push('/vendor-registration');
    };

    const handleVendorDashboard = () => {
        onClose();
        setVendorMode(true);
        router.push('/vendor/dashboard' as any);
    };

    const handleOptionPress = async (id: string) => {
        switch (id) {
            case 'edit':
                onClose();
                router.push('/profile/edit');
                break;
            case 'orders':
                onClose();
                router.push('/orders/buyer' as any);
                break;
            case 'privacy':
                WebBrowser.openBrowserAsync('https://wearism.ai/privacy');
                break;
            case 'gdpr':
                try {
                    const { data } = await apiClient.get('/auth/me/data');
                    await Share.share({
                        message: JSON.stringify(data, null, 2),
                        title: 'Your Wearism Data',
                    });
                } catch (err) {
                    Alert.alert('Export Failed', 'Could not fetch your data.');
                }
                break;
        }
    };

    const handleSwitchMode = () => {
        const newMode = !isVendorMode;
        setVendorMode(newMode);
        onClose();
        setTimeout(() => {
            if (newMode) {
                router.push('/vendor/dashboard' as any);
            } else {
                router.push('/home');
            }
        }, 100);
    };

    const handleLogout = async () => {
        try {
            await useAuthStore.getState().logout();
            onClose();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete('/auth/account');
                            // logout() clears SecureStore tokens + Zustand state
                            await useAuthStore.getState().logout();
                            onClose();
                        } catch (err) {
                            Alert.alert('Error', 'Could not delete account.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                    style={{ flex: 0.15 }}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View
                    style={{
                        flex: 0.85,
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        overflow: 'hidden',
                    }}
                >
                    <LinearGradient
                        colors={['rgba(60, 0, 8, 0.98)', 'rgba(30, 0, 4, 0.98)']}
                        style={{ flex: 1 }}
                    >
                        <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                                {/* Header */}
                                <View style={{ padding: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text
                                            style={{
                                                fontSize: 28,
                                                fontFamily: 'HelveticaNeue-Bold',
                                                color: '#fff',
                                            }}
                                        >
                                            Settings
                                        </Text>
                                        <TouchableOpacity
                                            onPress={onClose}
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 18,
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="close" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Settings Options */}
                                <View style={{ padding: 20 }}>
                                    {settingsOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.id}
                                            onPress={() => handleOptionPress(option.id)}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 16,
                                                borderBottomWidth: 0.5,
                                                borderBottomColor: 'rgba(255,255,255,0.05)',
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <View
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 12,
                                                    backgroundColor: 'rgba(255,255,255,0.08)',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: 16,
                                                }}
                                            >
                                                <Ionicons name={option.icon as any} size={22} color="rgba(255,255,255,0.7)" />
                                            </View>
                                            <Text
                                                style={{
                                                    flex: 1,
                                                    fontSize: 16,
                                                    fontFamily: 'HelveticaNeue',
                                                    color: '#fff',
                                                }}
                                            >
                                                {option.label}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                                        </TouchableOpacity>
                                    ))}

                                    {/* Vendor Section */}
                                    <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                                        {!vendorData.isVendor ? (
                                            <TouchableOpacity
                                                onPress={handleVendorRegistration}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    backgroundColor: 'rgba(255, 107, 53, 0.15)',
                                                    borderWidth: 1,
                                                    borderColor: '#FF6B35',
                                                    borderRadius: 16,
                                                    padding: 16,
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 12,
                                                        backgroundColor: '#FF6B35',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        marginRight: 16,
                                                    }}
                                                >
                                                    <Ionicons name="storefront" size={22} color="#fff" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            fontFamily: 'HelveticaNeue-Bold',
                                                            color: '#FF6B35',
                                                        }}
                                                    >
                                                        Become a Vendor
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            fontSize: 13,
                                                            fontFamily: 'HelveticaNeue',
                                                            color: 'rgba(255,255,255,0.6)',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        Start selling your products
                                                    </Text>
                                                </View>
                                                <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={{ gap: 12 }}>
                                                <TouchableOpacity
                                                    onPress={handleVendorDashboard}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(255, 107, 53, 0.15)',
                                                        borderWidth: 1,
                                                        borderColor: '#FF6B35',
                                                        borderRadius: 16,
                                                        padding: 16,
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <View
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 12,
                                                            backgroundColor: '#FF6B35',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: 16,
                                                        }}
                                                    >
                                                        <Ionicons name="storefront" size={22} color="#fff" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontFamily: 'HelveticaNeue-Bold',
                                                                color: '#FF6B35',
                                                            }}
                                                        >
                                                            Vendor Dashboard
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                fontFamily: 'HelveticaNeue',
                                                                color: 'rgba(255,255,255,0.6)',
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            Manage your store
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={handleSwitchMode}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                                        borderWidth: 1,
                                                        borderColor: 'rgba(255,255,255,0.12)',
                                                        borderRadius: 16,
                                                        padding: 16,
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <View
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 12,
                                                            backgroundColor: 'rgba(255,255,255,0.08)',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: 16,
                                                        }}
                                                    >
                                                        <Ionicons name="swap-horizontal" size={22} color="rgba(255,255,255,0.85)" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text
                                                            style={{
                                                                fontSize: 16,
                                                                fontFamily: 'HelveticaNeue-Bold',
                                                                color: 'rgba(255,255,255,0.85)',
                                                            }}
                                                        >
                                                            {isVendorMode ? 'Switch to User Mode' : 'Switch to Vendor Mode'}
                                                        </Text>
                                                        <Text
                                                            style={{
                                                                fontSize: 13,
                                                                fontFamily: 'HelveticaNeue',
                                                                color: 'rgba(255,255,255,0.55)',
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {isVendorMode ? 'Browse as a customer' : 'Sell & manage orders'}
                                                        </Text>
                                                    </View>
                                                    <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.6)" />
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    {/* Logout */}
                                    <TouchableOpacity
                                        onPress={handleLogout}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                            marginTop: 20,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(255,59,48,0.15)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 16,
                                            }}
                                        >
                                            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                                        </View>
                                        <Text
                                            style={{
                                                flex: 1,
                                                fontSize: 16,
                                                fontFamily: 'HelveticaNeue',
                                                color: '#FF3B30',
                                            }}
                                        >
                                            Logout
                                        </Text>
                                    </TouchableOpacity>

                                    {/* Delete Account */}
                                    <TouchableOpacity
                                        onPress={handleDeleteAccount}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 16,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 12,
                                                backgroundColor: 'rgba(255,59,48,0.1)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 16,
                                            }}
                                        >
                                            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                                        </View>
                                        <Text
                                            style={{
                                                flex: 1,
                                                fontSize: 16,
                                                fontFamily: 'HelveticaNeue',
                                                color: '#FF3B30',
                                                opacity: 0.8,
                                            }}
                                        >
                                            Delete Account
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </SafeAreaView>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

export default Settings;
