import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

function OutfitItemThumbnail({ uri }: { uri?: string | null }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!uri) {
    return (
      <View className="w-full h-full items-center justify-center bg-white/5">
        <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.25)" />
      </View>
    );
  }

  return (
    <View className="w-full h-full">
      {!loaded && !failed && (
        <View style={[StyleSheet.absoluteFillObject]} className="items-center justify-center bg-white/5">
          <ActivityIndicator size="small" color="#FF6B35" />
        </View>
      )}
      <Image
        source={{ uri }}
        className="w-full h-full"
        style={{ backgroundColor: '#111', opacity: loaded && !failed ? 1 : 0 }}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setFailed(true);
          setLoaded(true);
        }}
      />
      {failed && (
        <View style={[StyleSheet.absoluteFillObject]} className="items-center justify-center bg-white/5">
          <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.25)" />
        </View>
      )}
    </View>
  );
}

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: () => apiClient.get(`/wardrobe/outfits/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const outfit = query.state.data?.outfit ?? query.state.data?.data ?? query.state.data;
      return outfit?.ai_rating ? false : 3000;
    },
  });

  const outfitRaw = data?.outfit ?? data?.data ?? data;
  const outfitItems =
    outfitRaw?.items ??
    (Array.isArray(outfitRaw?.outfit_items)
      ? [...outfitRaw.outfit_items]
          .sort((a: { position?: number }, b: { position?: number }) =>
            (a.position ?? 0) - (b.position ?? 0)
          )
          .map((row: { wardrobe_items?: unknown }) => row.wardrobe_items)
          .filter(Boolean)
      : []);
  const outfit = outfitRaw ? { ...outfitRaw, items: outfitItems } : outfitRaw;

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/wardrobe/outfits/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outfits'] });
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not delete outfit. Try again.'),
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      'This outfit will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-black">
      {isLoading ? (
        <ModeSwitchOverlay />
      ) : !outfit ? (
        <View className="flex-1 bg-black justify-center items-center">
          <Text className="text-white">Outfit not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
            <Text className="text-white">Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 border-b border-white/10" style={{ paddingVertical: 14 }}>
            <TouchableOpacity onPress={() => router.back()} className="p-1">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center space-x-4">
              <TouchableOpacity
                onPress={() => router.push(`/wardrobe/outfit-edit?id=${id}` as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={22} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Title & Occasion */}
            <View className="px-5 pt-5 pb-4">
              <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className="text-white text-3xl font-bold mb-3">
                {outfit.name || 'Untitled Outfit'}
              </Text>
              {outfit.occasion && (
                <View className="self-start bg-[#FF6B35]/20 border border-[#FF6B35]/50 rounded-full px-4 py-2">
                  <Text className="text-[#FF6B35] text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'HelveticaNeue-Bold' }}>
                    {outfit.occasion}
                  </Text>
                </View>
              )}
            </View>

            {/* AI Rating Card */}
            <View className="mx-5 mb-8 bg-white/5 rounded-[24px] p-6 border border-white/10 shadow-lg shadow-black/20">
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/40 text-xs uppercase tracking-widest mb-3">
                AI Rating
              </Text>
              {outfit.ai_rating ? (
                <>
                  <View className="flex-row items-baseline">
                    <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }} className="text-[#FF6B35] text-5xl">
                      {outfit.ai_rating.toFixed(1)}
                    </Text>
                    <Text className="text-white/20 text-xl font-light ml-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
                      / 10
                    </Text>
                  </View>
                  {outfit.ai_feedback && (
                    <Text className="text-white/70 text-base mt-4 leading-6" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                      {outfit.ai_feedback}
                    </Text>
                  )}
                </>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                  <ActivityIndicator size="small" color="#FF6B35" />
                  <Text className="text-white/40 text-sm" style={{ fontFamily: 'HelveticaNeue' }}>
                    AI rating in progress...
                  </Text>
                </View>
              )}
            </View>

            {/* Items Horizontal Scroll */}
            <View>
              <Text style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }} className="text-white/40 text-xs px-5 mb-4 uppercase tracking-widest">
                Items in this Outfit
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {(outfit.items ?? []).map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push(`/wardrobe/item-detail?id=${item.id}` as any)}
                    className="w-32"
                    activeOpacity={0.8}
                  >
                    <View className="w-32 h-32 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                      <OutfitItemThumbnail uri={item.image_url} />
                    </View>
                    <Text
                      style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}
                      className="text-white text-xs mt-2 text-center"
                      numberOfLines={1}
                    >
                      {item.name || item.fashionclip_main_category || 'Item'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
      )}
    </View>
  );
}
