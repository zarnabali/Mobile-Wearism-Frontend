import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const SLOTS = ['upperwear', 'lowerwear', 'outerwear', 'accessories', 'footwear'];
const CONDITIONS = ['new', 'good', 'fair', 'worn'];

export default function ItemEditScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: itemData, isLoading } = useQuery({
    queryKey: ['wardrobe-item', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const item = itemData?.item ?? itemData?.data ?? itemData;

  const [form, setForm] = useState({
    name: '',
    brand: '',
    condition: 'good',
    wardrobe_slot: 'upperwear',
  });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        brand: item.brand || '',
        condition: item.condition || 'good',
        wardrobe_slot: item.wardrobe_slot || 'upperwear',
      });
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: (body: any) => apiClient.patch(`/wardrobe/items/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Update failed.'),
  });

  const handleSave = () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    mutation.mutate(form);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 h-14 border-b border-white/10">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                Edit Item
              </Text>
            </View>
            <TouchableOpacity onPress={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <ActivityIndicator color="#FF6B35" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 16 }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}>
              
              <Text className="text-white/40 text-xs mb-2 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Item Name
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 h-14 mb-6 border border-white/10">
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm({ ...form, name: v })}
                  placeholder="e.g. Vintage Denim Jacket"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                />
              </View>

              <Text className="text-white/40 text-xs mb-2 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Brand (Optional)
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 h-14 mb-6 border border-white/10">
                <TextInput
                  value={form.brand}
                  onChangeText={(v) => setForm({ ...form, brand: v })}
                  placeholder="e.g. Levi's"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 0,  paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                />
              </View>

              <Text className="text-white/40 text-xs mb-3 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Category Slot
              </Text>
              <View className="flex-row flex-wrap mb-6">
                {SLOTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm({ ...form, wardrobe_slot: s })}
                    className={`px-4 h-11 rounded-full mr-2 mb-2 border ${
                      form.wardrobe_slot === s ? 'bg-[#FF6B35] border-[#FF6B35]' : 'bg-white/5 border-white/10'
                    }`}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className={`capitalize text-sm ${form.wardrobe_slot === s ? 'text-white font-bold' : 'text-white/60'}`} style={{ fontFamily: 'HelveticaNeue' }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-white/40 text-xs mb-3 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Condition
              </Text>
              <View className="flex-row flex-wrap mb-6">
                {CONDITIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setForm({ ...form, condition: c })}
                    className={`px-4 h-11 rounded-full mr-2 mb-2 border ${
                      form.condition === c ? 'bg-[#FF6B35] border-[#FF6B35]' : 'bg-white/5 border-white/10'
                    }`}
                    style={{ alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className={`capitalize text-sm ${form.condition === c ? 'text-white font-bold' : 'text-white/60'}`} style={{ fontFamily: 'HelveticaNeue' }}>
                      {c.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
