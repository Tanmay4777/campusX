import { supabase } from '@/lib/supabase/client';
import type { LearningTopic, LearningResource, UserLearningProgress } from '@/lib/database.types';

export interface TopicWithProgress extends LearningTopic {
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt: string | null;
  resourceCount: number;
}

export interface TopicDetail extends TopicWithProgress {
  resources: LearningResource[];
}

export interface LearningTrack {
  skill: string;
  track: string;
  topics: TopicWithProgress[];
  completedCount: number;
  totalCount: number;
  progressPct: number;
}

export interface RecommendedTopic {
  topic: TopicWithProgress;
  reason: string;
}

export async function fetchAllTopics(userId: string): Promise<TopicWithProgress[]> {
  const { data: topics, error } = await supabase
    .from('learning_topics')
    .select('*')
    .order('skill')
    .order('order_index');

  if (error || !topics) return [];

  const { data: progress } = await supabase
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId);

  const progressMap = new Map<string, UserLearningProgress>();
  for (const p of progress ?? []) {
    progressMap.set(p.topic_id, p);
  }

  const { data: resourceCounts } = await supabase
    .from('learning_resources')
    .select('topic_id');

  const countMap = new Map<string, number>();
  for (const r of resourceCounts ?? []) {
    countMap.set(r.topic_id, (countMap.get(r.topic_id) ?? 0) + 1);
  }

  return topics.map((t) => {
    const p = progressMap.get(t.id);
    return {
      ...t,
      status: (p?.status === 'completed' ? 'completed' : p?.status === 'in_progress' ? 'in-progress' : 'not-started') as TopicWithProgress['status'],
      completedAt: p?.completed_at ?? null,
      resourceCount: countMap.get(t.id) ?? 0,
    };
  });
}

export function groupTopicsByTrack(topics: TopicWithProgress[]): LearningTrack[] {
  const trackMap = new Map<string, TopicWithProgress[]>();
  for (const t of topics) {
    const key = `${t.skill}__${t.track}`;
    const arr = trackMap.get(key) ?? [];
    arr.push(t);
    trackMap.set(key, arr);
  }

  const tracks: LearningTrack[] = [];
  const entries = Array.from(trackMap.entries());
  for (const [key, ts] of entries) {
    const [skill, track] = key.split('__');
    const completed = ts.filter((t) => t.status === 'completed').length;
    tracks.push({
      skill,
      track,
      topics: ts.sort((a, b) => a.order_index - b.order_index),
      completedCount: completed,
      totalCount: ts.length,
      progressPct: ts.length > 0 ? Math.round((completed / ts.length) * 100) : 0,
    });
  }

  return tracks.sort((a, b) => a.skill.localeCompare(b.skill));
}

export async function fetchTopicDetail(topicId: string, userId: string): Promise<TopicDetail | null> {
  const { data: topic, error } = await supabase
    .from('learning_topics')
    .select('*')
    .eq('id', topicId)
    .maybeSingle();

  if (error || !topic) return null;

  const { data: resources } = await supabase
    .from('learning_resources')
    .select('*')
    .eq('topic_id', topicId)
    .order('order_index');

  const { data: progress } = await supabase
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .maybeSingle();

  return {
    ...topic,
    status: (progress?.status === 'completed' ? 'completed' : progress?.status === 'in_progress' ? 'in-progress' : 'not-started') as TopicWithProgress['status'],
    completedAt: progress?.completed_at ?? null,
    resourceCount: resources?.length ?? 0,
    resources: resources ?? [],
  };
}

export async function markTopicInProgress(userId: string, topicId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_learning_progress')
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        status: 'in_progress',
      },
      { onConflict: 'user_id,topic_id' }
    );

  return { error: error?.message ?? null };
}

export async function markTopicCompleted(
  userId: string,
  topicId: string,
  xpEarned: number
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_learning_progress')
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        xp_earned: xpEarned,
      },
      { onConflict: 'user_id,topic_id' }
    );

  return { error: error?.message ?? null };
}

export async function unmarkTopicCompleted(userId: string, topicId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_learning_progress')
    .delete()
    .eq('user_id', userId)
    .eq('topic_id', topicId);

  return { error: error?.message ?? null };
}

export async function getRecommendedNextTopic(userId: string): Promise<RecommendedTopic | null> {
  const topics = await fetchAllTopics(userId);
  if (topics.length === 0) return null;

  const inProgress = topics.find((t) => t.status === 'in-progress');
  if (inProgress) {
    return { topic: inProgress, reason: 'Continue where you left off' };
  }

  const notStarted = topics.filter((t) => t.status === 'not-started');
  if (notStarted.length > 0) {
    const first = notStarted.sort((a, b) => a.order_index - b.order_index)[0];
    return { topic: first, reason: 'Start your next topic' };
  }

  return null;
}

export async function getRecommendedNextTopicForSkill(
  userId: string,
  skill: string,
  excludeTopicId: string
): Promise<TopicWithProgress | null> {
  const topics = await fetchAllTopics(userId);
  const skillTopics = topics
    .filter((t) => t.skill === skill && t.id !== excludeTopicId && t.status !== 'completed')
    .sort((a, b) => a.order_index - b.order_index);
  return skillTopics[0] ?? null;
}
