'use client';

import { useEffect, useState } from 'react';
import { Brain, TrendingUp, Loader2, AlertCircle, Lightbulb, Target, Zap } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-provider';
import { getReadinessScore, type ReadinessScore } from '@/lib/ai/ai-service';
import { cn } from '@/lib/utils';

export function AIReadinessWidget() {
  const { user, profile } = useAuth();
  const [score, setScore] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const result = await getReadinessScore(user.id, profile?.target_role);
        if (!cancelled) setScore(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load readiness score');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.target_role]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Analyzing your readiness...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load your readiness score.</p>
          <Button size="sm" variant="outline" onClick={() => setLoading(true)}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!score) return null;

  const scoreColor = score.overall >= 70 ? 'text-success' : score.overall >= 40 ? 'text-warning' : 'text-destructive';
  const scoreBg = score.overall >= 70 ? 'bg-success/10' : score.overall >= 40 ? 'bg-warning/10' : 'bg-destructive/10';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-5 w-5 text-primary" />
          AI Placement Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className={cn('flex h-16 w-16 items-center justify-center rounded-xl', scoreBg)}>
            <span className={cn('text-2xl font-bold', scoreColor)}>{score.overall}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Overall Readiness</p>
            <p className="text-xs text-muted-foreground">
              {score.overall >= 70 ? 'Ready for placements!' : score.overall >= 40 ? 'Getting there — keep pushing!' : 'Needs significant improvement'}
            </p>
            <Progress value={score.overall} className="mt-2 h-2" />
          </div>
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {score.factors.map((f) => (
            <div key={f.label} className="rounded-lg border p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{f.label}</span>
                <span className={cn(
                  'text-xs font-bold',
                  f.score >= 70 ? 'text-success' : f.score >= 40 ? 'text-warning' : 'text-destructive'
                )}>{f.score}</span>
              </div>
              <Progress value={f.score} className="mt-1 h-1" />
            </div>
          ))}
        </div>

        {/* Top Recommendation */}
        {score.recommendations.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium">AI Recommendation</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{score.recommendations[0]}</p>
            </div>
          </div>
        )}

        <Button size="sm" variant="outline" className="w-full" asChild>
          <Link href="/dashboard/ai">
            <Target className="mr-2 h-4 w-4" />
            View Full AI Analysis
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
