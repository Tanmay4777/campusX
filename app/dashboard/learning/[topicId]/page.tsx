'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  BookMarked,
  ExternalLink,
  Loader2,
  Zap,
  ArrowRight,
  Tag,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import { useGamification } from '@/components/dashboard/gamification-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTopicDetail,
  markTopicInProgress,
  markTopicCompleted,
  unmarkTopicCompleted,
  getRecommendedNextTopicForSkill,
  type TopicDetail,
  type TopicWithProgress,
} from '@/lib/learning/learning-data';
import { awardXp } from '@/lib/gamification/service';
import { XP_RULES } from '@/lib/gamification/xp-rules';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  beginner: 'text-success bg-success/10 border-success/20',
  intermediate: 'text-warning bg-warning/10 border-warning/20',
  advanced: 'text-destructive bg-destructive/10 border-destructive/20',
};

const resourceTypeConfig: Record<string, { icon: typeof Video; label: string; color: string }> = {
  video: { icon: Video, label: 'Video', color: 'text-destructive' },
  article: { icon: FileText, label: 'Article', color: 'text-primary' },
  document: { icon: BookMarked, label: 'Document', color: 'text-accent' },
};

function calculateTopicXp(topic: TopicDetail): number {
  let xp = 0;
  for (const r of topic.resources) {
    if (r.resource_type === 'video') xp += XP_RULES.LEARNING_VIDEO;
    else if (r.resource_type === 'article') xp += XP_RULES.LEARNING_ARTICLE;
    else xp += XP_RULES.LEARNING_ARTICLE;
  }
  return Math.max(xp, XP_RULES.LEARNING_ROADMAP_PHASE);
}

export default function TopicDetailPage({ params }: { params: { topicId: string } }) {
  const { topicId } = params;
  const { user, refreshProfile } = useAuth();
  const { notify } = useGamification();
  const { toast } = useToast();

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [nextTopic, setNextTopic] = useState<TopicWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }

      const detail = await fetchTopicDetail(topicId, user.id);
      if (!active) return;
      setTopic(detail);
      setLoading(false);

      if (detail) {
        const next = await getRecommendedNextTopicForSkill(user.id, detail.skill, topicId);
        if (active) setNextTopic(next);
      }
    }

    load();
    return () => { active = false; };
  }, [user, topicId]);

  const handleStart = async () => {
    if (!user || !topic) return;
    const { error } = await markTopicInProgress(user.id, topic.id);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }
    setTopic({ ...topic, status: 'in-progress' });
  };

  const handleComplete = async () => {
    if (!user || !topic) return;
    setToggling(true);

    const wasCompleted = topic.status === 'completed';

    if (wasCompleted) {
      const { error } = await unmarkTopicCompleted(user.id, topic.id);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        setToggling(false);
        return;
      }
      setTopic({ ...topic, status: 'not-started', completedAt: null });
      toast({ title: 'Topic reopened', description: `"${topic.title}" marked as incomplete` });
      setToggling(false);
      return;
    }

    const xpEarned = calculateTopicXp(topic);
    const { error } = await markTopicCompleted(user.id, topic.id, xpEarned);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      setToggling(false);
      return;
    }

    const result = await awardXp(user.id, xpEarned, {
      type: 'learning',
      title: `Topic completed: ${topic.title}`,
      description: `${topic.skill} · ${topic.difficulty}`,
    });

    if (result.achievements.length > 0) {
      notify(result.achievements);
    }

    await refreshProfile();
    setTopic({ ...topic, status: 'completed', completedAt: new Date().toISOString() });
    toast({
      title: 'Topic completed!',
      description: `+${xpEarned} XP earned for "${topic.title}"`,
    });
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/learning">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Learning
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Topic not found. It may have been removed.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = topic.status === 'completed';
  const isInProgress = topic.status === 'in-progress';

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/learning">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Learning
        </Link>
      </Button>

      {/* Topic Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{topic.skill}</Badge>
                <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', difficultyColors[topic.difficulty] ?? difficultyColors.beginner)}>
                  {topic.difficulty}
                </span>
                {isCompleted && (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {isInProgress && (
                  <Badge variant="secondary" className="gap-1">
                    <Circle className="h-3 w-3 fill-warning text-warning" />
                    In Progress
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{topic.title}</h1>
              <p className="max-w-2xl text-muted-foreground">{topic.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {topic.estimated_minutes} min
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  ~{calculateTopicXp(topic)} XP
                </span>
                {topic.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {topic.tags.join(', ')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-44">
              {!isInProgress && !isCompleted && (
                <Button onClick={handleStart} variant="outline">
                  Start Topic
                </Button>
              )}
              <Button
                onClick={handleComplete}
                disabled={toggling}
                variant={isCompleted ? 'outline' : 'default'}
              >
                {toggling ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : isCompleted ? (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    Mark Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Learning Resources</h2>
        {topic.resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No resources available for this topic yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {topic.resources.map((resource) => {
              const config = resourceTypeConfig[resource.resource_type] ?? resourceTypeConfig.article;
              const Icon = config.icon;
              return (
                <Card key={resource.id} className="group flex flex-col transition-all duration-300 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base leading-tight">{resource.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{resource.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs font-normal">{config.label}</Badge>
                      <div className="flex items-center gap-3">
                        {resource.duration_minutes > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {resource.duration_minutes} min
                          </span>
                        )}
                        {resource.source && <span>{resource.source}</span>}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Open Resource
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Next Topic */}
      {nextTopic && (
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">Recommended Next</p>
                <p className="text-sm font-semibold">{nextTopic.title}</p>
                <p className="text-xs text-muted-foreground">
                  {nextTopic.skill} · {nextTopic.difficulty}
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/dashboard/learning/${nextTopic.id}`}>
                Continue
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Track Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Track Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isCompleted ? 'You completed this topic' : isInProgress ? 'You started this topic' : 'Not started yet'}
            </span>
            <span className="font-medium">
              {isCompleted ? '100%' : isInProgress ? '50%' : '0%'}
            </span>
          </div>
          <Progress value={isCompleted ? 100 : isInProgress ? 50 : 0} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
