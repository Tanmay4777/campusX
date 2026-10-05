import { supabase } from '@/lib/supabase/client';

export interface CommunityPostWithAuthor {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  like_count: number;
  reply_count: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  author_college: string;
  author_level: number;
  liked_by_me: boolean;
}

export interface ReplyWithAuthor {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  author_level: number;
}

export const POST_CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'interview-exp', label: 'Interview Experiences' },
  { id: 'resources', label: 'Resources' },
  { id: 'projects', label: 'Project ShowCase' },
  { id: 'dsa', label: 'DSA' },
  { id: 'placement', label: 'Placement Updates' },
  { id: 'doubts', label: 'Doubts' },
  { id: 'career', label: 'Career Guidance' },
] as const;

export async function fetchPosts(
  category: string,
  searchQuery: string,
  userId: string
): Promise<CommunityPostWithAuthor[]> {
  let query = supabase
    .from('community_posts')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (searchQuery.trim()) {
    const sanitized = searchQuery.trim().replace(/[%_\\,()]/g, ' ');
    if (sanitized) {
      query = query.or(`title.ilike.%${sanitized}%,content.ilike.%${sanitized}%`);
    }
  }

  const { data: posts, error } = await query;
  if (error || !posts) return [];

  if (posts.length === 0) return [];

  const userIds = Array.from(new Set(posts.map((p) => p.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, college, level')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const postIds = posts.map((p) => p.id);
  const { data: likes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const likedPostIds = new Set((likes ?? []).map((l) => l.post_id));

  return posts.map((p) => {
    const prof = profileMap.get(p.user_id);
    return {
      ...p,
      author_name: prof?.full_name ?? 'Anonymous',
      author_avatar: prof?.avatar_url ?? null,
      author_college: prof?.college ?? '',
      author_level: prof?.level ?? 1,
      liked_by_me: likedPostIds.has(p.id),
    } as CommunityPostWithAuthor;
  });
}

export async function createPost(
  userId: string,
  title: string,
  content: string,
  category: string,
  tags: string[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('community_posts').insert({
    user_id: userId,
    title,
    content,
    category,
    tags,
  });
  return { error: error?.message ?? null };
}

export async function deletePost(postId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function toggleLike(
  postId: string,
  userId: string,
  hasLiked: boolean
): Promise<{ error: string | null; newLiked: boolean }> {
  if (hasLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) return { error: error.message, newLiked: true };
    await supabase
      .from('community_posts')
      .update({ like_count: Math.max(0, (await getLikeCount(postId)) - 1) })
      .eq('id', postId);
    return { error: null, newLiked: false };
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) return { error: error.message, newLiked: false };
    await supabase
      .from('community_posts')
      .update({ like_count: (await getLikeCount(postId)) + 1 })
      .eq('id', postId);
    return { error: null, newLiked: true };
  }
}

async function getLikeCount(postId: string): Promise<number> {
  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  return count ?? 0;
}

export async function fetchReplies(postId: string): Promise<ReplyWithAuthor[]> {
  const { data: replies, error } = await supabase
    .from('post_replies')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error || !replies) return [];
  if (replies.length === 0) return [];

  const userIds = Array.from(new Set(replies.map((r) => r.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, level')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return replies.map((r) => {
    const prof = profileMap.get(r.user_id);
    return {
      ...r,
      author_name: prof?.full_name ?? 'Anonymous',
      author_avatar: prof?.avatar_url ?? null,
      author_level: prof?.level ?? 1,
    } as ReplyWithAuthor;
  });
}

export async function createReply(
  postId: string,
  userId: string,
  content: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('post_replies').insert({
    post_id: postId,
    user_id: userId,
    content,
  });
  if (error) return { error: error.message };

  const { count } = await supabase
    .from('post_replies')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  await supabase
    .from('community_posts')
    .update({ reply_count: count ?? 0 })
    .eq('id', postId);

  return { error: null };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
