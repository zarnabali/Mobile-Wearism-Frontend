import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/apiClient';

const REASONS = [
  { value: 'spam',         label: 'Spam' },
  { value: 'nsfw',         label: 'Inappropriate content' },
  { value: 'harassment',   label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other',        label: 'Other' },
];

export function ReportModal({
  postId,
  visible,
  onClose,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/posts/${postId}/report`, { reason: selected }),
    onSuccess: () => setDone(true),
  });

  const handleClose = () => {
    setDone(false);
    setSelected(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType='slide' onRequestClose={handleClose}>
      <TouchableOpacity
        className='flex-1 bg-black/60'
        activeOpacity={1}
        onPress={handleClose}
      />
      <View className='bg-[#111] rounded-t-3xl p-6 pb-10'>
        {done ? (
          <>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold' }}
                  className='text-white text-xl text-center mb-2'>
              Report submitted
            </Text>
            <Text className='text-white/50 text-center mb-8 text-base' style={{ fontFamily: 'HelveticaNeue' }}>
              Thank you. We'll review this post.
            </Text>
            <TouchableOpacity onPress={handleClose}
              className='bg-[#FF6B35] rounded-full py-4'>
              <Text style={{ fontFamily: 'HelveticaNeue-Heavy' }}
                    className='text-white text-center'>DONE</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: 'HelveticaNeue-Bold' }}
                  className='text-white text-xl mb-6'>
              Report Post
            </Text>
            {REASONS.map(r => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setSelected(r.value)}
                className={`flex-row items-center py-4 px-4 rounded-2xl mb-3 ${
                  selected === r.value
                    ? 'bg-[#FF6B35]/20 border border-[#FF6B35]'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <Text style={{ fontFamily: 'HelveticaNeue-Medium' }} className='text-white flex-1 text-base'>
                  {r.label}
                </Text>
                {selected === r.value && (
                  <Ionicons name='checkmark-circle' size={24} color='#FF6B35' />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => mutation.mutate()}
              disabled={!selected || mutation.isPending}
              className={`rounded-full py-4 mt-4 ${ selected ? 'bg-[#FF6B35]' : 'bg-white/10' }`}
            >
              <Text style={{ fontFamily: 'HelveticaNeue-Heavy' }}
                    className={`text-center ${selected ? 'text-white' : 'text-white/40'}`}>
                {mutation.isPending ? 'Submitting...' : 'SUBMIT REPORT'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}
