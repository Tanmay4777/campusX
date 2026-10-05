'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Zap,
  Star,
  GitBranch,
  Loader2,
  CheckCircle2,
  Circle,
  ExternalLink,
  Wrench,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import { useGamification } from '@/components/dashboard/gamification-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchProjectDetail,
  startProject,
  updateProjectProgress,
  submitGitHubUrl,
  completeProject,
  abandonProject,
  isValidGitHubUrl,
  type ProjectDetail,
} from '@/lib/projects/project-data';
import { awardXp } from '@/lib/gamification/service';
import { GitHubVerification } from '@/components/dashboard/github-verification';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  Beginner: 'text-success bg-success/10 border-success/20',
  Intermediate: 'text-warning bg-warning/10 border-warning/20',
  Advanced: 'text-destructive bg-destructive/10 border-destructive/20',
};

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const { user, refreshProfile } = useAuth();
  const { notify } = useGamification();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubUrl, setGithubUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const detail = await fetchProjectDetail(projectId, user.id);
      setProject(detail);
      setGithubUrl(detail?.githubUrl ?? '');
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleStart = async () => {
    if (!user || !project) return;
    setSaving(true);
    try {
      const { error } = await startProject(user.id, project.id);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
      } else {
        setProject({ ...project, userStatus: 'in-progress', progressPct: 10 });
        toast({ title: 'Project started', description: 'Time to build something great!' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleProgressUpdate = async (newPct: number) => {
    if (!user || !project) return;
    try {
      const { error } = await updateProjectProgress(user.id, project.id, newPct);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      setProject({ ...project, progressPct: newPct });
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveGithub = async () => {
    if (!user || !project) return;
    if (!isValidGitHubUrl(githubUrl)) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid GitHub or GitLab repository URL', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await submitGitHubUrl(user.id, project.id, githubUrl);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
      } else {
        setProject({ ...project, githubUrl });
        toast({ title: 'GitHub URL saved', description: 'Your repository link has been updated' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !project) return;
    if (!isValidGitHubUrl(githubUrl)) {
      toast({ title: 'GitHub URL required', description: 'Please submit your GitHub repository URL before completing', variant: 'destructive' });
      return;
    }
    setCompleting(true);
    try {
      const { error } = await completeProject(user.id, project.id, githubUrl);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }

      const result = await awardXp(user.id, project.xp_reward, {
        type: 'project',
        title: `Project completed: ${project.title}`,
        description: `${project.difficulty} · ${project.category}`,
      });

      if (result.achievements.length > 0) {
        notify(result.achievements);
      }

      await refreshProfile();
      setProject({ ...project, userStatus: 'completed', progressPct: 100, githubUrl });
      toast({
        title: 'Project completed!',
        description: `+${project.xp_reward} XP earned for "${project.title}"`,
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const handleAbandon = async () => {
    if (!user || !project) return;
    try {
      const { error } = await abandonProject(user.id, project.id);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
        return;
      }
      setProject({ ...project, userStatus: 'not-started', progressPct: 0, githubUrl: '' });
      setGithubUrl('');
      toast({ title: 'Project reset', description: 'You can start this project again anytime' });
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Project not found. It may have been removed.
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = project.userStatus === 'completed';
  const isInProgress = project.userStatus === 'in-progress';
  const isNotStarted = project.userStatus === 'not-started';
  const githubValid = isValidGitHubUrl(githubUrl);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/projects">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Projects
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{project.category}</Badge>
                <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', difficultyColors[project.difficulty] ?? difficultyColors['Beginner'])}>
                  {project.difficulty}
                </span>
                {isCompleted && (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {isInProgress && (
                  <Badge variant="secondary" className="gap-1">
                    <Circle className="h-3 w-3 fill-warning text-warning" />
                    In Progress
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{project.title}</h1>
              <p className="max-w-2xl text-muted-foreground">{project.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {project.estimated_hours} hours
                </span>
                <span className="flex items-center gap-1 font-medium text-accent">
                  <Zap className="h-4 w-4" />
                  {project.xp_reward} XP reward
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-44">
              {isNotStarted && (
                <Button onClick={handleStart} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : 'Start Project'}
                </Button>
              )}
              {isInProgress && (
                <Button onClick={handleComplete} disabled={completing || !githubValid}>
                  {completing ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
              {isCompleted && (
                <Button variant="outline" onClick={handleAbandon} disabled={completing}>
                  Reset Project
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Required Skills + Steps */}
        <div className="space-y-6 lg:col-span-2">
          {/* Required Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Required Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.required_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      <Wrench className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific prerequisites — great for all levels.</p>
              )}
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tech Stack</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Project Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Project Steps
              </CardTitle>
              <CardDescription>Follow these steps to complete the project successfully.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.steps.map((step, i) => {
                const stepPct = ((i + 1) / project.steps.length) * 100;
                const isStepDone = project.progressPct >= stepPct;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
                      isStepDone ? 'border-success bg-success/10 text-success' : 'border-muted text-muted-foreground'
                    )}>
                      {isStepDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{step.label}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Progress + GitHub */}
        <div className="space-y-6">
          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isCompleted ? 'Project completed' : isInProgress ? 'In progress' : 'Not started'}
                </span>
                <span className="font-bold">{project.progressPct}%</span>
              </div>
              <Progress value={project.progressPct} className="h-2" />
              {isInProgress && (
                <div className="flex flex-wrap gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      size="sm"
                      variant={project.progressPct >= pct ? 'default' : 'outline'}
                      onClick={() => handleProgressUpdate(pct)}
                      className="text-xs"
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* GitHub Submission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-primary" />
                GitHub Repository
              </CardTitle>
              <CardDescription>Submit your repository URL to track your work.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isNotStarted ? (
                <p className="text-sm text-muted-foreground">
                  Start this project to submit your GitHub repository.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="github-url">Repository URL</Label>
                    <Input
                      id="github-url"
                      placeholder="https://github.com/username/project"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                    {githubUrl && !githubValid && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        Enter a valid GitHub or GitLab URL
                      </p>
                    )}
                  </div>
                  <Button onClick={handleSaveGithub} disabled={saving || !githubValid} variant="outline" size="sm" className="w-full">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save URL'}
                  </Button>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Repository
                    </a>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* GitHub Repository Verification */}
          {!isNotStarted && (
            <GitHubVerification
              projectId={project.id}
              userId={user!.id}
              githubUrl={githubUrl}
              hasGithubUrl={!!githubUrl}
            />
          )}

          {/* XP Reward */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-medium text-accent">Completion Reward</p>
                  <p className="text-lg font-bold">+{project.xp_reward} XP</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
