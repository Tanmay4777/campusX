'use client';

import { useEffect, useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { Loader2, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';

interface UserSkillRow {
  id: string;
  proficiency: number;
  xp: number;
  skill_id: string;
}

interface SkillRow {
  id: string;
  name: string;
  category: string;
  max_level: number;
}

interface SkillDataPoint {
  skill: string;
  shortName: string;
  proficiency: number;
  maxLevel: number;
  xp: number;
}

const shortNameMap: Record<string, string> = {
  'Python': 'Python',
  'Data Structures & Algorithms': 'DSA',
  'DBMS': 'DBMS',
  'Full-Stack Development': 'Web Dev',
  'Cloud Computing': 'Cloud',
  'CS Fundamentals': 'CS Fund',
};

export function SkillRadar() {
  const { user } = useAuth();
  const [skillData, setSkillData] = useState<SkillDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSkillProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: userSkills, error: usErr } = await supabase
        .from('user_skills')
        .select('id, proficiency, xp, skill_id')
        .eq('user_id', user.id);

      if (usErr || !userSkills || userSkills.length === 0) {
        setLoading(false);
        return;
      }

      const skillIds = userSkills.map((us) => us.skill_id);
      const { data: skills, error: sErr } = await supabase
        .from('skills')
        .select('id, name, category, max_level')
        .in('id', skillIds);

      if (sErr || !skills) {
        setLoading(false);
        return;
      }

      const skillMap = new Map<string, SkillRow>();
      for (const s of skills) {
        skillMap.set(s.id, s);
      }

      const data: SkillDataPoint[] = (userSkills as UserSkillRow[])
        .map((us) => {
          const skill = skillMap.get(us.skill_id);
          if (!skill) return null;
          return {
            skill: skill.name,
            shortName: shortNameMap[skill.name] ?? skill.name.slice(0, 8),
            proficiency: us.proficiency,
            maxLevel: skill.max_level,
            xp: us.xp,
          };
        })
        .filter((d): d is SkillDataPoint => d !== null);

      setSkillData(data);
      setLoading(false);
    }

    loadSkillProfile();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Overview</CardTitle>
          <CardDescription>Your skill profile from assessments</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (skillData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Overview</CardTitle>
          <CardDescription>Your skill profile from assessments</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No skill data yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Take skill assessments to build your visual skill profile and see your strengths at a glance.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard/assessment">
              Take Assessment
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const avgProficiency = skillData.reduce((sum, d) => sum + d.proficiency, 0) / skillData.length;
  const masteredCount = skillData.filter((d) => d.proficiency >= d.maxLevel).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Skill Overview</CardTitle>
            <CardDescription>Your skill profile from assessments</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/assessment">
              Take More
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radar Chart */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={skillData} outerRadius="75%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="shortName"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 5]}
                tickCount={6}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                stroke="hsl(var(--border))"
              />
              <Radar
                name="Proficiency"
                dataKey="proficiency"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                formatter={(value: number, _name: string, props: { payload?: SkillDataPoint }) => {
                  const payload = props?.payload;
                  return [
                    `Level ${value}/${payload?.maxLevel ?? 5} (${payload?.xp ?? 0} XP)`,
                    payload?.skill ?? 'Skill',
                  ];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 border-t pt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{skillData.length}</div>
            <div className="text-xs text-muted-foreground">Skills Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-accent">{avgProficiency.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg Proficiency</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-success">{masteredCount}</div>
            <div className="text-xs text-muted-foreground">Maxed Out</div>
          </div>
        </div>

        {/* Skill badges */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {skillData.map((d) => (
            <Badge
              key={d.skill}
              variant={d.proficiency >= d.maxLevel ? 'default' : 'secondary'}
              className="text-xs"
            >
              {d.shortName}: Lv {d.proficiency}/{d.maxLevel}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
