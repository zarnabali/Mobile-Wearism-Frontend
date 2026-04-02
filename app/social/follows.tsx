import React, { useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { FollowButton } from '../../src/components/FollowButton';
import { EmptyState } from '../../src/components/EmptyState';

export default function FollowsScreen() {
  const router = useRouter();
  const { userId, type: initialType } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialType || 'followers');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['follows', userId, activeTab],
    queryFn: () => apiClient.get(`/follows/${userId}/${activeTab}`).then(r => r.data),
    enabled: !!userId,
  });

  const list = data?.users ?? data?.data ?? data ?? [];

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between px-5 h-14 border-b border-white/5">
      <TouchableOpacity
        className="flex-row items-center flex-1"
        onPress={() => router.push(`/profile?id=${item.id}` as any)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={24} color="rgba(255,255,255,0.4)" />
          </View>
        )}
        <View className="ml-4">
          <Text className="text-white font-bold text-base" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
            {item.username || item.full_name || 'User'}
          </Text>
          <Text className="text-white/50 text-xs" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
            {item.full_name || 'No bio available'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ width: 100 }}>
        <FollowButton userId={item.id} />
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center px-5 h-14 border-b border-white/10">
            <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
              Connections
            </Text>
          </View>

          {/* Tabs */}
          <View className="flex-row px-5 mt-4 mb-2">
            {(['followers', 'following'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`flex-1 h-14 items-center border-b-2 ${activeTab === t ? 'border-[#FF6B35]' : 'border-transparent'}`}
              >
                <Text
                  className={`capitalize text-sm ${activeTab === t ? 'text-white font-bold' : 'text-white/40'}`}
                  style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: activeTab === t ? 'HelveticaNeue-Bold' : 'HelveticaNeue' }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator color="#FF6B35" size="large" />
            </View>
          ) : (
            <FlatList
              data={list}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View className="mt-20">
                  <EmptyState
                    icon="people-outline"
                    title={`No ${activeTab} yet`}
                    subtitle={`This list is currently empty.`}
                  />
                </View>
              }
              onRefresh={refetch}
              refreshing={false}
              contentContainerStyle={{ paddingBottom: 50 }}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
