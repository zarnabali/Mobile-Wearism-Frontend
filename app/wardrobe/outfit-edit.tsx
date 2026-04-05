import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

const OCCASIONS = [
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'party', label: 'Party' },
  { id: 'business', label: 'Business' },
  { id: 'athleisure', label: 'Athleisure' },
  { id: 'streetwear', label: 'Streetwear' },
  { id: 'smart_casual', label: 'Smart Casual' },
];

export default function OutfitEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Load current outfit data
  const { data: outfitData, isLoading: outfitLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () => apiClient.get(`/wardrobe/outfits/${id}`).then(r => r.data),
    enabled: !!id,
  });

  // Load wardrobe items for selection
  const { data: wardrobeData, isLoading: itemsLoading } = useQuery({
    queryKey: ['wardrobe-items'],
    queryFn: () => apiClient.get('/wardrobe/items?limit=100').then(r => r.data),
  });

  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pre-fill from loaded outfit
  useEffect(() => {
    const outfit = outfitData?.outfit ?? outfitData?.data ?? outfitData;
    if (outfit) {
      setName(outfit.name || '');
      setOccasion(outfit.occasion || '');
      setSelectedIds((outfit.items ?? []).map((i: any) => i.id || i.wardrobe_item_id));
    }
  }, [outfitData]);

  const updateMutation = useMutation({
    mutationFn: () => apiClient.patch(`/wardrobe/outfits/${id}`, {
      name: name || undefined,
      occasion: occasion || undefined,
      item_ids: selectedIds,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfit', id] });
      qc.invalidateQueries({ queryKey: ['outfits'] });
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Update failed.'),
  });

  const toggleItem = (itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId)
        ? prev.filter(i => i !== itemId)
        : [...prev, itemId]
    );
  };

  const items = wardrobeData?.items ?? wardrobeData?.data ?? wardrobeData ?? [];

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter an outfit name.');
    if (selectedIds.length === 0) return Alert.alert('Error', 'Please select at least one item.');
    updateMutation.mutate();
  };

  if (outfitLoading || itemsLoading) {
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
          <View className="flex-row items-center justify-between px-5 border-b border-white/10" style={{ paddingVertical: 14 }}>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                Edit Outfit
              </Text>
            </View>
            <TouchableOpacity onPress={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <ActivityIndicator color="#FF6B35" />
              ) : (
                <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-[#FF6B35] text-base">
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            <View className="px-5 pt-6">
              {/* Name Input */}
              <Text className="text-white/40 text-xs mb-2 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Outfit Name
              </Text>
              <View className="bg-white/10 rounded-2xl px-4 mb-6 border border-white/10">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Summer Brunch"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  className="text-white text-[16px]"
                  style={{ paddingVertical: 14, fontFamily: 'HelveticaNeue' }}
                />
              </View>

              {/* Occasion Selector */}
              <Text className="text-white/40 text-xs mb-3 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Occasion
              </Text>
              <View className="flex-row flex-wrap mb-8">
                {OCCASIONS.map((occ) => (
                  <TouchableOpacity
                    key={occ.id}
                    onPress={() => setOccasion(occ.id)}
                    className={`px-4 rounded-full mr-2 mb-2 border ${
                      occasion === occ.id ? 'bg-[#FF6B35] border-[#FF6B35]' : 'bg-white/5 border-white/10'
                    }`}
                    style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 9 }}
                  >
                    <Text className={`text-sm ${occasion === occ.id ? 'text-white font-bold' : 'text-white/60'}`} style={{ fontFamily: 'HelveticaNeue' }}>
                      {occ.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Items Grid */}
              <Text className="text-white/40 text-xs mb-4 uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                Select Items ({selectedIds.length})
              </Text>
              <View className="flex-row flex-wrap -mx-1">
                {items.map((item: any) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      className="w-1/3 px-1 mb-2"
                      activeOpacity={0.8}
                    >
                      <View className={`rounded-2xl overflow-hidden aspect-square border-2 ${isSelected ? 'border-[#FF6B35]' : 'border-transparent'}`}>
                        <Image
                          source={{ uri: item.image_url }}
                          className="w-full h-full bg-white/5"
                        />
                        {isSelected && (
                          <View className="absolute top-1 right-1 bg-[#FF6B35] rounded-full w-5 h-5 items-center justify-center">
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
