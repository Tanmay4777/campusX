'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Zap, Award, Flame, Trophy } from 'lucide-react';
import type { AchievementEvent } from '@/lib/gamification/service';
import { getLevelTitle } from '@/lib/gamification/xp-rules';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Award, Flame, Trophy,
};

export function AchievementNotifier({ achievements }: { achievements: AchievementEvent[] }) {
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const event of achievements) {
      const key = `${event.type}-${event.level ?? ''}-${event.badgeSlug ?? ''}-${event.streak ?? ''}`;
      if (shownRef.current.has(key)) continue;
      shownRef.current.add(key);

      if (event.type === 'level_up' && event.level) {
        toast.success(`Level Up! You reached Level ${event.level}`, {
          description: `You are now a ${getLevelTitle(event.level)}${event.xpGained ? ` • +${event.xpGained} XP` : ''}`,
          icon: <Zap className="h-4 w-4 text-primary" />,
          duration: 5000,
        });
      } else if (event.type === 'badge_unlocked' && event.badgeName) {
        const Icon = iconMap[event.badgeIcon ?? 'Award'] ?? Award;
        toast.success(`Badge Unlocked: ${event.badgeName}`, {
          description: `${event.xpGained ? `+${event.xpGained} XP reward` : ''}`,
          icon: <Icon className="h-4 w-4 text-accent" />,
          duration: 5000,
        });
      } else if (event.type === 'streak_milestone' && event.streak) {
        toast.success(`${event.streak}-Day Streak!`, {
          description: 'Keep coming back to build your streak!',
          icon: <Flame className="h-4 w-4 text-warning" />,
          duration: 4000,
        });
      }
    }
  }, [achievements]);

  return null;
}
