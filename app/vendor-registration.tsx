import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../src/lib/apiClient';
import { useVendor } from './contexts/VendorContext';

const VendorRegistration = () => {
    const [step, setStep] = useState(1);
    const [apiError, setApiError] = useState<string | null>(null);
    const qc = useQueryClient();
    const { setVendorMode } = useVendor();

    // Form state
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');

    const registerMutation = useMutation({
        mutationFn: (body: any) => apiClient.post('/vendors/register', body).then(r => r.data),
        onSuccess: async (res: any) => {
            // Ensure VendorContext refreshes and default to vendor mode
            await qc.invalidateQueries({ queryKey: ['vendor-me'] });
            setVendorMode(true);

            // With auto-approval, this should redirect almost immediately.
            const nameForPending = res?.vendor?.shop_name ?? shopName;
            router.replace({
                pathname: '/vendor-pending' as any,
                params: { shopName: nameForPending },
            });
        },
        onError: (err: any) => setApiError(err.response?.data?.error ?? 'Registration failed. Please try again.'),
    });

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.back();
        }
    };

    const handleComplete = () => {
        setApiError(null);
        registerMutation.mutate({
            shop_name: shopName,
            shop_description: shopDescription || undefined,
            contact_email: contactEmail,
            contact_phone: contactPhone || undefined,
            business_address: businessAddress || undefined,
        });
    };

    const canProceed = () => {
        if (step === 1) return shopName.trim().length >= 2;
        if (step === 2) return contactEmail.trim().length > 0;
        if (step === 3) return true;
        return false;
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <LinearGradient
                colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 18, fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>
                            Register as Vendor
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Progress Indicator */}
                    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[1, 2, 3].map((i) => (
                                <View
                                    key={i}
                                    style={{
                                        flex: 1,
                                        height: 3,
                                        borderRadius: 2,
                                        backgroundColor: i <= step ? '#FF6B35' : 'rgba(255,255,255,0.2)',
                                    }}
                                />
                            ))}
                        </View>
                        <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                            Step {step} of 3
                        </Text>
                    </View>

                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                        {/* Step 1: Shop Info */}
                        {step === 1 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Shop Information
                                </Text>
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                                    Set up your shop profile
                                </Text>

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Shop Name*
                                </Text>
                                <TextInput
                                    value={shopName}
                                    onChangeText={setShopName}
                                    placeholder="e.g. Test Boutique"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    style={{ paddingVertical: 0, 
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'HelveticaNeue',
                                        marginBottom: 24,
                                    }}
                                />

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 12 }}>
                                    Description (Optional)
                                </Text>
                                <TextInput
                                    value={shopDescription}
                                    onChangeText={setShopDescription}
                                    placeholder="Test shop for QA"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    style={{
                                        paddingVertical: 0,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'HelveticaNeue',
                                        height: 130,
                                    }}
                                />
                            </View>
                        )}

                        {/* Step 2: Contact */}
                        {step === 2 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Contact
                                </Text>
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                                    How can customers reach you?
                                </Text>
                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Contact Email*
                                </Text>
                                <TextInput
                                    value={contactEmail}
                                    onChangeText={setContactEmail}
                                    placeholder="vendor@wearism.test"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{
                                        paddingVertical: 0,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'HelveticaNeue',
                                        marginBottom: 24,
                                    }}
                                />

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Phone (Optional)
                                </Text>
                                <TextInput
                                    value={contactPhone}
                                    onChangeText={setContactPhone}
                                    placeholder="+92300000000"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    keyboardType="phone-pad"
                                    style={{
                                        paddingVertical: 0,
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'HelveticaNeue',
                                    }}
                                />
                            </View>
                        )}

                        {/* Step 3: Business Address */}
                        {step === 3 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Business Address
                                </Text>
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                                    Where is your shop based?
                                </Text>
                                <TextInput
                                    value={businessAddress}
                                    onChangeText={setBusinessAddress}
                                    placeholder="123 Test St Lahore"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    style={{ paddingVertical: 0, 
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: 16,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        color: '#fff',
                                        fontSize: 16,
                                        fontFamily: 'HelveticaNeue',
                                        height: 120,
                                    }}
                                />
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer Buttons */}
                    <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                        {apiError && (
                            <View style={{ backgroundColor: 'rgba(255,60,60,0.12)', borderWidth: 1, borderColor: 'rgba(255,60,60,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="alert-circle-outline" size={16} color="#FF4040" style={{ marginRight: 8 }} />
                                <Text style={{ fontFamily: 'HelveticaNeue', color: '#FF4040', fontSize: 13, flex: 1 }}>
                                    {apiError}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={step === 3 ? handleComplete : handleNext}
                            disabled={!canProceed() || registerMutation.isPending}
                            style={{
                                backgroundColor: (canProceed() && !registerMutation.isPending) ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                                borderRadius: 16,
                                paddingVertical: 16,
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                                shadowColor: '#FF6B35',
                                shadowOpacity: (canProceed() && !registerMutation.isPending) ? 0.3 : 0,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: (canProceed() && !registerMutation.isPending) ? 8 : 0,
                            }}
                        >
                            {registerMutation.isPending ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={{ fontSize: 17, fontFamily: 'HelveticaNeue-Bold', color: '#fff' }}>
                                    {step === 3 ? 'Complete Registration' : 'Continue'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

export default VendorRegistration;
