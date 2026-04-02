import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View className='flex-1 items-center justify-center px-8 py-16'>
      <Ionicons name={icon} size={64} color='rgba(255,255,255,0.15)' />
      <Text style={{ fontFamily: 'HelveticaNeue-Bold' }} className='text-white text-xl mt-4 text-center'>
        {title}
      </Text>
      {subtitle && (
        <Text className='text-white/40 text-center mt-2' style={{ fontFamily: 'HelveticaNeue' }}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className='mt-6 bg-[#FF6B35] px-8 py-3 rounded-full shadow-lg shadow-orange-500/20'
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={{ fontFamily: 'HelveticaNeue-Heavy' }} className='text-white'>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
