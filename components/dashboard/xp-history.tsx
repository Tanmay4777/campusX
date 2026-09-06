'use client';

import { useEffect, useState } from 'react';
import { Zap, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import type { UserActivity } from '@/lib/database.types';

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  quiz: Zap,
  assessment: Zap,
  dsa: Zap,
  project: Zap,
  interview: Zap,
  learning: Zap,
  badge: Zap,
  streak: Zap,
  'skill-up': Zap,
  milestone: Zap,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
}

interface XPHistoryProps {
  refreshKey?: number;
}

export function XPHistory({ refreshKey }: XPHistoryProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setActivities(data ?? []);
      setLoading(false);
    }
    loadActivity();
  }, [user, refreshKey]);

  const totalXpToday = activities
    .filter((a) => {
      const today = new Date().toISOString().split('T')[0];
      return a.created_at.startsWith(today);
    })
    .reduce((sum, a) => sum + a.xp, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">XP History</CardTitle>
            <CardDescription>Your recent XP earnings</CardDescription>
          </div>
          <UiBadge variant="secondary" className="gap-1">
            <Zap className="h-3 w-3" />
            +{totalXpToday} today
          </UiBadge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No XP earned yet</p>
            <p className="text-xs text-muted-foreground/70">Complete activities to start earning XP</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => {
              const Icon = activityIcons[item.activity_type] ?? Zap;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{timeAgo(item.created_at)}</p>
                  </div>
                  <UiBadge variant="outline" className="shrink-0 text-xs text-primary">
                    +{item.xp}
                  </UiBadge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
