import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLikeMutation } from '../hooks/useLikeMutation';

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
  const mutation = useLikeMutation(post, feedType);

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
