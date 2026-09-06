'use client';

import { useEffect, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

interface StreakTrackerProps {
  currentStreak: number;
  refreshKey?: number;
}

export function StreakTracker({ currentStreak, refreshKey }: StreakTrackerProps) {
  const { user } = useAuth();
  const [streakDays, setStreakDays] = useState<boolean[]>(Array(7).fill(false));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStreak() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('streak_log')
        .select('activity_date')
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false })
        .limit(7);

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = new Set(data.map((d) => d.activity_date));

      const last7: boolean[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7.push(dates.has(dateStr));
      }
      setStreakDays(last7.reverse());
      setLoading(false);
    }
    loadStreak();
  }, [user, refreshKey]);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <Card className="overflow-hidden border-warning/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-warning" />
              Streak
            </CardTitle>
            <CardDescription>Keep your momentum going</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-warning">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">days</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex justify-between gap-1.5">
            {streakDays.map((active, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-all',
                    active
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-secondary text-muted-foreground',
                    i === todayIdx && !active && 'ring-2 ring-warning/30'
                  )}
                >
                  {active ? <Flame className="h-4 w-4" /> : dayLabels[i]}
                </div>
                <span className={cn(
                  'text-[10px]',
                  i === todayIdx ? 'font-bold text-warning' : 'text-muted-foreground'
                )}>
                  {i === todayIdx ? 'Today' : dayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
