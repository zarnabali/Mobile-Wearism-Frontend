import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../lib/apiClient';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'nsfw', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Other' },
];

/** Opaque surfaces: black base, deep burgundy (accent gradient family), primary #FF6B35 — docs/ui.md */
export function ReportModal({
  postId,
  visible,
  onClose,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiClient.post(`/posts/${postId}/report`, { reason: selected }),
    onSuccess: () => setDone(true),
  });

  const handleClose = () => {
    setDone(false);
    setSelected(null);
    onClose();
  };

  const sheetBottomPad = Math.max(insets.bottom, 12) + 20;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <LinearGradient
        colors={['rgba(60, 0, 8, 0.45)', 'rgba(60, 0, 8, 0.30)', 'rgba(60, 0, 8, 0.55)']}
        style={styles.gradientRoot}
      >
        <View style={styles.root} pointerEvents="box-none">
          <Pressable
            style={styles.backdropDim}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close report dialog"
          />
          <View style={[styles.sheet, { paddingBottom: sheetBottomPad }]}>
            <View style={styles.handleBar} />
            {done ? (
              <>
                <Text style={[styles.title, styles.titleCenter]}>Report submitted</Text>
                <Text style={styles.subtitle}>
                  Thank you. We’ll review this post.
                </Text>
                <TouchableOpacity onPress={handleClose} style={styles.primaryBtn} activeOpacity={0.8}>
                  <Text style={styles.primaryBtnText}>DONE</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Report post</Text>
                <Text style={styles.hint}>Why are you reporting this?</Text>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setSelected(r.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.reasonRow,
                      selected === r.value ? styles.reasonRowSelected : styles.reasonRowIdle,
                    ]}
                  >
                    <Text style={styles.reasonLabel}>{r.label}</Text>
                    {selected === r.value ? (
                      <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
                    ) : null}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => mutation.mutate()}
                  disabled={!selected || mutation.isPending}
                  style={[
                    styles.submitBtn,
                    selected && !mutation.isPending ? styles.submitBtnActive : styles.submitBtnDisabled,
                  ]}
                  activeOpacity={0.8}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.submitBtnText,
                        !selected && styles.submitBtnTextDisabled,
                      ]}
                    >
                      SUBMIT REPORT
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradientRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    marginHorizontal: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#140608',
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#3C0008',
  },
  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6B35',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'HelveticaNeue-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  titleCenter: {
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'HelveticaNeue',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'HelveticaNeue',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  reasonRowIdle: {
    backgroundColor: '#2A1418',
    borderColor: '#4A2830',
  },
  reasonRowSelected: {
    backgroundColor: '#3D1F12',
    borderColor: '#FF6B35',
  },
  reasonLabel: {
    flex: 1,
    fontFamily: 'HelveticaNeue-Medium',
    fontSize: 16,
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'HelveticaNeue-Heavy',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitBtn: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
  },
  submitBtnActive: {
    backgroundColor: '#FF6B35',
  },
  submitBtnDisabled: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  submitBtnText: {
    fontFamily: 'HelveticaNeue-Heavy',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  submitBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.50)',
  },
});
