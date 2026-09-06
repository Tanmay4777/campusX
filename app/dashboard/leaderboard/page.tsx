'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Trophy, Flame, TrendingUp, Zap, Star, Award,
  Loader2, Crown, Medal, Target, type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import {
  fetchXpLeaderboard, fetchSkillLeaderboard, fetchMostImproved,
  type LeaderboardEntry, type SkillLeaderboardEntry, type ImprovedUserEntry,
  type LeaderboardPeriod,
} from '@/lib/leaderboard/leaderboard-data';
import { cn } from '@/lib/utils';

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const rankConfig: { icon: LucideIcon; color: string; bg: string }[] = [
  { icon: Crown, color: 'text-warning', bg: 'bg-warning/10' },
  { icon: Medal, color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Award, color: 'text-accent', bg: 'bg-accent/10' },
];

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [xpEntries, setXpEntries] = useState<LeaderboardEntry[]>([]);
  const [skillEntries, setSkillEntries] = useState<SkillLeaderboardEntry[]>([]);
  const [improvedEntries, setImprovedEntries] = useState<ImprovedUserEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [xp, skills, improved] = await Promise.all([
      fetchXpLeaderboard(period, user.id),
      fetchSkillLeaderboard(user.id),
      fetchMostImproved(user.id),
    ]);
    setXpEntries(xp);
    setSkillEntries(skills);
    setImprovedEntries(improved);
    setLoading(false);
  }, [user, period]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const myXpRank = xpEntries.find((e) => e.is_current_user)?.rank;
  const myXpEntry = xpEntries.find((e) => e.is_current_user);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-muted-foreground">
          Compete with students nationwide and climb the ranks.
        </p>
      </div>

      {/* Your Stats */}
      {profile && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                  <p className="text-xl font-bold">
                    {myXpRank ? `#${myXpRank}` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Flame className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Streak</p>
                  <p className="text-xl font-bold">{profile.streak} days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-xl font-bold">Lvl {profile.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-xl font-bold">{(myXpEntry?.xp ?? profile.xp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="xp">
        <TabsList>
          <TabsTrigger value="xp">XP Rankings</TabsTrigger>
          <TabsTrigger value="skills">Top Skills</TabsTrigger>
          <TabsTrigger value="improved">Most Improved</TabsTrigger>
        </TabsList>

        {/* XP Leaderboard */}
        <TabsContent value="xp" className="space-y-4">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}>
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="all-time">All-Time</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : xpEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No data for this period yet. Start earning XP to appear on the leaderboard!
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top 3 Podium */}
              {xpEntries.length >= 3 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 0, 2].map((idx) => {
                    const entry = xpEntries[idx];
                    const config = rankConfig[idx];
                    return (
                      <Card
                        key={entry.user_id}
                        className={cn(
                          'flex flex-col items-center p-5 text-center transition-all',
                          idx === 0 && 'sm:order-2 sm:-translate-y-2 sm:shadow-lg',
                          idx === 1 && 'sm:order-1',
                          idx === 2 && 'sm:order-3',
                        )}
                      >
                        <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', config.bg)}>
                          <config.icon className={cn('h-7 w-7', config.color)} />
                        </div>
                        <Avatar className="mt-2 h-12 w-12">
                          <AvatarImage src={entry.avatar_url ?? undefined} />
                          <AvatarFallback>{initials(entry.full_name)}</AvatarFallback>
                        </Avatar>
                        <p className="mt-2 truncate text-sm font-semibold">{entry.full_name}</p>
                        <p className="text-xs text-muted-foreground">{entry.college}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          <span className="text-lg font-bold">{entry.xp.toLocaleString()}</span>
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">Lvl {entry.level}</Badge>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Rest of leaderboard */}
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {xpEntries.slice(3).map((entry) => (
                      <div
                        key={entry.user_id}
                        className={cn(
                          'flex items-center gap-3 p-4',
                          entry.is_current_user && 'bg-primary/5'
                        )}
                      >
                        <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                          {entry.rank}
                        </span>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={entry.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">{initials(entry.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{entry.full_name}</span>
                            {entry.is_current_user && (
                              <Badge variant="secondary" className="text-[10px]">You</Badge>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{entry.college}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5 text-accent" />
                            {entry.badge_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-warning" />
                            {entry.streak}
                          </span>
                          <span className="flex items-center gap-1 font-bold">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            {entry.xp.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Skill Leaderboard */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Top Skill Performers
              </CardTitle>
              <CardDescription>Students with the highest skill XP across all skills</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : skillEntries.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No skill data yet. Take an assessment to build your skill profile!
                </p>
              ) : (
                <div className="divide-y">
                  {skillEntries.slice(0, 30).map((entry) => (
                    <div
                      key={`${entry.user_id}-${entry.skill_name}`}
                      className={cn(
                        'flex items-center gap-3 p-4',
                        entry.is_current_user && 'bg-primary/5'
                      )}
                    >
                      <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(entry.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{entry.full_name}</span>
                          {entry.is_current_user && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.skill_name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div
                                key={n}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  n <= entry.proficiency ? 'bg-primary' : 'bg-muted'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">Lv {entry.proficiency}</span>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-bold">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          {entry.skill_xp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Most Improved */}
        <TabsContent value="improved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Most Improved This Month
              </CardTitle>
              <CardDescription>
                Students who have accelerated the most compared to last month
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : improvedEntries.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Not enough data yet. Keep earning XP to see your improvement here!
                </p>
              ) : (
                <div className="divide-y">
                  {improvedEntries.slice(0, 20).map((entry) => (
                    <div
                      key={entry.user_id}
                      className={cn(
                        'flex items-center gap-3 p-4',
                        entry.is_current_user && 'bg-primary/5'
                      )}
                    >
                      <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">{initials(entry.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{entry.full_name}</span>
                          {entry.is_current_user && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{entry.college}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">This month</p>
                          <p className="flex items-center gap-1 text-sm font-bold text-primary">
                            <Zap className="h-3 w-3" />
                            {entry.xp_this_period}
                          </p>
                        </div>
                        <div className={cn(
                          'flex flex-col items-center rounded-lg px-2 py-1',
                          entry.improvement_pct > 0 ? 'bg-success/10' : 'bg-muted'
                        )}>
                          <span className={cn(
                            'flex items-center gap-0.5 text-sm font-bold',
                            entry.improvement_pct > 0 ? 'text-success' : 'text-muted-foreground'
                          )}>
                            <TrendingUp className="h-3 w-3" />
                            {entry.improvement_pct > 0 ? '+' : ''}{entry.improvement_pct}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">vs last month</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
