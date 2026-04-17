import React, { useState } from 'react';
import {
  View, Text, ScrollView, ImageBackground, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';

// ─── Sub-component: AI Tag ────────────────────────────────────────────────
function AITag({ label }: { label: string }) {
  if (!label) return null;
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginRight: 8, marginBottom: 8 }}>
      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff', fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // ─── Fetch Item Details ─────────────────────────────────────────────────
  const { data: itemData, isLoading } = useQuery({
    queryKey: ['wardrobe-item', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const item = itemData?.item ?? itemData?.data ?? itemData;

  // ─── AI Polling ─────────────────────────────────────────────────────────
  const { data: aiData } = useQuery({
    queryKey: ['ai-status', id],
    queryFn: () => apiClient.get(`/wardrobe/items/${id}/ai-status`).then(r => r.data),
    refetchInterval: (query) => {
      // Data path depends on API structure. Handle { ai: {status} } or { status }
      const status = query.state.data?.ai?.status ?? query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
    enabled: !!id,
  });

  const rawAIStatus = aiData?.ai?.status ?? aiData?.status ?? item?.ai_status;
  const hasResolvedWardrobeAI =
    !!item?.wardrobe_slot ||
    !!item?.fashionclip_main_category ||
    !!item?.fashionclip_sub_category ||
    (Array.isArray(item?.fashionclip_attributes) && item.fashionclip_attributes.length > 0);

  // Materialized segment rows can already be fully populated even when there is no ai_results
  // row directly keyed by their own wardrobe item id.
  const currentAIStatus =
    rawAIStatus === 'not_found' && hasResolvedWardrobeAI
      ? 'completed'
      : rawAIStatus;
  const isCompleted = currentAIStatus === 'completed';
  const isFailed = currentAIStatus === 'failed';
  const isAnalyzing = !isCompleted && !isFailed;

  const aiResult = aiData?.ai?.result ?? aiData?.result ?? null;
  const segments = Array.isArray(aiResult?.segments) ? aiResult?.segments : [];

  const primaryImageUrl = aiResult?.image_url ?? item?.image_url ?? null;

  const seg0Gemma = segments?.[0]?.gemma_attributes ?? {};
  const segFallbackMain = seg0Gemma?.category ?? seg0Gemma?.main_category ?? null;
  const segFallbackSub = seg0Gemma?.subcategory ?? seg0Gemma?.sub_category ?? null;

  // Category rendering must use new FashionCLIP fields; if they are null, fall back to the first segment's Gemma attributes.
  const mainCategory = item?.fashionclip_main_category ?? segFallbackMain ?? 'unknown';
  const subCategory = item?.fashionclip_sub_category ?? segFallbackSub ?? '';

  // Temporary debug to validate the new Models PC contract.
  React.useEffect(() => {
    console.log('[ItemDetail AI]', {
      itemId: id,
      status: currentAIStatus,
      rawStatus: rawAIStatus,
      segmentsCount: segments.length,
      wardrobeMain: item?.fashionclip_main_category ?? null,
      wardrobeSub: item?.fashionclip_sub_category ?? null,
      aiResultHasSegments: Array.isArray(aiResult?.segments),
      hasResolvedWardrobeAI,
    });
  }, [id, currentAIStatus, rawAIStatus, segments.length, item?.fashionclip_main_category, item?.fashionclip_sub_category, aiResult?.segments, hasResolvedWardrobeAI]);

  const rawAIJson =
    item?.wardrobe_slot ||
    item?.fashionclip_main_category ||
    item?.fashionclip_sub_category ||
    (item?.fashionclip_attributes?.length ?? 0) > 0
      ? JSON.stringify(
          {
            wardrobe_slot: item?.wardrobe_slot ?? null,
            fashionclip_main_category: item?.fashionclip_main_category ?? null,
            fashionclip_sub_category: item?.fashionclip_sub_category ?? null,
            fashionclip_attributes: Array.isArray(item?.fashionclip_attributes) ? item.fashionclip_attributes : null,
            segments_present: Array.isArray(aiResult?.segments),
            segments_length: Array.isArray(aiResult?.segments) ? aiResult?.segments.length : 0,
          },
          null,
          2
        )
      : null;

  // If completed, refresh the main item to get the newly attached attributes
  React.useEffect(() => {
    if (currentAIStatus === 'completed') {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      qc.invalidateQueries({ queryKey: ['ai-status', id] });
    }
  }, [currentAIStatus, id, qc]);

  // ─── Mutations ──────────────────────────────────────────────────────────
  const retryClassificationMutation = useMutation({
    mutationFn: () => apiClient.post(`/wardrobe/items/${id}/retry-classification`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-status', id] });
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
    },
    onError: (err: any) => {
      const d = err?.response?.data;
      const msg = d?.error ?? d?.message ?? 'Retry failed.';
      Alert.alert('Retry Failed', msg);
    },
  });

  const wornMutation = useMutation({
    mutationFn: () => apiClient.post(`/wardrobe/items/${id}/worn`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-item', id] });
      Alert.alert('Success', 'Worn count updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/wardrobe/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wardrobe-items'] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from your wardrobe?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <Text className="text-white/60">Item not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 h-14 bg-white/10 rounded-full">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false} bounces={false}>
          {/* Header Image */}
          <View className="h-[450px] w-full relative">
            <ImageBackground
              source={{ uri: primaryImageUrl ?? item.image_url }}
              style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)', '#000000']}
                style={{ height: '50%', width: '100%', position: 'absolute', bottom: 0 }}
              />

              {/* Navigation Bar */}
              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <View className="flex-row justify-between items-center px-5 h-14">
                  <TouchableOpacity onPress={() => router.back()} className="bg-black/30 p-2 rounded-full border border-white/10 backdrop-blur-md" activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push(`/wardrobe/item-edit?id=${id}` as any)} className="bg-black/30 p-2 rounded-full border border-white/10 backdrop-blur-md mr-3" activeOpacity={0.7}>
                    <Ionicons name="create-outline" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} className="bg-black/30 p-2 rounded-full border border-white/10 backdrop-blur-md" activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              <View className="px-5 pb-6">
                {item.brand && (
                  <Text className="text-orange-400 font-bold tracking-widest uppercase text-xs mb-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                    {item.brand}
                  </Text>
                )}
                <Text className="text-white text-3xl font-bold leading-tight" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                  {item.name}
                </Text>
                {item.condition && (
                  <View className="flex-row mt-2">
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.8)', fontSize: 12, textTransform: 'uppercase' }}>
                        {item.condition.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>

          {/* Details Section */}
          <View className="px-5 pt-4">
            {/* AI Classification Card */}
            {isAnalyzing ? (
              <View className="bg-white/5 border border-orange-500/30 rounded-[24px] p-5 items-center justify-center flex-row shadow-lg my-4 shadow-orange-500/10">
                <ActivityIndicator color="#FF6B35" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text className="text-orange-400 font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                    AI Analysis in progress...
                  </Text>
                  <Text className="text-white/60 text-xs mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                    We're tagging the color, pattern, and style.
                  </Text>
                </View>
              </View>
            ) : isFailed ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-[24px] p-5 items-center justify-center flex-row my-4">
                <Ionicons name="warning-outline" size={24} color="#FF3B30" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text className="text-red-400 font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                    Analysis Failed
                  </Text>
                  <Text className="text-white/60 text-xs mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                    We couldn't automatically tag this image.
                  </Text>
                  <TouchableOpacity
                    onPress={() => retryClassificationMutation.mutate()}
                    disabled={retryClassificationMutation.isPending}
                    style={{
                      marginTop: 12,
                      backgroundColor: retryClassificationMutation.isPending ? 'rgba(255,107,53,0.25)' : 'rgba(255,107,53,0.18)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,107,53,0.35)',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 999,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    {retryClassificationMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FF6B35" />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={16} color="#FF6B35" style={{ marginRight: 8 }} />
                        <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 13 }}>Retry</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="bg-white/5 border border-white/10 rounded-[24px] p-5 my-4">
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-white/10">
                  <Text className="text-white/50 text-xs uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                    AI Tags
                  </Text>
                  <Ionicons name="sparkles" size={16} color="#FF6B35" />
                </View>

                <View className="mb-4">
                  <Text className="text-white/40 text-xs mb-2" style={{ fontFamily: 'HelveticaNeue' }}>Category</Text>
                  <View style={{ backgroundColor: 'rgba(255,107,53,0.2)', borderWidth: 1, borderColor: '#FF6B35', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#FF6B35', fontSize: 13, textTransform: 'uppercase' }}>
                      {String(mainCategory || 'unknown')}
                    </Text>
                    {subCategory ? (
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2, textAlign: 'left' }}>
                        {String(subCategory)}
                      </Text>
                    ) : null}
                  </View>

                  {(item?.tag || item?.wardrobe_slot) ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                        {item?.tag ? `Tag: ${item.tag}` : `Slot: ${item.wardrobe_slot}`}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {(mainCategory || subCategory || (item.fashionclip_attributes?.length > 0)) && (
                  <View className="mb-4">
                    <Text className="text-white/40 text-xs mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>Attributes</Text>
                    <View className="flex-row flex-wrap">
                      <AITag label={String(mainCategory || '')} />
                      {subCategory ? <AITag label={String(subCategory)} /> : null}
                      {item.fashionclip_attributes?.map((attr: string, idx: number) => (
                        <AITag key={idx} label={String(attr)} />
                      ))}
                    </View>
                  </View>
                )}

                {rawAIJson ? (
                  <View className="mb-1">
                    <Text
                      className="text-white/40 text-xs mb-2"
                      style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}
                    >
                      Raw AI JSON
                    </Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.10)',
                        borderRadius: 16,
                        padding: 12,
                      }}
                    >
                      <Text
                        selectable
                        style={{
                          fontFamily: 'HelveticaNeue',
                          color: 'rgba(255,255,255,0.65)',
                          fontSize: 11,
                          lineHeight: 16,
                        }}
                      >
                        {rawAIJson}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {item.color_dominant_rgb && (
                  <View>
                    <Text className="text-white/40 text-xs mb-2" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>Dominant Color</Text>
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: item.color_dominant_rgb,
                          borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
                        }}
                      />
                      <Text className="text-white/80 text-sm ml-3 uppercase" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue' }}>
                        {item.color_dominant_rgb}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Stats */}
            <View className="flex-row justify-between bg-white/5 border border-white/10 rounded-[24px] p-4 mb-6">
              <View className="items-center flex-1">
                <Text className="text-white text-xl font-bold" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                  {item.worn_count ?? 0}
                </Text>
                <Text className="text-white/50 text-xs uppercase tracking-widest mt-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  Times Worn
                </Text>
              </View>
              <View className="w-[1px] bg-white/10" />
              <View className="items-center flex-1">
                <Text className="text-white text-xl font-bold mb-1" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Light' }}>
                  <Ionicons name="calendar-outline" size={18} color="white" />
                </Text>
                <Text className="text-white/50 text-xs uppercase tracking-widest" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Medium' }}>
                  Added {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </Text>
              </View>
            </View>

            {/* Wear Action */}
            <TouchableOpacity
              onPress={() => wornMutation.mutate()}
              disabled={wornMutation.isPending}
              className="w-full bg-[#FF6B35] h-14 rounded-full flex-row justify-center items-center shadow-lg shadow-orange-500/20"
              activeOpacity={0.8}
            >
              {wornMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="shirt" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-lg" style={{ paddingVertical: 0, textAlignVertical: 'top', fontFamily: 'HelveticaNeue-Bold' }}>
                    Mark as Worn Today
                  </Text>
                </>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
