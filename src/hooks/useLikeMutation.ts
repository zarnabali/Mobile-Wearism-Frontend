import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

export function useLikeMutation(post: { id: string, viewer_has_liked: boolean, likes_count: number }, feedType?: 'home' | 'trending') {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.post(`/posts/${post.id}/like`),
    onMutate: async () => {
      if (feedType) {
        await qc.cancelQueries({ queryKey: ['feed', feedType] });
        const prevFeed = qc.getQueryData(['feed', feedType]);

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
      if (ctx?.feedKey && ctx?.prevFeed) qc.setQueryData(ctx.feedKey, ctx.prevFeed);
      if (ctx?.postKey && ctx?.prevPost) qc.setQueryData(ctx.postKey, ctx.prevPost);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post', post.id] });
      qc.invalidateQueries({ queryKey: ['feed'] });
      qc.invalidateQueries({ queryKey: ['search-explore'] });
    },
  });
}
