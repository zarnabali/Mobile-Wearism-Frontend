import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { COLORS } from '../../src/constants/theme';

export default function RequestsScreen() {
  const router = useRouter();
  const { targetUserId } = useLocalSearchParams<{ targetUserId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'access' | 'swaps'>('access');

  // Fetch Access Requests
  const { data: accessData, isLoading: accessLoading, refetch: refetchAccess } = useQuery({
    queryKey: ['access-requests'],
    queryFn: () => apiClient.get('/social/swaps/access-requests').then(r => r.data),
  });

  // Fetch Swap Proposals
  const { data: swapData, isLoading: swapsLoading, refetch: refetchSwaps } = useQuery({
    queryKey: ['swap-inbox'],
    queryFn: () => apiClient.get('/social/swaps/inbox').then(r => r.data),
  });

  // Request Access Mutation (for when targetUserId is provided)
  const requestAccessMutation = useMutation({
    mutationFn: (ownerId: string) => apiClient.post('/social/swaps/access-request', { owner_id: ownerId }),
    onSuccess: () => {
      Alert.alert('Success', 'Access request sent!');
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to send request'),
  });

  // Respond to Access Mutation
  const respondAccessMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string, action: 'accepted' | 'rejected' }) => 
      apiClient.post('/social/swaps/access-respond', { request_id: requestId, action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-requests'] }),
  });

  const handleRequestAccess = () => {
    if (targetUserId) {
      requestAccessMutation.mutate(targetUserId);
    }
  };

  const userId = useAuthStore(s => s.user?.id);

  const renderAccessRequests = () => {
    const requests = accessData?.data || [];
    if (requests.length === 0) {
      return (
        <View className="items-center py-20">
          <Ionicons name="mail-outline" size={64} color="rgba(255,255,255,0.1)" />
          <Text className="text-white/40 mt-4" style={{ fontFamily: 'HelveticaNeue' }}>No access requests yet</Text>
        </View>
      );
    }

    return requests.map((req: any) => {
      const isIncoming = req.owner_id === userId;
      const otherUser = isIncoming ? req.requester : req.owner;

      return (
        <View key={req.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/150' }} className="w-12 h-12 rounded-2xl" />
            <View>
              <Text className="text-white font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>{otherUser?.full_name}</Text>
              <Text className="text-white/40 text-xs" style={{ fontFamily: 'HelveticaNeue' }}>
                {isIncoming ? 'wants to see your wardrobe' : 'is reviewing your request'}
              </Text>
            </View>
          </View>
          
          {req.status === 'pending' && isIncoming ? (
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => respondAccessMutation.mutate({ requestId: req.id, action: 'rejected' })}
                className="bg-white/10 p-2 rounded-xl"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => respondAccessMutation.mutate({ requestId: req.id, action: 'accepted' })}
                className="bg-[#FF6B35] p-2 rounded-xl"
              >
                <Ionicons name="checkmark" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className={`px-3 py-1 rounded-lg ${req.status === 'accepted' ? 'bg-green-500/20' : req.status === 'pending' ? 'bg-white/10' : 'bg-red-500/20'}`}>
              <Text className={`text-[10px] font-bold ${req.status === 'accepted' ? 'text-green-400' : req.status === 'pending' ? 'text-white/40' : 'text-red-400'}`}>
                {req.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      );
    });
  };

  const renderSwapProposals = () => {
    const proposals = swapData?.data || [];
    if (proposals.length === 0) {
      return (
        <View className="items-center py-20">
          <Ionicons name="repeat-outline" size={64} color="rgba(255,255,255,0.1)" />
          <Text className="text-white/40 mt-4" style={{ fontFamily: 'HelveticaNeue' }}>No swap proposals yet</Text>
        </View>
      );
    }

    return proposals.map((swap: any) => {
      const isIncoming = swap.receiver_id === userId;
      const otherUser = isIncoming ? swap.requester : swap.receiver;

      return (
        <View key={swap.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Image source={{ uri: otherUser?.avatar_url }} className="w-8 h-8 rounded-full" />
              <Text className="text-white font-medium" style={{ fontFamily: 'HelveticaNeue-Medium' }}>
                {isIncoming ? otherUser?.full_name : `Request to ${otherUser?.full_name}`}
              </Text>
            </View>
            <View className="bg-white/10 px-2 py-1 rounded-lg">
              <Text className="text-white/40 text-[10px]">{new Date(swap.created_at).toLocaleDateString()}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-around gap-4">
            <View className="items-center flex-1">
              <Image source={{ uri: swap.offered_item?.image_url }} className="w-24 h-24 rounded-2xl mb-2" />
              <Text className="text-white/60 text-[10px] uppercase font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                {isIncoming ? 'THEY GIVE' : 'YOU GIVE'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal" size={24} color="#FF6B35" />
            <View className="items-center flex-1">
              <Image source={{ uri: swap.requested_item?.image_url }} className="w-24 h-24 rounded-2xl mb-2" />
              <Text className="text-white/60 text-[10px] uppercase font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                {isIncoming ? 'YOU GIVE' : 'THEY GIVE'}
              </Text>
            </View>
          </View>

          {swap.status === 'pending' && isIncoming ? (
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity className="flex-1 bg-white/10 py-3 rounded-2xl items-center">
                <Text className="text-white font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#FF6B35] py-3 rounded-2xl items-center">
                <Text className="text-white font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Accept Swap</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-4 pt-4 border-t border-white/5 items-center">
              <Text className={`font-bold ${swap.status === 'accepted' ? 'text-green-400' : swap.status === 'pending' ? 'text-white/20' : 'text-red-400'}`}>
                {swap.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      );
    });
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => router.back()} className="bg-white/10 p-2 rounded-xl">
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-white text-2xl font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Requests</Text>
            </View>
            
            {targetUserId && (
              <TouchableOpacity 
                onPress={handleRequestAccess}
                className="bg-[#FF6B35]/20 border border-[#FF6B35]/30 px-4 py-2 rounded-xl"
              >
                <Text className="text-[#FF6B35] font-bold" style={{ fontFamily: 'HelveticaNeue-Bold' }}>Send Access Req</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row px-5 mt-4 mb-6">
            <TouchableOpacity 
              onPress={() => setActiveTab('access')}
              className={`flex-1 items-center pb-3 border-b-2 ${activeTab === 'access' ? 'border-[#FF6B35]' : 'border-transparent'}`}
            >
              <Text className={`${activeTab === 'access' ? 'text-white' : 'text-white/40'} font-bold`} style={{ fontFamily: 'HelveticaNeue-Bold' }}>Access</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('swaps')}
              className={`flex-1 items-center pb-3 border-b-2 ${activeTab === 'swaps' ? 'border-[#FF6B35]' : 'border-transparent'}`}
            >
              <Text className={`${activeTab === 'swaps' ? 'text-white' : 'text-white/40'} font-bold`} style={{ fontFamily: 'HelveticaNeue-Bold' }}>Swaps</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="px-5" 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={accessLoading || swapsLoading} onRefresh={() => { refetchAccess(); refetchSwaps(); }} tintColor="#FF6B35" />
            }
          >
            {activeTab === 'access' ? renderAccessRequests() : renderSwapProposals()}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
