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
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

export default function FollowsScreen() {
  const router = useRouter();
  const { userId, type: initialType } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialType || 'followers');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['follows', userId, activeTab],
    queryFn: () => apiClient.get(`/follows/${userId}/${activeTab}`).then(r => r.data),
    enabled: !!userId,
  });

  const raw = data?.users ?? data?.data ?? data ?? [];
  const list = (Array.isArray(raw) ? raw : [])
    .map((row: any) => row?.profiles)
    .filter(Boolean);

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2">
      <TouchableOpacity
        className="flex-row items-center flex-1 mr-4"
        onPress={() => router.push(`/profile/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[COLORS.primary, '#FF9F6A']}
          style={{ width: 48, height: 48, borderRadius: 24, padding: 2 }}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
          ) : (
            <View className="flex-1 rounded-full bg-black items-center justify-center">
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
          )}
        </LinearGradient>
        <View className="ml-4 flex-1">
          <Text className="text-white text-[15px] font-h-bold mb-0.5" numberOfLines={1}>
            {item.username || item.full_name || 'User'}
          </Text>
          <Text className="text-white/40 text-[12px] font-h-light" numberOfLines={1}>
            {item.full_name || 'Fashion Enthusiast'}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ width: 110 }}>
        <FollowButton userId={item.id} />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }} className="px-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3">
              <Ionicons name="chevron-back" size={26} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-[18px] font-h-bold">Connections</Text>
          </View>

          {/* Tabs */}
          <View className="flex-row px-6 mt-6 mb-4 bg-white/5 mx-6 rounded-2xl p-1 border border-white/10">
            {(['followers', 'following'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                className={`flex-1 py-3 items-center rounded-xl ${activeTab === t ? 'bg-white/10' : ''}`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-2">
                  {activeTab === t && <View className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  <Text
                    className={`capitalize text-[13px] ${activeTab === t ? 'text-white font-h-bold' : 'text-white/40 font-h-medium'}`}
                  >
                    {t}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <ModeSwitchOverlay />
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
