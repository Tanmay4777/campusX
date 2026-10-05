'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Lock,
  Map,
  Clock,
  ArrowRight,
  Loader2,
  Zap,
  ChevronDown,
  ChevronRight,
  Target,
  Sparkles,
  Code,
  Layers,
  BrainCircuit,
  BarChart3,
  Tag,
  BookOpen,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useGamification } from '@/components/dashboard/gamification-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { awardXp } from '@/lib/gamification/service';
import { XP_RULES } from '@/lib/gamification/xp-rules';
import {
  fetchAllRoadmaps,
  fetchRoadmapForRole,
  toggleMilestoneComplete,
  getRoleLabel,
  type RoadmapWithProgress,
  type EnrichedMilestone,
  type CareerRoadmap,
} from '@/lib/roadmaps/roadmap-data';

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Code,
  Layers,
  BrainCircuit,
  BarChart3,
};

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  beginner: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  intermediate: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  advanced: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
};

export default function RoadmapPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { notify } = useGamification();
  const { toast } = useToast();

  const [roadmaps, setRoadmaps] = useState<CareerRoadmap[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roadmapData, setRoadmapData] = useState<RoadmapWithProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load all roadmaps on mount
  useEffect(() => {
    async function loadRoadmaps() {
      try {
        const data = await fetchAllRoadmaps();
        setRoadmaps(data);
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadRoadmaps();
  }, []);

  // Determine which role to load
  useEffect(() => {
    if (!user || roadmaps.length === 0) return;

    // Priority: user-selected > profile target_role > first roadmap
    const roleToLoad = selectedRole ?? profile?.target_role ?? roadmaps[0]?.role ?? null;
    if (!roleToLoad) return;

    setLoading(true);
    async function loadRole() {
      try {
        const data = await fetchRoadmapForRole(roleToLoad, user.id);
        setRoadmapData(data);
        // Auto-expand all phases that have activity
        if (data) {
          const active = new Set<string>();
          for (const phase of data.phases) {
            if (phase.completedCount > 0 || phase.milestones.some((m) => m.userStatus === 'active')) {
              active.add(phase.phase);
            }
          }
          // Always expand the phase containing the active milestone
          const activePhase = data.phases.find((p) => p.milestones.some((m) => m.userStatus === 'active'));
          if (activePhase) active.add(activePhase.phase);
          // If nothing active, expand the first phase
          if (active.size === 0 && data.phases.length > 0) {
            active.add(data.phases[0].phase);
          }
          setExpandedPhases(active);
        }
      } catch {
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadRole();
  }, [user, roadmaps, selectedRole, profile?.target_role]);

  const togglePhase = (phase: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  const handleToggleMilestone = useCallback(
    async (milestone: EnrichedMilestone) => {
      if (!user || milestone.userStatus === 'locked') return;

      setToggling(milestone.id);
      try {
        const wasCompleted = milestone.userStatus === 'completed';

        const { error } = await toggleMilestoneComplete(user.id, milestone.id, wasCompleted);

        if (error) {
          toast({
            title: 'Error updating milestone',
            description: error,
            variant: 'destructive',
          });
          return;
        }

        // If completing (not uncompleting), award XP
        if (!wasCompleted) {
          const xpAmount = XP_RULES.LEARNING_ROADMAP_PHASE;
          const result = await awardXp(user.id, xpAmount, {
            type: 'learning',
            title: `Milestone completed: ${milestone.title}`,
            description: `${milestone.skill} • ${milestone.phase} phase`,
          });

          if (result.achievements.length > 0) {
            notify(result.achievements);
          }

          await refreshProfile();

          toast({
            title: 'Milestone completed!',
            description: `+${xpAmount} XP earned for "${milestone.title}"`,
          });
        } else {
          toast({
            title: 'Milestone reopened',
            description: `"${milestone.title}" marked as incomplete`,
          });
        }

        // Refresh roadmap data
        const roleToLoad = selectedRole ?? profile?.target_role ?? roadmaps[0]?.role;
        if (roleToLoad) {
          const data = await fetchRoadmapForRole(roleToLoad, user.id);
          setRoadmapData(data);
        }
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setToggling(null);
      }
    },
    [user, selectedRole, profile?.target_role, roadmaps, notify, toast, refreshProfile]
  );

  // ===== Loading state =====
  if (loading && !roadmapData) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ===== Error state =====
  if (error && !roadmapData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Career Roadmap</h1>
          <p className="mt-1 text-muted-foreground">
            Your personalized path from fundamentals to placement-ready, tailored to your target role.
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== Role Selection + Roadmap Display =====
  const currentRole = selectedRole ?? profile?.target_role ?? roadmaps[0]?.role;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Career Roadmap</h1>
        <p className="mt-1 text-muted-foreground">
          Your personalized path from fundamentals to placement-ready, tailored to your target role.
        </p>
      </div>

      {/* Role Selector */}
      <div className="flex flex-wrap gap-2">
        {roadmaps.map((rm) => {
          const Icon = roleIcons[rm.icon_name] ?? Map;
          const isActive = currentRole === rm.role;
          return (
            <button
              key={rm.id}
              onClick={() => setSelectedRole(rm.role)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {rm.title}
            </button>
          );
        })}
      </div>

      {roadmapData && (
        <>
          {/* Overall Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    {(() => {
                      const Icon = roleIcons[roadmapData.roadmap.icon_name] ?? Map;
                      return <Icon className="h-6 w-6 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{roadmapData.roadmap.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-xl">
                      {roadmapData.roadmap.description}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {roadmapData.roadmap.estimated_weeks} weeks
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {roadmapData.totalMilestones} milestones
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {roadmapData.overallProgressPct}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {roadmapData.totalCompleted}/{roadmapData.totalMilestones} done
                  </div>
                </div>
              </div>
              <Progress value={roadmapData.overallProgressPct} className="mt-4 h-3" />
            </CardContent>
          </Card>

          {/* Next Milestone Callout */}
          {roadmapData.nextMilestone && (
            <Card className="overflow-hidden border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary">Next up</p>
                    <p className="text-sm font-semibold">{roadmapData.nextMilestone.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {roadmapData.nextMilestone.skill} • {roadmapData.nextMilestone.estimated_hours}h
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleToggleMilestone(roadmapData.nextMilestone!)}
                  disabled={toggling === roadmapData.nextMilestone.id}
                >
                  {toggling === roadmapData.nextMilestone.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Complete
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Roadmap Phases Timeline */}
          <div className="space-y-4">
            {roadmapData.phases.map((phase, phaseIdx) => {
              const isExpanded = expandedPhases.has(phase.phase);
              const colors = phaseColors[phase.phase] ?? phaseColors.beginner;
              const isPhaseLocked = phase.milestones.every((m) => m.userStatus === 'locked');
              const isPhaseComplete = phase.completedCount === phase.totalCount && phase.totalCount > 0;

              return (
                <div key={phase.phase} className="relative">
                  {/* Connector Line */}
                  {phaseIdx < roadmapData.phases.length - 1 && (
                    <div className="absolute left-5 top-16 bottom-0 w-px bg-border" />
                  )}
                  <Card className={cn('transition-all', isPhaseLocked && 'opacity-70')}>
                    {/* Phase Header (clickable) */}
                    <button
                      onClick={() => togglePhase(phase.phase)}
                      className="flex w-full items-start gap-4 p-6 text-left"
                    >
                      <div className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                        isPhaseComplete ? 'bg-success text-success-foreground' : colors.bg
                      )}>
                        {isPhaseComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isPhaseLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Map className={cn('h-5 w-5', colors.text)} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {phase.phaseLabel}
                              <Badge variant="outline" className={cn('text-xs', colors.border, colors.text)}>
                                {phase.completedCount}/{phase.totalCount}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {phase.milestones.length} milestones • {phase.milestones.reduce((sum, m) => sum + m.estimated_hours, 0)}h total
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">
                              {phase.progressPct}%
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={phase.progressPct} className="h-1.5" />
                        </div>
                      </div>
                    </button>

                    {/* Milestones (expandable) */}
                    {isExpanded && (
                      <CardContent className="border-t pt-4">
                        <div className="space-y-2">
                          {phase.milestones.map((milestone, mIdx) => {
                            const isLocked = milestone.userStatus === 'locked';
                            const isCompleted = milestone.userStatus === 'completed';
                            const isActive = milestone.userStatus === 'active';
                            const isToggling = toggling === milestone.id;

                            return (
                              <div
                                key={milestone.id}
                                className={cn(
                                  'group relative flex items-start gap-3 rounded-lg border p-4 transition-all',
                                  isLocked && 'border-border/50 opacity-50',
                                  !isLocked && 'border-border hover:border-primary/40 hover:bg-secondary/30',
                                  isActive && 'border-primary/40 bg-primary/5'
                                )}
                              >
                                {/* Milestone number / status icon */}
                                <button
                                  onClick={() => !isLocked && handleToggleMilestone(milestone)}
                                  disabled={isLocked || isToggling}
                                  className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                                    isCompleted && 'bg-success text-success-foreground',
                                    isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-card',
                                    isLocked && 'bg-muted text-muted-foreground cursor-not-allowed',
                                    !isLocked && !isCompleted && !isActive && 'bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                                  )}
                                >
                                  {isToggling ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : isLocked ? (
                                    <Lock className="h-3.5 w-3.5" />
                                  ) : (
                                    <span className="text-xs font-bold">{milestone.order_index}</span>
                                  )}
                                </button>

                                {/* Milestone content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <p className={cn(
                                      'text-sm font-medium',
                                      isCompleted && 'text-muted-foreground line-through'
                                    )}>
                                      {milestone.title}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isActive && (
                                        <Badge variant="default" className="text-xs gap-1">
                                          <Zap className="h-3 w-3" />
                                          Active
                                        </Badge>
                                      )}
                                      {isCompleted && (
                                        <Badge variant="outline" className="text-xs text-success">
                                          Done
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {milestone.description}
                                  </p>
                                  {/* Tags */}
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <Tag className="h-2.5 w-2.5" />
                                      {milestone.skill}
                                    </Badge>
                                    {milestone.topics.slice(0, 3).map((topic) => (
                                      <span
                                        key={topic}
                                        className="text-[10px] text-muted-foreground/70"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                      <Clock className="h-2.5 w-2.5" />
                                      {milestone.estimated_hours}h
                                    </span>
                                    {!isLocked && !isCompleted && (
                                      <span className="flex items-center gap-1 text-[10px] text-primary">
                                        <BookOpen className="h-2.5 w-2.5" />
                                        +{XP_RULES.LEARNING_ROADMAP_PHASE} XP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Phase action button */}
                        {!isPhaseComplete && !isPhaseLocked && (
                          <Button
                            className="mt-4"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const activeMilestone = phase.milestones.find((m) => m.userStatus === 'active');
                              if (activeMilestone) {
                                handleToggleMilestone(activeMilestone);
                              }
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Continue {phase.phaseLabel}
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        )}
                        {isPhaseComplete && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">Phase complete! Great work.</span>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>

          {/* XP Info Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                Earn <span className="font-semibold text-primary">{XP_RULES.LEARNING_ROADMAP_PHASE} XP</span> for each milestone you complete.
                Complete all milestones in a phase to unlock the next phase.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {!roadmapData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No roadmap found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select a career role above to view your personalized roadmap.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
