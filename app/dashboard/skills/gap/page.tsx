'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  FolderKanban,
  ArrowRight,
  Sparkles,
  Clock,
  Zap,
  Gauge,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import {
  fetchTargetRoles,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
} from '@/lib/resume/resume-data';
import {
  analyzeSkillGap,
  type GapAnalysisResult,
  type SkillGap,
} from '@/lib/skills/gap-analysis';
import type { TargetRoleSkills } from '@/lib/database.types';
import { cn } from '@/lib/utils';

const priorityConfig: Record<string, { color: string; bg: string; label: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20', label: 'Critical', icon: XCircle },
  high: { color: 'text-warning', bg: 'bg-warning/5 border-warning/20', label: 'High', icon: AlertTriangle },
  medium: { color: 'text-primary', bg: 'bg-primary/5 border-primary/20', label: 'Medium', icon: Target },
  low: { color: 'text-success', bg: 'bg-success/5 border-success/20', label: 'On Track', icon: CheckCircle2 },
};

export default function SkillGapPage() {
  const { user, profile } = useAuth();
  const [roles, setRoles] = useState<TargetRoleSkills[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [analysis, setAnalysis] = useState<GapAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const roleData = await fetchTargetRoles();
      setRoles(roleData);
      if (profile?.target_role && roleData.some((r) => r.role === profile.target_role)) {
        setSelectedRole(profile.target_role);
      } else if (roleData.length > 0) {
        setSelectedRole(roleData[0].role);
      }
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const runAnalysis = useCallback(async () => {
    if (!user || !selectedRole) return;
    setAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeSkillGap(user.id, selectedRole);
      if (result.error) {
        setError(result.error);
      } else {
        setAnalysis(result);
      }
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }, [user, selectedRole]);

  useEffect(() => {
    if (user && selectedRole && !loading) {
      runAnalysis();
    }
  }, [user, selectedRole, loading, runAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Skill Gap Analysis</h1>
          <p className="mt-1 text-muted-foreground">
            Compare your current skills against target role requirements and get a personalized plan.
          </p>
        </div>
        <Link href="/dashboard/skills">
          <Button variant="outline" size="sm">
            <Target className="mr-1 h-4 w-4" />
            View All Skills
          </Button>
        </Link>
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Select Target Role
          </CardTitle>
          <CardDescription>
            Choose the role you are targeting. We will compare your skills against its requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="sm:w-72">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.role}>
                    {r.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {analyzing && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {analysis && !error && (
        <>
          {/* Match Score Overview */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className={cn('border sm:col-span-2', getScoreBg(analysis.matchScore))}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/80">
                      <Gauge className={cn('h-6 w-6', getScoreColor(analysis.matchScore))} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Role Match Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className={cn('text-3xl font-bold', getScoreColor(analysis.matchScore))}>
                          {analysis.matchScore}
                        </span>
                        <span className="text-sm text-muted-foreground">/ 100</span>
                      </div>
                      <p className={cn('text-xs font-medium', getScoreColor(analysis.matchScore))}>
                        {getScoreLabel(analysis.matchScore)}
                      </p>
                    </div>
                  </div>
                </div>
                <Progress value={analysis.matchScore} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <StatCard
              icon={CheckCircle2}
              label="Matched"
              value={analysis.matchedSkills.length}
              color="text-success"
              bg="bg-success/10"
            />
            <StatCard
              icon={AlertTriangle}
              label="Partial"
              value={analysis.partialSkills.length}
              color="text-warning"
              bg="bg-warning/10"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Skill Gaps */}
            <div className="space-y-6 lg:col-span-2">
              {/* Priority Gaps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Skill Gaps by Priority
                  </CardTitle>
                  <CardDescription>
                    {analysis.gaps.length} skill{analysis.gaps.length !== 1 ? 's' : ''} evaluated for {analysis.targetRole}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.gaps.map((gap) => (
                    <GapRow key={gap.skill} gap={gap} />
                  ))}
                </CardContent>
              </Card>

              {/* Matched Skills */}
              {analysis.matchedSkills.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      Matched Skills
                    </CardTitle>
                    <CardDescription>Skills you already have for this role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matchedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Recommendations */}
            <div className="space-y-6">
              {/* Recommended Learning Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Recommended Learning
                  </CardTitle>
                  <CardDescription>Topics that close your skill gaps</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.recommendedTopics.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No specific topics found for your gaps. Explore the Learning page for more.
                    </p>
                  ) : (
                    analysis.recommendedTopics.map((topic) => (
                      <Link
                        key={topic.id}
                        href={`/dashboard/learning/${topic.id}`}
                        className="block rounded-lg border p-3 transition-all hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{topic.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{topic.reason}</p>
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {topic.estimated_minutes}m
                              </span>
                              <span>{topic.difficulty}</span>
                              {topic.status !== 'not-started' && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px]',
                                    topic.status === 'completed' && 'border-success/30 text-success',
                                    topic.status === 'in-progress' && 'border-warning/30 text-warning'
                                  )}
                                >
                                  {topic.status === 'completed' ? 'Done' : 'In Progress'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recommended Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderKanban className="h-4 w-4 text-primary" />
                    Recommended Projects
                  </CardTitle>
                  <CardDescription>Projects that build your missing skills</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.recommendedProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No projects found matching your gaps. Browse all projects for more options.
                    </p>
                  ) : (
                    analysis.recommendedProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="block rounded-lg border p-3 transition-all hover:border-primary/50 hover:bg-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{project.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{project.reason}</p>
                            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5 font-medium text-accent">
                                <Zap className="h-3 w-3" />
                                {project.xp_reward} XP
                              </span>
                              <span>{project.difficulty}</span>
                              {project.userStatus === 'completed' && (
                                <Badge variant="outline" className="border-success/30 text-success text-[10px]">
                                  Done
                                </Badge>
                              )}
                              {project.userStatus === 'in-progress' && (
                                <Badge variant="outline" className="border-warning/30 text-warning text-[10px]">
                                  In Progress
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Smart Matching</p>
                      <p className="text-xs text-muted-foreground">
                        Recommendations use semantic skill matching — so "React" matches "ReactJS", "JSX", etc.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {!analysis && !error && !analyzing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Select a target role to begin</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Choose a role above and we will analyze your skill gaps, match learning topics, and recommend projects.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', bg)}>
            <Icon className={cn('h-5 w-5', color)} />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GapRow({ gap }: { gap: SkillGap }) {
  const config = priorityConfig[gap.priority] ?? priorityConfig['low'];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border p-3', config.bg)}>
      <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{gap.skill}</p>
          {gap.isRequired && (
            <Badge variant="outline" className="text-[10px]">Required</Badge>
          )}
          {gap.isPreferred && !gap.isRequired && (
            <Badge variant="outline" className="text-[10px]">Preferred</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{gap.reason}</p>
      </div>
      <div className="shrink-0 text-right">
        {gap.hasSkill ? (
          <span className={cn('text-xs font-medium', config.color)}>
            Lv {gap.proficiency}
          </span>
        ) : (
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        )}
      </div>
    </div>
  );
}
