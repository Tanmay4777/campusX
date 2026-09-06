'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Brain, Loader2, AlertCircle, Target, Map, FolderKanban, Mic,
  TrendingUp, Lightbulb, CheckCircle2, XCircle, Sparkles, Zap,
  Award, ChevronRight, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  getFullAnalysis, generateQuestions,
  type FullAnalysis, type GeneratedQuestion,
} from '@/lib/ai/ai-service';
import { fetchTargetRoles } from '@/lib/resume/resume-data';
import type { TargetRoleSkills } from '@/lib/database.types';
import { cn } from '@/lib/utils';

function scoreColor(score: number): string {
  return score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';
}

function scoreBg(score: number): string {
  return score >= 70 ? 'bg-success/10' : score >= 40 ? 'bg-warning/10' : 'bg-destructive/10';
}

export default function AIAnalysisPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<FullAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<TargetRoleSkills[]>([]);
  const [selectedRole, setSelectedRole] = useState(profile?.target_role ?? '');
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionCategory, setQuestionCategory] = useState('technical');

  const loadAnalysis = useCallback(async (role?: string) => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await getFullAnalysis(user.id, role || selectedRole);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI analysis');
    } finally {
      setLoading(false);
    }
  }, [user, selectedRole]);

  useEffect(() => {
    fetchTargetRoles().then(setRoles);
  }, []);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const handleGenerateQuestions = async () => {
    if (!user) return;
    setLoadingQuestions(true);
    try {
      const skillGaps = analysis?.readiness_score?.factors?.find(f => f.label === 'Skills Match')?.detail
        ? analysis.readiness_score.recommendations
        : undefined;
      const result = await generateQuestions(user.id, questionCategory, skillGaps, 5);
      setQuestions(result.questions);
      toast({ title: 'Questions generated', description: `${result.questions.length} AI-powered questions ready.` });
    } catch (err) {
      toast({ title: 'Failed to generate questions', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoadingQuestions(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Running AI analysis across your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Analysis Failed</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => loadAnalysis()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!analysis) return null;

  const readiness = analysis.readiness_score;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            AI Analysis
          </h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered insights on your skills, readiness, and personalized recommendations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); loadAnalysis(v); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Target role" /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.role}>{r.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadAnalysis()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Readiness Score Overview */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            Placement Readiness Score
          </CardTitle>
          <CardDescription>Weighted score across skills, projects, interviews, resume, roadmap, and assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Big Score */}
            <div className="flex items-center gap-4">
              <div className={cn('flex h-24 w-24 items-center justify-center rounded-2xl', scoreBg(readiness.overall))}>
                <span className={cn('text-3xl font-bold', scoreColor(readiness.overall))}>{readiness.overall}</span>
              </div>
              <div>
                <p className="text-sm font-medium">Overall Score</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {readiness.overall >= 70 ? 'Ready for placements!' : readiness.overall >= 40 ? 'Developing — keep going!' : 'Needs improvement'}
                </p>
                <Badge variant="secondary" className="mt-2">
                  Target: {analysis.target_role}
                </Badge>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
              {readiness.factors.map((f) => (
                <div key={f.label} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{f.label}</span>
                    <span className={cn('text-xs font-bold', scoreColor(f.score))}>{f.score}</span>
                  </div>
                  <Progress value={f.score} className="mt-1.5 h-1" />
                  <p className="mt-1 text-[10px] text-muted-foreground/70">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {readiness.recommendations.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4 text-primary" />
                AI Recommendations
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {readiness.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-primary/5 p-3">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <p className="text-xs text-muted-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Roadmaps, Projects, Interview Questions */}
      <Tabs defaultValue="roadmaps">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roadmaps"><Map className="mr-1.5 h-4 w-4" />Roadmaps</TabsTrigger>
          <TabsTrigger value="projects"><FolderKanban className="mr-1.5 h-4 w-4" />Projects</TabsTrigger>
          <TabsTrigger value="questions"><Mic className="mr-1.5 h-4 w-4" />Questions</TabsTrigger>
        </TabsList>

        {/* Roadmap Recommendations */}
        <TabsContent value="roadmaps" className="space-y-4">
          {analysis.roadmap_recommendations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Map className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No roadmap recommendations available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {analysis.roadmap_recommendations.map((rec) => (
                <Card key={rec.roadmap_id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{rec.title}</CardTitle>
                      <Badge variant={rec.match_score >= 70 ? 'default' : 'secondary'}>
                        {rec.match_score}% match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">~{rec.estimated_weeks} weeks</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    {rec.missing_critical_skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Missing skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.missing_critical_skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <Link href="/dashboard/roadmap">View Roadmap</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Project Recommendations */}
        <TabsContent value="projects" className="space-y-4">
          {analysis.project_recommendations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <FolderKanban className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No project recommendations available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analysis.project_recommendations.map((rec) => (
                <Card key={rec.project_id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">{rec.title}</CardTitle>
                      <Badge variant={rec.match_score >= 80 ? 'default' : rec.match_score >= 50 ? 'secondary' : 'outline'}>
                        {rec.match_score}%
                      </Badge>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px]">{rec.difficulty}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    {rec.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rec.tech_stack.slice(0, 4).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        {rec.matched_skills.length} matched
                      </span>
                      {rec.missing_skills.length > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" />
                          {rec.missing_skills.length} to learn
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-primary">
                        <Award className="h-3 w-3" />
                        {rec.xp_reward} XP
                      </span>
                    </div>
                    <Button size="sm" variant="outline" className="mt-auto w-full" asChild>
                      <Link href={`/dashboard/projects/${rec.project_id}`}>Start Project</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Interview Questions */}
        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="h-4 w-4 text-primary" />
                AI-Generated Interview Questions
              </CardTitle>
              <CardDescription>Personalized questions based on your skill gaps and target role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Select value={questionCategory} onValueChange={setQuestionCategory}>
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="system_design">System Design</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenerateQuestions} disabled={loadingQuestions}>
                  {loadingQuestions ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                  ) : (
                    <><Sparkles className="mr-2 h-4 w-4" />Generate Questions</>
                  )}
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <Mic className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Click "Generate Questions" to get AI-powered interview questions.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                            <Badge variant="outline" className="text-[10px]">{q.difficulty}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                          </div>
                          <p className="text-sm font-medium">{q.question}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            <Lightbulb className="inline h-3 w-3 text-primary mr-1" />
                            {q.hint}
                          </p>
                          {q.expected_topics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {q.expected_topics.map((t) => (
                                <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/interview">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Practice Full Mock Interview
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Skills Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Detected Skills</CardTitle>
          <CardDescription>Skills from assessments and resume analysis combined</CardDescription>
        </CardHeader>
        <CardContent>
          {analysis.user_skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills detected yet. Take an assessment or upload your resume.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analysis.user_skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
