'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Clock,
  Star,
  Zap,
  Search,
  Loader2,
  CheckCircle2,
  PlayCircle,
  Circle,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchAllProjects,
  startProject,
  type ProjectWithStatus,
} from '@/lib/projects/project-data';
import { cn } from '@/lib/utils';

const difficultyFilters = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const skillFilters = ['All', 'Java', 'Python', 'React', 'Node.js', 'SQL', 'Docker', 'AWS', 'Git', 'Spring Boot'];

const difficultyColors: Record<string, string> = {
  Beginner: 'text-success bg-success/10 border-success/20',
  Intermediate: 'text-warning bg-warning/10 border-warning/20',
  Advanced: 'text-destructive bg-destructive/10 border-destructive/20',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  'in-progress': PlayCircle,
  'not-started': Circle,
};

const statusColors: Record<string, string> = {
  completed: 'text-success',
  'in-progress': 'text-warning',
  'not-started': 'text-muted-foreground',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [skillFilter, setSkillFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchAllProjects(user.id);
      setProjects(data);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
      const matchesSkill = skillFilter === 'All' || p.required_skills.includes(skillFilter) || p.tech_stack.includes(skillFilter);
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      return matchesDifficulty && matchesSkill && matchesSearch;
    });
  }, [projects, difficultyFilter, skillFilter, search]);

  const stats = useMemo(() => ({
    total: projects.length,
    completed: projects.filter((p) => p.userStatus === 'completed').length,
    inProgress: projects.filter((p) => p.userStatus === 'in-progress').length,
    totalXp: projects.filter((p) => p.userStatus === 'completed').reduce((sum, p) => sum + p.xp_reward, 0),
  }), [projects]);

  const handleStart = async (projectId: string, title: string) => {
    if (!user) return;
    setStarting(projectId);
    try {
      const { error } = await startProject(user.id, projectId);
      if (error) {
        toast({ title: 'Error', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Project started', description: `"${title}" is now in your workspace` });
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, userStatus: 'in-progress', progressPct: 10 } : p
          )
        );
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load data. Please try again.', variant: 'destructive' });
    } finally {
      setStarting(null);
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
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
        <p className="mt-1 text-muted-foreground">
          Browse real-world projects, start building, submit your GitHub repo, and earn XP.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="mt-1 text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="mt-1 text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="mt-1 text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <PlayCircle className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">XP Earned</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalXp}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                <Zap className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Difficulty:</span>
          {difficultyFilters.map((d) => (
            <Button
              key={d}
              variant={difficultyFilter === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDifficultyFilter(d)}
            >
              {d}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Skill:</span>
          {skillFilters.map((s) => (
            <Button
              key={s}
              variant={skillFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSkillFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects match your filters. Try adjusting your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const StatusIcon = statusIcons[project.userStatus] ?? Circle;
            const isStarted = project.userStatus !== 'not-started';
            return (
              <Card key={project.id} className="group flex h-full flex-col transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{project.title}</CardTitle>
                    <StatusIcon className={cn('h-5 w-5 shrink-0', statusColors[project.userStatus])} />
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  {/* Tech Stack */}
                  {project.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tech_stack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs font-normal">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={cn('rounded-full border px-2 py-0.5 font-medium', difficultyColors[project.difficulty] ?? difficultyColors['Beginner'])}>
                      {project.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {project.estimated_hours}h
                    </span>
                    <span className="flex items-center gap-1 font-medium text-accent">
                      <Zap className="h-3 w-3" />
                      {project.xp_reward} XP
                    </span>
                  </div>

                  {/* Progress */}
                  {project.userStatus === 'in-progress' && (
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progressPct}%</span>
                      </div>
                      <Progress value={project.progressPct} className="h-1.5" />
                    </div>
                  )}

                  {/* GitHub URL indicator */}
                  {project.githubUrl && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      <span className="truncate">{project.githubUrl.replace('https://', '')}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex gap-2 pt-2">
                    {isStarted ? (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/dashboard/projects/${project.id}`}>
                          {project.userStatus === 'completed' ? 'View Details' : 'Continue'}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={starting === project.id}
                        onClick={() => handleStart(project.id, project.title)}
                      >
                        {starting === project.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            Start Project
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
