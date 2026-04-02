import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VendorPendingScreen() {
  const router = useRouter();
  const { shopName } = useLocalSearchParams<{ shopName?: string }>();

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 32 }}>
          {/* Content */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* Icon */}
            <View style={{
              width: 96, height: 96, borderRadius: 48,
              backgroundColor: 'rgba(255,107,53,0.15)',
              borderWidth: 1.5, borderColor: 'rgba(255,107,53,0.35)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 28,
              shadowColor: '#FF6B35', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
            }}>
              <Ionicons name="time-outline" size={48} color="#FF6B35" />
            </View>

            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 28, textAlign: 'center', marginBottom: 12 }}>
              Application Under Review
            </Text>

            <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.55)', fontSize: 15, textAlign: 'center', lineHeight: 23, marginBottom: 36 }}>
              Thanks for applying to become a Wearism Vendor! Our team is reviewing your details and will notify you once your shop is approved.
            </Text>

            {/* Status card */}
            <View style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 16 }}>
                  {shopName || 'Your Brand'}
                </Text>
                <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 3 }}>
                  Vendor Registration
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,107,53,0.15)',
                borderWidth: 1, borderColor: 'rgba(255,107,53,0.4)',
                borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
              }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Pending
                </Text>
              </View>
            </View>

            {/* Steps */}
            <View style={{ width: '100%', marginTop: 28, gap: 10 }}>
              {[
                { icon: 'checkmark-circle', color: '#4CAF50', label: 'Application submitted' },
                { icon: 'ellipse-outline', color: '#FF9800', label: 'Under review by our team' },
                { icon: 'ellipse-outline', color: 'rgba(255,255,255,0.25)', label: 'Approval & shop activation' },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={step.icon as any} size={20} color={step.color} />
                  <Text style={{ fontFamily: i === 1 ? 'HelveticaNeue-Medium' : 'HelveticaNeue', color: i === 2 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Footer button */}
          <TouchableOpacity
            onPress={() => router.replace('/home' as any)}
            style={{ backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#FF6B35', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 17 }}>Return to Home</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
