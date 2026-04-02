import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../src/lib/apiClient';

type BrandType = 'local' | 'startup' | 'established' | 'corporation';

const categories = [
    'Men\'s Fashion',
    'Women\'s Fashion',
    'Kids Fashion',
    'Accessories',
    'Footwear',
    'Sportswear',
];

const VendorRegistration = () => {
    const [step, setStep] = useState(1);
    const [apiError, setApiError] = useState<string | null>(null);

    // Form state
    const [brandName, setBrandName] = useState('');
    const [brandType, setBrandType] = useState<BrandType | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [instagram, setInstagram] = useState('');
    const [website, setWebsite] = useState('');

    const brandTypes: { value: BrandType; label: string; description: string }[] = [
        { value: 'local', label: 'Local Brand', description: 'Small local business' },
        { value: 'startup', label: 'Startup', description: 'Growing fashion brand' },
        { value: 'established', label: 'Established Brand', description: 'Well-known brand' },
        { value: 'corporation', label: 'Large Corporation', description: 'Major fashion company' },
    ];

    const registerMutation = useMutation({
        mutationFn: (body: any) => apiClient.post('/vendors/register', body),
        onSuccess: () => router.replace({
            pathname: '/vendor-pending' as any,
            params: { shopName: brandName },
        }),
        onError: (err: any) => setApiError(err.response?.data?.error ?? 'Registration failed. Please try again.'),
    });

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter((c) => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

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
            brand_name: brandName,
            brand_type: brandType,
            categories: selectedCategories,
            description,
            contact_email: contactEmail,
            instagram,
            website,
        });
    };

    const canProceed = () => {
        if (step === 1) return brandName && brandType;
        if (step === 2) return selectedCategories.length > 0 && description;
        if (step === 3) return contactEmail;
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
                        {/* Step 1: Brand Info */}
                        {step === 1 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Brand Information
                                </Text>
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                                    Tell us about your brand
                                </Text>

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Brand Name*
                                </Text>
                                <TextInput
                                    value={brandName}
                                    onChangeText={setBrandName}
                                    placeholder="Enter your brand name"
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
                                    Brand Type*
                                </Text>
                                {brandTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.value}
                                        onPress={() => setBrandType(type.value)}
                                        style={{
                                            backgroundColor: brandType === type.value ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.05)',
                                            borderWidth: 1,
                                            borderColor: brandType === type.value ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                                            borderRadius: 16,
                                            padding: 16,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontFamily: 'HelveticaNeue-Bold', color: brandType === type.value ? '#FF6B35' : '#fff' }}>
                                                    {type.label}
                                                </Text>
                                                <Text style={{ fontSize: 13, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                                                    {type.description}
                                                </Text>
                                            </View>
                                            {brandType === type.value && (
                                                <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Step 2: Categories & Description */}
                        {step === 2 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Categories & Description
                                </Text>
                                <Text style={{ fontSize: 15, fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
                                    What do you sell?
                                </Text>

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 12 }}>
                                    Product Categories*
                                </Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                                    {categories.map((category) => (
                                        <TouchableOpacity
                                            key={category}
                                            onPress={() => toggleCategory(category)}
                                            style={{
                                                backgroundColor: selectedCategories.includes(category) ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                                                borderWidth: 1,
                                                borderColor: selectedCategories.includes(category) ? '#FF6B35' : 'rgba(255,255,255,0.2)',
                                                borderRadius: 20,
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                            }}
                                        >
                                            <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue', color: '#fff' }}>
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Brand Description*
                                </Text>
                                <TextInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Tell customers about your brand..."
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    multiline
                                    numberOfLines={6}
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
                                        height: 140,
                                    }}
                                />
                            </View>
                        )}

                        {/* Step 3: Contact Info */}
                        {step === 3 && (
                            <View>
                                <Text style={{ fontSize: 24, fontFamily: 'HelveticaNeue-Bold', color: '#fff', marginBottom: 8 }}>
                                    Contact Information
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
                                    placeholder="brand@example.com"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
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

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Instagram (Optional)
                                </Text>
                                <TextInput
                                    value={instagram}
                                    onChangeText={setInstagram}
                                    placeholder="@yourbrand"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    autoCapitalize="none"
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

                                <Text style={{ fontSize: 14, fontFamily: 'HelveticaNeue-Medium', color: '#fff', marginBottom: 8 }}>
                                    Website (Optional)
                                </Text>
                                <TextInput
                                    value={website}
                                    onChangeText={setWebsite}
                                    placeholder="https://yourbrand.com"
                                    placeholderTextColor="rgba(255,255,255,0.4)"
                                    keyboardType="url"
                                    autoCapitalize="none"
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
