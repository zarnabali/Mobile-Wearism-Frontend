import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

interface LikeButtonProps {
  post: {
    id: string;
    viewer_has_liked: boolean;
    likes_count: number;
    [key: string]: any;
  };
  feedType?: 'home' | 'trending'; // Key to optimistic update feed list
  size?: number;
  showCount?: boolean;
}

export function LikeButton({ post, feedType, size = 24, showCount = true }: LikeButtonProps) {
  const qc = useQueryClient();

  // Optimistic update pattern
  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/posts/${post.id}/like`),
    onMutate: async () => {
      // 1. If we know the feedKey, optimistically update the infinite list
      if (feedType) {
        await qc.cancelQueries({ queryKey: ['feed', feedType] });
        const prevFeed = qc.getQueryData(['feed', feedType]);

        // Optimistically update the list cache
        qc.setQueryData(['feed', feedType], (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: (page.data ?? page.posts ?? []).map((p: any) =>
                p.id !== post.id
                  ? p
                  : {
                      ...p,
                      viewer_has_liked: !p.viewer_has_liked,
                      likes_count: p.viewer_has_liked ? p.likes_count - 1 : p.likes_count + 1,
                    }
              ),
            })),
          };
        });
        return { prevFeed, feedKey: ['feed', feedType] };
      }

      // 2. If it's a standalone post (e.g. detail view context), optimistically update that query directly
      await qc.cancelQueries({ queryKey: ['post', post.id] });
      const prevPost = qc.getQueryData(['post', post.id]);
      qc.setQueryData(['post', post.id], (old: any) => {
        if (!old) return old;
        const p = old.post ?? old;
        return {
          ...old,
          post: {
            ...p,
            viewer_has_liked: !p.viewer_has_liked,
            likes_count: p.viewer_has_liked ? p.likes_count - 1 : p.likes_count + 1,
          },
        };
      });

      return { prevPost, postKey: ['post', post.id] };
    },
    onError: (_e, _v, ctx: any) => {
      // Rollback
      if (ctx?.feedKey && ctx?.prevFeed) qc.setQueryData(ctx.feedKey, ctx.prevFeed);
      if (ctx?.postKey && ctx?.prevPost) qc.setQueryData(ctx.postKey, ctx.prevPost);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post', post.id] });
    },
  });

  return (
    <TouchableOpacity
      onPress={() => mutation.mutate()}
      activeOpacity={0.7}
      className="flex-row items-center"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons
        name={post.viewer_has_liked ? 'heart' : 'heart-outline'}
        size={size}
        color={post.viewer_has_liked ? '#FF6B35' : 'rgba(255,255,255,0.7)'}
      />
      {showCount && (
        <Text
          className="text-white/60 ml-1.5"
          style={{ fontFamily: 'HelveticaNeue-Medium', fontSize: size * 0.55 }}
        >
          {post.likes_count}
        </Text>
      )}
    </TouchableOpacity>
  );
}
