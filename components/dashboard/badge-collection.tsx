'use client';

import { useEffect, useState } from 'react';
import { Award, Lock, Loader2, Target, Star, Flame, Code, Boxes, Swords, FolderKanban, Briefcase, Zap, Sparkles, Mic, Trophy, GraduationCap } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge as UiBadge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { BADGE_DEFINITIONS, RARITY_COLORS } from '@/lib/gamification/badges';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Award, Target, Star, Flame, Code, Boxes, Swords, FolderKanban, Briefcase,
  Zap, Sparkles, Mic, Trophy, GraduationCap,
};

interface BadgeCollectionProps {
  refreshKey?: number;
}

export function BadgeCollection({ refreshKey }: BadgeCollectionProps) {
  const { user } = useAuth();
  const [earnedSlugs, setEarnedSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBadges() {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: userBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      const { data: allBadges } = await supabase
        .from('badges')
        .select('id, slug');

      if (!userBadges || !allBadges) {
        setLoading(false);
        return;
      }

      const slugMap = new Map(allBadges.map((b) => [b.id, b.slug]));
      const earned = new Set<string>();
      for (const ub of userBadges) {
        const slug = slugMap.get(ub.badge_id);
        if (slug) earned.add(slug);
      }
      setEarnedSlugs(earned);
      setLoading(false);
    }
    loadBadges();
  }, [user, refreshKey]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges</CardTitle>
          <CardDescription>Achievements you&apos;ve unlocked</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const earnedCount = earnedSlugs.size;
  const totalCount = BADGE_DEFINITIONS.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Badges</CardTitle>
            <CardDescription>{earnedCount} of {totalCount} unlocked</CardDescription>
          </div>
          <UiBadge variant="secondary">{earnedCount}/{totalCount}</UiBadge>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {BADGE_DEFINITIONS.map((def) => {
              const isEarned = earnedSlugs.has(def.slug);
              const Icon = iconMap[def.iconName] ?? Award;
              const rarity = RARITY_COLORS[def.rarity] ?? RARITY_COLORS.common;
              return (
                <Tooltip key={def.slug}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-all',
                        isEarned
                          ? cn(rarity.border, rarity.bg, 'cursor-pointer hover:scale-105')
                          : 'border-border bg-muted/30 opacity-50'
                      )}
                    >
                      {isEarned ? (
                        <Icon className={cn('h-5 w-5', rarity.text)} />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(
                        'text-[10px] font-medium text-center leading-tight',
                        isEarned ? rarity.text : 'text-muted-foreground'
                      )}>
                        {def.name}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[180px]">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{def.name}</p>
                      <p className="text-xs text-muted-foreground">{def.description}</p>
                      <p className={cn('text-xs font-medium', rarity.text)}>
                        {rarity.label} • +{def.xpReward} XP
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
