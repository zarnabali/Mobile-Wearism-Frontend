import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '../../src/lib/apiClient';
import { LikeButton } from '../../src/components/LikeButton';
import { FollowButton } from '../../src/components/FollowButton';
import { useAuthStore } from '../../src/stores/authStore';
import { ReportModal } from '../../src/components/ReportModal';
import { COLORS } from '../../src/constants/theme';
import ModeSwitchOverlay from '../components/ModeSwitchOverlay';

// ─── helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Single comment row ──────────────────────────────────────────────────────
function CommentRow({
  comment, currentUserId, onReply, onDelete, isReply = false,
}: {
  comment: any;
  currentUserId?: string;
  onReply: (id: string, username: string) => void;
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const user = comment.user ?? comment.profiles ?? {};
  return (
    <View style={{ flexDirection: 'row', marginBottom: 20, marginLeft: isReply ? 44 : 0 }}>
      {/* Avatar */}
      <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={{ width: 34, height: 34, borderRadius: 17, marginTop: 2 }} />
        ) : (
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <Ionicons name="person" size={14} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Body */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View className="bg-white/3 rounded-2xl p-4 border border-white/5">
          <Text className="text-white/90 text-[14px] font-h-light leading-6">
            <Text className="font-h-bold">
              {user.username ?? user.full_name ?? 'User'}{' '}
            </Text>
            {comment.content ?? comment.body ?? ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, marginLeft: 4, gap: 16 }}>
          <Text className="text-white/30 text-[11px] font-h-light">
            {comment.created_at ? timeAgo(comment.created_at) : ''}
          </Text>
          {!isReply && (
            <TouchableOpacity onPress={() => onReply(comment.id, user.username ?? 'User')}>
              <Text className="text-white/50 text-[11px] font-h-bold uppercase tracking-wider">
                Reply
              </Text>
            </TouchableOpacity>
          )}
          {(comment.user_id ?? comment.profiles?.id) === currentUserId && (
            <TouchableOpacity onPress={() => onDelete(comment.id)}>
              <Text className="text-primary/60 text-[11px] font-h-bold uppercase tracking-wider">
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id: string; fromProfileId?: string | string[] }>();
  const id = params.id != null ? String(Array.isArray(params.id) ? params.id[0] : params.id) : '';
  const fromProfileId = useMemo(() => {
    const raw = params.fromProfileId;
    if (raw == null) return undefined;
    const s = Array.isArray(raw) ? raw[0] : raw;
    return s ? decodeURIComponent(s) : undefined;
  }, [params.fromProfileId]);
  const currentUserId = useAuthStore(s => s.user?.id);

  const goBackFromPost = useCallback(() => {
    if (fromProfileId) {
      router.replace(`/profile/${fromProfileId}` as any);
      return;
    }
    router.back();
  }, [fromProfileId, router]);

  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  // ── Fetch post ────────────────────────────────────────────────────────────
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => apiClient.get(`/posts/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const post = postData?.post ?? postData?.data ?? postData;
  const author = post?.profiles ?? post?.user ?? {};

  // ── Fetch comments ────────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => apiClient.get(`/posts/${id}/comments`).then(r => r.data),
    enabled: !!id,
  });

  const commentTree: any[] = commentsData?.comments ?? commentsData?.data ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────
  const postCommentMutation = useMutation({
    mutationFn: () => apiClient.post(`/posts/${id}/comments`, {
      body: commentText,
      parent_id: replyTo?.id ?? undefined,
    }),
    onSuccess: () => {
      setCommentText('');
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not post comment.'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => apiClient.delete(`/posts/${id}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['post', id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${post?.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', 'home'] });
      qc.invalidateQueries({ queryKey: ['posts', currentUserId] });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      if (fromProfileId) router.replace(`/profile/${fromProfileId}` as any);
      else router.back();
    },
    onError: () => Alert.alert('Error', 'Could not delete post. Try again.'),
  });

  const handleDelete = useCallback((commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCommentMutation.mutate(commentId) },
    ]);
  }, [deleteCommentMutation]);

  const handleDeletePost = () => {
    Alert.alert('Delete Post', 'This will permanently remove your post.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePostMutation.mutate() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {postLoading ? (
        <ModeSwitchOverlay />
      ) : !post ? (
        <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff' }}>Post not found.</Text>
          <TouchableOpacity onPress={goBackFromPost} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
            <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* ── Header bar ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={goBackFromPost} style={{ padding: 4, marginRight: 12 }}>
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Image 
                  source={require('../../assets/logo/wearism-short-w.png')} 
                  style={{ width: 22, height: 22 }} 
                  resizeMode="contain" 
                />
                <Text className="text-white text-[17px] font-h-bold">Discussion</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setReportVisible(true)} style={{ padding: 4 }}>
              <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
              
              {/* ── 1. Author row (Top) ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => router.push(`/profile/${author.id}` as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, '#FF9F6A']}
                    style={{ width: 38, height: 38, borderRadius: 19, padding: 1.5 }}
                  >
                    {author.avatar_url ? (
                      <Image source={{ uri: author.avatar_url }} style={{ width: '100%', height: '100%', borderRadius: 17.5 }} />
                    ) : (
                      <View style={{ width: '100%', height: '100%', borderRadius: 17.5, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={16} color={COLORS.primary} />
                      </View>
                    )}
                  </LinearGradient>
                  <View style={{ marginLeft: 12 }}>
                    <Text className="text-white text-[14px] font-h-bold">
                      {author.username ?? author.full_name ?? 'User'}
                    </Text>
                    {post.location && (
                      <Text className="text-white/40 text-[10px] font-h-light mt-0.5">{post.location}</Text>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {author.id && author.id !== currentUserId && <FollowButton userId={author.id} />}
                  {post.user_id === currentUserId && (
                    <TouchableOpacity onPress={handleDeletePost} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* ── 2. Full-width post image ── */}
              <View style={{ overflow: 'hidden', borderRadius: 0 }}>
                {post.image_url ? (
                  <Image
                    source={{ uri: post.image_url }}
                    style={{ width: '100%', aspectRatio: 0.8, backgroundColor: 'transparent' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: '100%', aspectRatio: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.15)" />
                  </View>
                )}
              </View>

              {/* ── 3. Action row ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                  <LikeButton post={post} size={28} showCount />
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.7}>
                    <Ionicons name="chatbubble-outline" size={26} color="rgba(255,255,255,0.9)" />
                    {post.comments_count > 0 && (
                      <Text className="text-white/60 text-[14px] font-h-medium ml-2">
                        {post.comments_count}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Ionicons name="paper-plane-outline" size={26} color="rgba(255,255,255,0.9)" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                  <Ionicons name="bookmark-outline" size={26} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </View>

              {/* ── 4. Caption ── */}
              {post.caption ? (
                <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
                  <Text className="text-white/90 text-[15px] font-h-light leading-6">
                    <Text className="font-h-bold">{author.username ?? 'User'} </Text>
                    {post.caption}
                  </Text>
                  <Text className="text-white/20 text-[11px] font-h-light uppercase tracking-widest mt-4">
                    {post.created_at ? timeAgo(post.created_at) + ' AGO' : ''}
                  </Text>
                </View>
              ) : null}

              {/* ── 5. Comments section ── */}
              <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <View className="flex-row items-center mb-8">
                  <View className="flex-1 h-[0.5px] bg-white/10" />
                  <Text className="text-white/30 text-[10px] font-h-bold uppercase tracking-[3px] mx-4">
                    Discussion
                  </Text>
                  <View className="flex-1 h-[0.5px] bg-white/10" />
                </View>

                {commentsLoading ? (
                  <ActivityIndicator color="#FF6B35" style={{ alignSelf: 'flex-start' }} />
                ) : commentTree.length === 0 ? (
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', textAlign: 'center', paddingVertical: 24 }}>
                    No comments yet. Be the first!
                  </Text>
                ) : (
                  commentTree.map(comment => (
                    <View key={comment.id}>
                      {/* Top-level comment */}
                      <CommentRow
                        comment={comment}
                        currentUserId={currentUserId}
                        onReply={(cid, uname) => setReplyTo({ id: cid, username: uname })}
                        onDelete={handleDelete}
                      />
                      {/* Replies — indented, max 1 level */}
                      {comment.replies?.map((reply: any) => (
                        <CommentRow
                          key={reply.id}
                          comment={reply}
                          currentUserId={currentUserId}
                          onReply={() => {}}
                          onDelete={handleDelete}
                          isReply
                        />
                      ))}
                    </View>
                  ))
                )}
              </View>
            </ScrollView>

            {/* ── Comment input bar ── */}
            <View className="bg-black/90 border-t border-white/10 px-4 pt-3 pb-8">
              {replyTo && (
                <View className="flex-row items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2 mb-3">
                  <Text className="text-primary/80 text-[12px] font-h-light">
                    Replying to <Text className="font-h-bold">@{replyTo.username}</Text>
                  </Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)} className="p-1">
                    <Ionicons name="close-circle" size={18} color={COLORS.primary} className="opacity-60" />
                  </TouchableOpacity>
                </View>
              )}
              <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 min-h-[50px]">
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Share your thoughts..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  className="flex-1 text-white text-[15px] font-h-light py-3"
                  multiline
                />
                <TouchableOpacity
                  onPress={() => { if (commentText.trim()) postCommentMutation.mutate(); }}
                  disabled={!commentText.trim() || postCommentMutation.isPending}
                  className="pl-3"
                >
                  {postCommentMutation.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text className={`text-[15px] font-h-bold ${commentText.trim() ? 'text-primary' : 'text-white/20'}`}>
                      Post
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>

          {post && (
            <ReportModal postId={post.id} visible={reportVisible} onClose={() => setReportVisible(false)} />
          )}
        </SafeAreaView>
      </LinearGradient>
      )}
    </View>
  );
}
