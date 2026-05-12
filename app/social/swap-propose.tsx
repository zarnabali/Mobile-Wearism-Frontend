import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { COLORS } from '../../src/constants/theme';

export default function SwapProposeScreen() {
  const router = useRouter();
  const { targetUserId, targetItemId } = useLocalSearchParams<{ targetUserId: string, targetItemId: string }>();
  const queryClient = useQueryClient();
  const [selectedMyItemId, setSelectedMyItemId] = useState<string | null>(null);

  // Fetch My Items (filtered by category if we have the target item)
  const { data: myWardrobeData, isLoading: myLoading } = useQuery({
    queryKey: ['my-wardrobe'],
    queryFn: () => apiClient.get('/wardrobe/items').then(r => r.data),
  });

  // Fetch Target Item Details (using social endpoint since we might not own it)
  const { data: targetItemData, isLoading: targetLoading } = useQuery({
    queryKey: ['shared-item', targetItemId],
    queryFn: () => apiClient.get(`/social/swaps/shared-item/${targetItemId}`).then(r => r.data),
    enabled: !!targetItemId
  });

  const targetItem = targetItemData?.item;
  const myItems = myWardrobeData?.items || [];
  
  // Filter my items to match target item category
  const compatibleItems = targetItem 
    ? myItems.filter((i: any) => i.wardrobe_slot === targetItem.wardrobe_slot)
    : myItems;

  const proposeMutation = useMutation({
    mutationFn: () => apiClient.post('/social/swaps/propose', {
      receiver_id: targetUserId,
      offered_item_id: selectedMyItemId,
      requested_item_id: targetItemId
    }),
    onSuccess: () => {
      Alert.alert('Success', 'Swap proposal sent!', [
        { text: 'OK', onPress: () => router.replace('/social/requests' as any) }
      ]);
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to send proposal'),
  });

  const handlePropose = () => {
    if (!selectedMyItemId) {
      Alert.alert('Selection Required', 'Please select one of your items to offer in exchange.');
      return;
    }
    proposeMutation.mutate();
  };

  if (targetLoading || myLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-5 py-4 flex-row items-center gap-4">
            <TouchableOpacity onPress={() => router.back()} className="bg-white/10 p-2 rounded-xl">
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Propose Swap</Text>
          </View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Comparison Area */}
            <View className="flex-row items-center justify-between py-8">
              <View className="items-center flex-1">
                <Text className="text-white/40 text-[10px] mb-4 uppercase tracking-widest font-bold">You Request</Text>
                <View className="w-32 h-32 rounded-3xl border-2 border-[#FF6B35] overflow-hidden shadow-2xl">
                  <Image source={{ uri: targetItem?.image_url }} className="w-full h-full" />
                </View>
                <Text className="text-white mt-3 font-medium text-center">{targetItem?.name}</Text>
              </View>

              <Ionicons name="repeat" size={32} color="#FF6B35" />

              <View className="items-center flex-1">
                <Text className="text-white/40 text-[10px] mb-4 uppercase tracking-widest font-bold">You Offer</Text>
                <View className={`w-32 h-32 rounded-3xl border-2 ${selectedMyItemId ? 'border-green-500' : 'border-dashed border-white/20'} overflow-hidden`}>
                  {selectedMyItemId ? (
                    <Image 
                      source={{ uri: myItems.find((i: any) => i.id === selectedMyItemId)?.image_url }} 
                      className="w-full h-full" 
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Ionicons name="add" size={32} color="rgba(255,255,255,0.2)" />
                    </View>
                  )}
                </View>
                <Text className="text-white mt-3 font-medium text-center">
                  {selectedMyItemId ? myItems.find((i: any) => i.id === selectedMyItemId)?.name : 'Pick Item'}
                </Text>
              </View>
            </View>

            {/* Selection Grid */}
            <View className="mt-4">
              <Text className="text-white text-lg font-bold mb-4" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                Select from your {targetItem?.wardrobe_slot.replace(/wear/g, '')}s
              </Text>
              
              <View className="flex-row flex-wrap -mx-1">
                {compatibleItems.map((item: any) => (
                  <TouchableOpacity 
                    key={item.id}
                    onPress={() => setSelectedMyItemId(item.id)}
                    className={`w-1/3 px-1 mb-2`}
                  >
                    <View className={`rounded-2xl overflow-hidden border-2 ${selectedMyItemId === item.id ? 'border-[#FF6B35]' : 'border-transparent'}`}>
                      <Image source={{ uri: item.image_url }} className="w-full aspect-square" />
                      {selectedMyItemId === item.id && (
                        <View className="absolute top-1 right-1 bg-[#FF6B35] rounded-full p-0.5">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {compatibleItems.length === 0 && (
                <View className="bg-white/5 p-8 rounded-3xl items-center border border-dashed border-white/10">
                  <Ionicons name="alert-circle-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text className="text-white/40 text-center mt-3" style={{ fontFamily: 'HelveticaNeue' }}>
                    You don't have any compatible items in this category.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Button */}
          <View className="px-5 py-6">
            <TouchableOpacity 
              onPress={handlePropose}
              disabled={!selectedMyItemId || proposeMutation.isPending}
              className={`py-4 rounded-2xl items-center shadow-lg ${!selectedMyItemId ? 'bg-white/10' : 'bg-[#FF6B35]'}`}
            >
              {proposeMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className={`text-lg font-bold ${!selectedMyItemId ? 'text-white/20' : 'text-white'}`} style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                  Send Swap Proposal
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
