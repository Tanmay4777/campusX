'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Heart, MessageCircle, Trash2, Send,
  Users, Pin, Loader2, ArrowLeft, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchPosts, createPost, deletePost, toggleLike, fetchReplies, createReply,
  timeAgo, POST_CATEGORIES,
  type CommunityPostWithAuthor, type ReplyWithAuthor,
} from '@/lib/community/community-data';
import { cn } from '@/lib/utils';

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  // new post form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newTags, setNewTags] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // selected post view
  const [selectedPost, setSelectedPost] = useState<CommunityPostWithAuthor | null>(null);
  const [replies, setReplies] = useState<ReplyWithAuthor[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPosts(category, searchQuery, user.id);
      setPosts(data);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, category, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(loadPosts, 300);
    return () => clearTimeout(debounce);
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!user) return;
    if (!newTitle.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);
      const { error } = await createPost(user.id, newTitle, newContent, newCategory, tags);
      if (error) {
        toast({ title: 'Failed to create post', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Post created!' });
      setNewTitle(''); setNewContent(''); setNewTags(''); setNewCategory('general');
      setShowNewPost(false);
      loadPosts();
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (post: CommunityPostWithAuthor) => {
    if (!user) return;
    const { error, newLiked } = await toggleLike(post.id, user.id, post.liked_by_me);
    if (error) {
      toast({ title: 'Failed to update like', description: error, variant: 'destructive' });
      return;
    }
    setPosts((prev) => prev.map((p) =>
      p.id === post.id
        ? { ...p, liked_by_me: newLiked, like_count: newLiked ? p.like_count + 1 : Math.max(0, p.like_count - 1) }
        : p
    ));
    if (selectedPost?.id === post.id) {
      setSelectedPost((prev) => prev ? { ...prev, liked_by_me: newLiked, like_count: newLiked ? prev.like_count + 1 : Math.max(0, prev.like_count - 1) } : prev);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    const { error } = await deletePost(postId, user.id);
    if (error) {
      toast({ title: 'Failed to delete', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Post deleted' });
    loadPosts();
  };

  const openPost = async (post: CommunityPostWithAuthor) => {
    setSelectedPost(post);
    setLoadingReplies(true);
    try {
      const data = await fetchReplies(post.id);
      setReplies(data);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const { error } = await createReply(selectedPost.id, user.id, replyContent);
      if (error) {
        toast({ title: 'Failed to post reply', description: error, variant: 'destructive' });
        return;
      }
      setReplyContent('');
      const data = await fetchReplies(selectedPost.id);
      setReplies(data);
      setPosts((prev) => prev.map((p) =>
        p.id === selectedPost.id ? { ...p, reply_count: p.reply_count + 1 } : p
      ));
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // ===== Post Detail View =====
  if (selectedPost) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to posts
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedPost.author_avatar ?? undefined} />
                <AvatarFallback>{initials(selectedPost.author_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedPost.author_name}</span>
                  <Badge variant="outline" className="text-xs">Lvl {selectedPost.author_level}</Badge>
                  {selectedPost.pinned && <Pin className="h-3 w-3 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{selectedPost.author_college} · {timeAgo(selectedPost.created_at)}</p>
              </div>
            </div>
            <h1 className="mt-4 text-xl font-bold">{selectedPost.title}</h1>
            {selectedPost.content && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{selectedPost.content}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPost.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4 border-t pt-3">
              <button
                onClick={() => handleLike(selectedPost)}
                className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
              >
                <Heart className={cn('h-4 w-4', selectedPost.liked_by_me && 'fill-primary text-primary')} />
                {selectedPost.like_count}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {replies.length} replies
              </span>
              {selectedPost.user_id === user?.id && (
                <button
                  onClick={() => { handleDelete(selectedPost.id); setSelectedPost(null); }}
                  className="ml-auto text-sm text-destructive transition-colors hover:text-destructive/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Replies ({replies.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingReplies ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : replies.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No replies yet. Be the first to respond!
              </p>
            ) : (
              replies.map((r) => (
                <div key={r.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={r.author_avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{initials(r.author_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.author_name}</span>
                      <Badge variant="outline" className="text-[10px]">Lvl {r.author_level}</Badge>
                      <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{r.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* Reply Input */}
            <div className="flex gap-2 border-t pt-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleReply}
                disabled={submittingReply || !replyContent.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== List View =====
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Community</h1>
          <p className="mt-1 text-muted-foreground">
            Connect with peers, ask questions, and share your journey.
          </p>
        </div>
        <Button onClick={() => setShowNewPost(!showNewPost)}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Post title..."
            />
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Share your thoughts, ask a question, or post a resource..."
              className="min-h-[100px]"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Tags (comma-separated, e.g. react, hooks)"
                className="flex-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewPost(false)}>Cancel</Button>
              <Button onClick={handleCreatePost} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {POST_CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No posts yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {searchQuery ? 'No posts match your search.' : 'Be the first to start a discussion!'}
              </p>
            </div>
            {!searchQuery && (
              <Button size="sm" onClick={() => setShowNewPost(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Create Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => openPost(post)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={post.author_avatar ?? undefined} />
                    <AvatarFallback className="text-xs">{initials(post.author_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{post.author_name}</span>
                      <Badge variant="outline" className="text-[10px]">Lvl {post.author_level}</Badge>
                      {post.pinned && <Pin className="h-3 w-3 text-primary" />}
                      <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                    </div>
                    <h3 className="mt-1.5 font-semibold leading-snug">{post.title}</h3>
                    {post.content && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.content}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {POST_CATEGORIES.find((c) => c.id === post.category)?.label ?? post.category}
                      </Badge>
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 border-t pt-2.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className={cn('h-3.5 w-3.5', post.liked_by_me && 'fill-primary text-primary')} />
                    {post.like_count}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {post.reply_count}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
