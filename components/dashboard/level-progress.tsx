'use client';

import { Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getXpForCurrentLevel, getLevelTitle, MAX_LEVEL } from '@/lib/gamification/xp-rules';

interface LevelProgressProps {
  totalXp: number;
}

export function LevelProgress({ totalXp }: LevelProgressProps) {
  const info = getXpForCurrentLevel(totalXp);
  const title = getLevelTitle(info.level);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Level {info.level}</h3>
              <Badge variant="secondary" className="text-xs">{title}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {info.nextLevel
                ? `${info.xpForNextLevel.toLocaleString()} XP to Level ${info.nextLevel}`
                : 'Max level reached!'}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-4">
          <Progress value={info.progressPct} className="h-3" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{totalXp.toLocaleString()} total XP</span>
            {info.nextLevel ? (
              <span>{info.nextLevelXp.toLocaleString()} XP</span>
            ) : (
              <span className="flex items-center gap-1 text-warning">
                <TrendingUp className="h-3 w-3" />
                Maxed
              </span>
            )}
          </div>
        </div>
        {info.nextLevel && (
          <div className="mt-3 grid grid-cols-7 gap-1">
            {Array.from({ length: MAX_LEVEL }).map((_, i) => {
              const lvl = i + 1;
              const isDone = lvl <= info.level;
              const isCurrent = lvl === info.level;
              return (
                <div
                  key={lvl}
                  className={`h-1.5 rounded-full transition-all ${
                    isDone ? 'bg-primary' : 'bg-secondary'
                  } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
