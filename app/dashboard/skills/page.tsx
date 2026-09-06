'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  Boxes, Atom, Code, Database, Network, Calculator,
  Server, MessageCircle, Cloud, Coffee, Lock, ArrowRight,
  Target,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

interface SkillCard {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  totalLevels: number;
  xp: number;
  xpToNext: number;
  icon: string;
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  Boxes, Atom, Code, Database, Network, Calculator,
  Server, MessageCircle, Cloud, Coffee,
};

const categories = ['All', 'Programming', 'DSA', 'Web Dev', 'Database', 'System Design', 'Aptitude', 'Soft Skills', 'Cloud'];

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<SkillCard[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSkills() {
      setLoading(true);
      setError(false);

      if (!user) {
        if (active) {
          setSkills([]);
          setLoading(false);
        }
        return;
      }

      const { data: userSkills, error: userSkillsError } = await supabase
        .from('user_skills')
        .select('skill_id, proficiency, xp')
        .eq('user_id', user.id);

      if (userSkillsError) {
        if (active) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      if (!userSkills || userSkills.length === 0) {
        if (active) {
          setSkills([]);
          setLoading(false);
        }
        return;
      }

      const skillIds = userSkills.map((skill) => skill.skill_id);
      const { data: skillRows, error: skillsError } = await supabase
        .from('skills')
        .select('id, name, category, icon_name, max_level')
        .in('id', skillIds);

      if (skillsError) {
        if (active) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      const skillMap = new Map((skillRows ?? []).map((skill) => [skill.id, skill]));
      const nextSkills = userSkills.flatMap((userSkill) => {
        const skill = skillMap.get(userSkill.skill_id);
        if (!skill) return [];
        return [{
          id: skill.id,
          name: skill.name,
          category: skill.category,
          proficiency: userSkill.proficiency,
          totalLevels: skill.max_level,
          xp: userSkill.xp,
          xpToNext: Math.max(userSkill.xp, skill.max_level * 1000),
          icon: skill.icon_name,
        }];
      });

      if (active) {
        setSkills(nextSkills);
        setLoading(false);
      }
    }

    loadSkills();
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = useMemo(() => skills.filter((skill) => {
    const matchesCategory = filter === 'All' || skill.category === filter;
    const matchesSearch = skill.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [filter, search, skills]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Skills</h1>
          <p className="mt-1 text-muted-foreground">
            Your levels appear here after you complete skill assessments.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/skills/gap">
              <Target className="mr-2 h-4 w-4" />
              Skill Gap
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/assessment">
              Take Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading your skills...</CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            We could not load your skills right now. Please try again.
          </CardContent>
        </Card>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Code className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No assessed skills yet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Complete an assessment and your real proficiency level will appear here.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/assessment">Start an Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search assessed skills..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="sm:max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={filter === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No assessed skills match your search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((skill) => {
                const Icon = iconMap[skill.icon] ?? Code;
                const isMax = skill.proficiency >= skill.totalLevels;
                const xpProgress = skill.xpToNext > 0 ? Math.min((skill.xp / skill.xpToNext) * 100, 100) : 0;
                return (
                  <Card key={skill.id} className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{skill.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{skill.category}</p>
                          </div>
                        </div>
                        {isMax ? (
                          <Badge variant="default">Maxed</Badge>
                        ) : (
                          <Badge variant="secondary">Lv {skill.proficiency}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs">
                          <span className="text-muted-foreground">Proficiency</span>
                          <span className="font-medium">{skill.proficiency}/{skill.totalLevels}</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: skill.totalLevels }).map((_, index) => (
                            <div
                              key={index}
                              className={cn(
                                'h-1.5 flex-1 rounded-full',
                                index < skill.proficiency ? 'bg-primary' : 'bg-secondary'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {skill.xp.toLocaleString()} XP
                        </span>
                        {isMax && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <Progress value={xpProgress} className="h-1" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
