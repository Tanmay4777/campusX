'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowRight,
  Loader2,
  Search,
  GraduationCap,
  Video,
  FileText,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import {
  fetchAllTopics,
  groupTopicsByTrack,
  getRecommendedNextTopic,
  type TopicWithProgress,
  type LearningTrack,
  type RecommendedTopic,
} from '@/lib/learning/learning-data';
import { cn } from '@/lib/utils';

const skillFilters = ['All', 'Java', 'DSA', 'SQL', 'React', 'Spring Boot', 'Git', 'Docker', 'AWS'];
const difficultyColors: Record<string, string> = {
  beginner: 'text-success bg-success/10 border-success/20',
  intermediate: 'text-warning bg-warning/10 border-warning/20',
  advanced: 'text-destructive bg-destructive/10 border-destructive/20',
};

export default function LearningPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [recommended, setRecommended] = useState<RecommendedTopic | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setTopics([]);
        setLoading(false);
        return;
      }

      try {
        const [allTopics, rec] = await Promise.all([
          fetchAllTopics(user.id),
          getRecommendedNextTopic(user.id),
        ]);

        if (!active) return;
        setTopics(allTopics);
        setRecommended(rec);
      } catch {
        if (active) setError('Failed to load data. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [user]);

  const tracks: LearningTrack[] = useMemo(() => {
    const filtered = topics.filter((t) => {
      const matchesFilter = filter === 'All' || t.skill === filter;
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
    return groupTopicsByTrack(filtered);
  }, [topics, filter, search]);

  const totalCompleted = topics.filter((t) => t.status === 'completed').length;
  const totalInProgress = topics.filter((t) => t.status === 'in-progress').length;
  const overallPct = topics.length > 0 ? Math.round((totalCompleted / topics.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Learning</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Learning</h1>
        <p className="mt-1 text-muted-foreground">
          Explore curated topics with videos, articles, and docs. Complete topics to earn XP and progress your roadmap.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Topics Completed</p>
                <p className="mt-1 text-2xl font-bold">{totalCompleted}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="mt-1 text-2xl font-bold">{totalInProgress}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <PlayCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="mt-1 text-2xl font-bold">{overallPct}%</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Next Topic */}
      {recommended && (
        <Card className="overflow-hidden border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary">{recommended.reason}</p>
                <p className="text-sm font-semibold">{recommended.topic.title}</p>
                <p className="text-xs text-muted-foreground">
                  {recommended.topic.skill} · {recommended.topic.estimated_minutes} min
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={`/dashboard/learning/${recommended.topic.id}`}>
                Start
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {skillFilters.map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {tracks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No topics match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tracks.map((track) => (
            <div key={`${track.skill}-${track.track}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">{track.skill}</h2>
                  <Badge variant="outline" className="text-xs">{track.track}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {track.completedCount}/{track.totalCount} completed
                </span>
              </div>
              <Progress value={track.progressPct} className="mb-4 h-1.5" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {track.topics.map((topic) => (
                  <Link key={topic.id} href={`/dashboard/learning/${topic.id}`}>
                    <Card className="group flex h-full flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base leading-tight">{topic.title}</CardTitle>
                          {topic.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                          ) : topic.status === 'in-progress' ? (
                            <PlayCircle className="h-5 w-5 shrink-0 text-warning" />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                        {topic.description && (
                          <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className={cn('rounded-full border px-2 py-0.5 font-medium', difficultyColors[topic.difficulty] ?? difficultyColors.beginner)}>
                            {topic.difficulty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {topic.estimated_minutes} min
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Video className="h-3 w-3" />
                          <FileText className="h-3 w-3" />
                          {topic.resourceCount} resources
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
