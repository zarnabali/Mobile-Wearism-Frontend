import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const OCCASIONS = ['casual', 'work', 'night_out', 'sports', 'formal'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter', 'all_season'];

export default function OutfitCreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [season, setSeason] = useState(SEASONS[4]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Fetch Items ────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['wardrobe-items'],
    queryFn: () => apiClient.get('/wardrobe/items?limit=100').then(r => r.data),
  });

  const items: any[] = data?.items ?? data?.data ?? data ?? [];

  // Group by slot
  const slots = ['upperwear', 'lowerwear', 'outerwear', 'accessories', 'footwear'];

  // Toggle selection
  const toggleSelection = (itemId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  // ─── Mutation ───────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => apiClient.post('/wardrobe/outfits', {
      name: name || undefined,
      occasion,
      season,
      item_ids: Array.from(selectedIds),
      status: 'saved',
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      const oid = res.data?.outfit?.id ?? res.data?.id;
      if (oid) {
        router.replace(`/wardrobe/outfit-detail?id=${oid}` as any);
      } else {
        router.back();
      }
    },
    onError: (err: any) => {
      Alert.alert('Creation Failed', err.response?.data?.error ?? 'Could not create outfit.');
    },
  });

  const handleCreate = () => {
    if (selectedIds.size === 0) return Alert.alert('Missing Items', 'Select at least one item to create an outfit.');
    createMutation.mutate();
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
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 h-14 border-b border-white/10">
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Create Outfit
            </Text>
            <TouchableOpacity onPress={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <ActivityIndicator color="#FF6B35" size="small" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 16 }}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {/* Form */}
            <View className="px-5 mt-6 mb-6">
              <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Outfit Name (Optional)
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Summer Date Night"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="bg-white/10 border border-white/20 rounded-xl px-4 h-14 text-white text-[16px]"
                style={{ paddingVertical: 0, paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
              />

              {/* Occasion */}
              <View className="mt-4">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                  Occasion
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-1">
                  {OCCASIONS.map(occ => (
                    <TouchableOpacity
                      key={occ}
                      onPress={() => setOccasion(occ)}
                      className="mr-2 px-4 h-11 rounded-full border"
                      style={{
                        backgroundColor: occasion === occ ? '#FF6B35' : 'rgba(255,255,255,0.05)',
                        borderColor: occasion === occ ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: occasion === occ ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        {occ.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Season */}
              <View className="mt-4">
                <Text className="text-white/60 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                  Season
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SEASONS.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSeason(s)}
                      className="mr-2 px-4 h-11 rounded-full border"
                      style={{
                        backgroundColor: season === s ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                        borderColor: season === s ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: season === s ? '#FF6B35' : 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        {s.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Item Grid grouped by Slot */}
            <View className="px-5">
              <Text className="text-white text-xl font-light mb-4" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
                Select Items ({selectedIds.size})
              </Text>

              {slots.map(slot => {
                const slotItems = items.filter(i => i.wardrobe_slot === slot);
                if (slotItems.length === 0) return null;

                return (
                  <View key={slot} className="mb-6">
                    <Text className="text-white/60 text-xs uppercase tracking-widest mb-3" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                      {slot}
                    </Text>
                    <View className="flex-row flex-wrap -mx-1">
                      {slotItems.map((item) => {
                        const isSelected = selectedIds.has(item.id);
                        return (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => toggleSelection(item.id)}
                            activeOpacity={0.8}
                            className="w-1/2 px-1 mb-2"
                          >
                            <View
                              style={{
                                borderRadius: 16, overflow: 'hidden', aspectRatio: 3 / 4,
                                borderWidth: 2,
                                borderColor: isSelected ? '#FF6B35' : 'transparent',
                              }}
                            >
                              <Image
                                source={{ uri: item.image_url }}
                                style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.08)' }}
                                resizeMode="cover"
                              />
                              {/* Item name overlay */}
                              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 8 }}>
                                <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 11 }} numberOfLines={1}>
                                  {item.name || item.fashionclip_main_category || 'Item'}
                                </Text>
                              </View>
                              {isSelected && (
                                <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,107,53,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                                  <View style={{ backgroundColor: '#FF6B35', borderRadius: 999, padding: 6, shadowColor: '#FF6B35', shadowOpacity: 0.5, shadowRadius: 8 }}>
                                    <Ionicons name="checkmark" size={18} color="white" />
                                  </View>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
