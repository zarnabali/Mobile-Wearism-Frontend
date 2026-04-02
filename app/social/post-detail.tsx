import React, { useState, useCallback } from 'react';
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

// Group flat comment list into top-level + replies (max 1 level)
function groupComments(flat: any[]) {
  const byId: Record<string, any> = {};
  flat.forEach(c => { byId[c.id] = { ...c, replies: [] }; });
  const roots: any[] = [];
  flat.forEach(c => {
    if (c.parent_id && byId[c.parent_id]) {
      byId[c.parent_id].replies.push(byId[c.id]);
    } else {
      roots.push(byId[c.id]);
    }
  });
  return roots;
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
    <View style={{ flexDirection: 'row', marginBottom: 14, marginLeft: isReply ? 44 : 0 }}>
      {/* Avatar */}
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginTop: 2 }} />
      ) : (
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
          <Ionicons name="person" size={14} color="rgba(255,255,255,0.5)" />
        </View>
      )}

      {/* Body */}
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 14, lineHeight: 20 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Bold' }}>
            {user.username ?? user.full_name ?? 'User'}{' '}
          </Text>
          {comment.content ?? comment.body ?? ''}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 14 }}>
          <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            {comment.created_at ? timeAgo(comment.created_at) : ''}
          </Text>
          {/* Only top-level comments get a Reply button (max 1 level) */}
          {!isReply && (
            <TouchableOpacity onPress={() => onReply(comment.id, user.username ?? 'User')}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                Reply
              </Text>
            </TouchableOpacity>
          )}
          {(comment.user_id ?? comment.profiles?.id) === currentUserId && (
            <TouchableOpacity onPress={() => onDelete(comment.id)}>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,80,80,0.5)', fontSize: 11 }}>
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAuthStore(s => s.user?.id);

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

  const rawComments: any[] = commentsData?.comments ?? commentsData?.data ?? commentsData ?? [];
  const commentTree = groupComments(rawComments);

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
      router.back();
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

  // ── Loading / not found ───────────────────────────────────────────────────
  if (postLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FF6B35" size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff' }}>Post not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
          <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: '#fff' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <LinearGradient colors={['rgba(60,0,8,0.45)', 'rgba(60,0,8,0.30)', 'rgba(60,0,8,0.55)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* ── Header bar ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 17 }}>Post</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              {post.user_id === currentUserId && (
                <TouchableOpacity onPress={handleDeletePost}>
                  <Ionicons name="trash-outline" size={22} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setReportVisible(true)}>
                <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>

              {/* ── 1. Full-width post image ── */}
              {post.image_url ? (
                <Image
                  source={{ uri: post.image_url }}
                  style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: '100%', height: 300, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={48} color="rgba(255,255,255,0.15)" />
                </View>
              )}

              {/* ── 2. Author row ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  onPress={() => router.push(`/profile?id=${author.id}` as any)}
                  activeOpacity={0.8}
                >
                  {author.avatar_url ? (
                    <Image source={{ uri: author.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={20} color="rgba(255,255,255,0.5)" />
                    </View>
                  )}
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: '#fff', fontSize: 15 }}>
                      {author.username ?? author.full_name ?? 'User'}
                    </Text>
                    {post.location ? (
                      <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{post.location}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {author.id && <FollowButton userId={author.id} />}
              </View>

              {/* ── 3. Caption ── */}
              {post.caption ? (
                <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 14, lineHeight: 21 }}>
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold' }}>{author.username ?? 'User'} </Text>
                    {post.caption}
                  </Text>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 6 }}>
                    {post.created_at ? timeAgo(post.created_at) + ' ago' : ''}
                  </Text>
                </View>
              ) : null}

              {/* ── 4. Action row ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
                  <LikeButton post={post} size={26} showCount />
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} activeOpacity={0.7}>
                    <Ionicons name="chatbubble-outline" size={24} color="rgba(255,255,255,0.7)" />
                    {post.comments_count > 0 && (
                      <Text style={{ fontFamily: 'HelveticaNeue-Medium', color: 'rgba(255,255,255,0.55)', fontSize: 13, marginLeft: 6 }}>
                        {post.comments_count}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Ionicons name="paper-plane-outline" size={24} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Ionicons name="bookmark-outline" size={24} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setReportVisible(true)} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-horizontal" size={22} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── 5. Comments section ── */}
              <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
                <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                  Comments
                </Text>

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
            <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 28 : 12 }}>
              {replyTo && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'HelveticaNeue', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                    Replying to{' '}
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: 'rgba(255,255,255,0.8)' }}>
                      @{replyTo.username}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 999, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, minHeight: 44 }}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={{ flex: 1, fontFamily: 'HelveticaNeue', color: '#fff', fontSize: 14, paddingVertical: 10 }}
                />
                <TouchableOpacity
                  onPress={() => { if (commentText.trim()) postCommentMutation.mutate(); }}
                  disabled={!commentText.trim() || postCommentMutation.isPending}
                  style={{ paddingLeft: 10 }}
                >
                  {postCommentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FF6B35" />
                  ) : (
                    <Text style={{ fontFamily: 'HelveticaNeue-Bold', color: commentText.trim() ? '#FF6B35' : 'rgba(255,107,53,0.3)', fontSize: 15 }}>
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
    </View>
  );
}
