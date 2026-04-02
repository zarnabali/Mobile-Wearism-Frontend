import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/authStore';

export function FollowButton({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  // If viewing my own profile, don't show the button
  if (user?.id === userId) return null;

  // Optimistically we could rely purely on my-profile or fetched user profile,
  // but hitting a dedicated relationship endpoint ensures we have the truth.
  const { data: rel, isLoading } = useQuery({
    queryKey: ['relationship', userId],
    queryFn: () => apiClient.get(`/follows/${userId}/relationship`).then(r => r.data),
    enabled: !!userId,
  });

  const isFollowing = rel?.you_follow_them ?? false;

  const mutation = useMutation({
    mutationFn: () =>
      isFollowing ? apiClient.delete(`/follows/${userId}`) : apiClient.post(`/follows/${userId}`),
    onSuccess: () => {
      // Refresh the specific relationship state
      qc.invalidateQueries({ queryKey: ['relationship', userId] });
      // Refresh feed since new posts will appear
      qc.invalidateQueries({ queryKey: ['feed'] });
      // Refresh profiles
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  if (isLoading) {
    return (
      <TouchableOpacity
        className="bg-white/10 rounded-full px-4 border border-white/20 items-center justify-center"
        style={{ height: 36, minWidth: 100 }}
        disabled
      >
        <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`rounded-full px-5 flex-row items-center justify-center ${
        isFollowing ? 'bg-white/10 border border-white/20' : 'bg-[#FF6B35]'
      }`}
      style={{ height: 36, minWidth: 100 }}
      activeOpacity={0.8}
    >
      {mutation.isPending ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {isFollowing && <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 6 }} />}
          <Text
            style={{ fontFamily: 'HelveticaNeue-Bold' }}
            className={`text-sm ${isFollowing ? 'text-white' : 'text-white'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
