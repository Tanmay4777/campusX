'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Zap,
  Trophy,
  FolderKanban,
  ArrowRight,
  Calendar,
  Circle,
  Star,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { SkillRadar } from '@/components/dashboard/skill-radar';
import { LevelProgress } from '@/components/dashboard/level-progress';
import { StreakTracker } from '@/components/dashboard/streak-tracker';
import { BadgeCollection } from '@/components/dashboard/badge-collection';
import { XPHistory } from '@/components/dashboard/xp-history';
import { AIReadinessWidget } from '@/components/ai/ai-readiness-widget';
import { useAuth } from '@/components/auth-provider';
import { getLevelTitle } from '@/lib/gamification/xp-rules';

interface TopSkill {
  id: string;
  name: string;
  proficiency: number;
  totalLevels: number;
  xp: number;
}

interface QuickCounts {
  projects: number;
  skills: number;
}

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rank, setRank] = useState<number | null>(null);
  const [topSkills, setTopSkills] = useState<TopSkill[]>([]);
  const [counts, setCounts] = useState<QuickCounts>({ projects: 0, skills: 0 });
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const displayName = profile?.full_name?.split(' ')[0] || 'Student';
  const totalXp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const streak = profile?.streak ?? 0;
  const levelTitle = getLevelTitle(level);

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      if (!user) {
        setRank(null);
        setTopSkills([]);
        setCounts({ projects: 0, skills: 0 });
        return;
      }

      const [{ count: higherXpCount }, { data: userSkills }, { count: projectCount }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('xp', totalXp),
        supabase
          .from('user_skills')
          .select('skill_id, proficiency, xp')
          .eq('user_id', user.id),
        supabase
          .from('user_projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      if (!active) return;

      setRank(higherXpCount != null ? higherXpCount + 1 : null);
      setCounts({
        projects: projectCount ?? 0,
        skills: userSkills?.length ?? 0,
      });

      if (userSkills && userSkills.length > 0) {
        const skillIds = userSkills.map((s) => s.skill_id);
        const { data: skillRows } = await supabase
          .from('skills')
          .select('id, name, max_level')
          .in('id', skillIds);

        if (!active) return;

        const skillMap = new Map((skillRows ?? []).map((s) => [s.id, s]));
        const merged = userSkills.flatMap((us) => {
          const skill = skillMap.get(us.skill_id);
          if (!skill) return [];
          return [{
            id: skill.id,
            name: skill.name,
            proficiency: us.proficiency,
            totalLevels: skill.max_level,
            xp: us.xp,
          }];
        });
        setTopSkills(merged.sort((a, b) => b.xp - a.xp).slice(0, 4));
      } else {
        setTopSkills([]);
      }
    }

    loadDashboardData();
    return () => { active = false; };
  }, [user, totalXp, refreshKey]);

  const stats = [
    { label: 'Current Level', value: level, sub: levelTitle, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Day Streak', value: streak, sub: streak === 1 ? 'day' : 'days', icon: Flame, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Global Rank', value: rank ? `#${rank}` : '—', sub: rank ? 'by XP' : 'earn XP', icon: Trophy, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Total XP', value: totalXp.toLocaleString(), sub: 'points', icon: Star, color: 'text-success', bg: 'bg-success/10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, {displayName}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            {streak > 0
              ? `You're on a ${streak}-day streak. Keep the momentum going!`
              : 'Complete an activity today to start your streak!'}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/assessment">
            Take Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground/70">{stat.sub}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Level, Badges, Skills */}
        <div className="space-y-6 lg:col-span-2">
          {/* Level & XP Progress */}
          <LevelProgress totalXp={totalXp} />

          {/* Badges */}
          <BadgeCollection refreshKey={refreshKey} />

          {/* Top Skills */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Skills</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/skills">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topSkills.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No skills assessed yet. Take an assessment to see your proficiency here.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/assessment">Take Assessment</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {topSkills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Lv {skill.proficiency}/{skill.totalLevels}
                        </Badge>
                      </div>
                      <Progress value={(skill.proficiency / skill.totalLevels) * 100} className="h-1.5" />
                      <div className="text-xs text-muted-foreground">
                        {skill.xp.toLocaleString()} XP
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — AI Readiness, Streak, Radar, XP History, Goals */}
        <div className="space-y-6">
          {/* AI Readiness Score */}
          <AIReadinessWidget />
          {/* Streak Tracker */}
          <StreakTracker currentStreak={streak} refreshKey={refreshKey} />

          {/* Skill Radar */}
          <SkillRadar />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <FolderKanban className="mx-auto h-5 w-5 text-primary" />
                <div className="mt-2 text-xl font-bold">{counts.projects}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="mx-auto h-5 w-5 text-accent" />
                <div className="mt-2 text-xl font-bold">{counts.skills}</div>
                <div className="text-xs text-muted-foreground">Skills Tracked</div>
              </CardContent>
            </Card>
          </div>

          {/* XP History */}
          <XPHistory refreshKey={refreshKey} />

          {/* Today's Goal */}
          <Card className="overflow-hidden border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Today&apos;s Goal</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {streak > 0
                  ? 'Keep your streak alive by completing one activity today.'
                  : 'Start your streak by completing your first activity today.'}
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <Link href="/dashboard/assessment" className="text-muted-foreground hover:text-primary">
                    Take a skill assessment
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <Link href="/dashboard/interview" className="text-muted-foreground hover:text-primary">
                    Practice a mock interview
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <Link href="/dashboard/projects" className="text-muted-foreground hover:text-primary">
                    Start or continue a project
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
