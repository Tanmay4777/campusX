import { supabase } from '@/lib/supabase/client';
import type { CareerRoadmap, RoadmapMilestone, UserRoadmapMilestone } from '@/lib/database.types';

export type { CareerRoadmap };

export type MilestoneStatus = 'locked' | 'active' | 'completed' | 'pending';

export interface EnrichedMilestone extends RoadmapMilestone {
  userStatus: MilestoneStatus;
  completedAt: string | null;
}

export interface RoadmapPhase {
  phase: string;
  phaseLabel: string;
  milestones: EnrichedMilestone[];
  completedCount: number;
  totalCount: number;
  progressPct: number;
}

export interface RoadmapWithProgress {
  roadmap: CareerRoadmap;
  phases: RoadmapPhase[];
  totalCompleted: number;
  totalMilestones: number;
  overallProgressPct: number;
  nextMilestone: EnrichedMilestone | null;
}

export const PHASE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const PHASE_ORDER = ['beginner', 'intermediate', 'advanced'];

const ROLE_LABELS: Record<string, string> = {
  software_developer: 'Software Developer',
  full_stack_developer: 'Full Stack Developer',
  ai_ml_engineer: 'AI/ML Engineer',
  data_analyst: 'Data Analyst',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function normalizeRole(role: string): string {
  const lower = role.toLowerCase().trim();
  for (const key of Object.keys(ROLE_LABELS)) {
    if (key === lower || ROLE_LABELS[key].toLowerCase() === lower) {
      return key;
    }
  }
  return 'software_developer';
}

export async function fetchAllRoadmaps(): Promise<CareerRoadmap[]> {
  const { data, error } = await supabase
    .from('career_roadmaps')
    .select('*')
    .order('title');

  if (error || !data) return [];
  return data;
}

export async function fetchRoadmapForRole(role: string, userId: string): Promise<RoadmapWithProgress | null> {
  const normalized = normalizeRole(role);

  const { data: roadmap, error: rErr } = await supabase
    .from('career_roadmaps')
    .select('*')
    .eq('role', normalized)
    .maybeSingle();

  if (rErr || !roadmap) return null;

  const { data: milestones, error: mErr } = await supabase
    .from('roadmap_milestones')
    .select('*')
    .eq('roadmap_id', roadmap.id)
    .order('order_index');

  if (mErr || !milestones || milestones.length === 0) return null;

  const { data: userMilestones } = await supabase
    .from('user_roadmap_milestones')
    .select('*')
    .eq('user_id', userId);

  const userStatusMap = new Map<string, UserRoadmapMilestone>();
  for (const um of userMilestones ?? []) {
    userStatusMap.set(um.milestone_id, um);
  }

  const enriched: EnrichedMilestone[] = milestones.map((m) => {
    const um = userStatusMap.get(m.id);
    const rawStatus = um?.status ?? 'pending';
    return {
      ...m,
      userStatus: rawStatus === 'completed' ? 'completed' : rawStatus === 'active' ? 'active' : 'pending',
      completedAt: um?.completed_at ?? null,
    };
  });

  // Determine locked/active/pending based on sequential completion
  const sortedByOrder = [...enriched].sort((a, b) => a.order_index - b.order_index);
  let foundFirstIncomplete = false;
  for (const m of sortedByOrder) {
    if (m.userStatus === 'completed') continue;
    if (!foundFirstIncomplete) {
      m.userStatus = 'active';
      foundFirstIncomplete = true;
    } else {
      m.userStatus = 'locked';
    }
  }

  // Group into phases
  const phaseMap = new Map<string, EnrichedMilestone[]>();
  for (const m of enriched) {
    const arr = phaseMap.get(m.phase) ?? [];
    arr.push(m);
    phaseMap.set(m.phase, arr);
  }

  const phases: RoadmapPhase[] = PHASE_ORDER
    .filter((p) => phaseMap.has(p))
    .map((p) => {
      const ms = (phaseMap.get(p) ?? []).sort((a, b) => a.order_index - b.order_index);
      const completed = ms.filter((m) => m.userStatus === 'completed').length;
      return {
        phase: p,
        phaseLabel: PHASE_LABELS[p] ?? p,
        milestones: ms,
        completedCount: completed,
        totalCount: ms.length,
        progressPct: ms.length > 0 ? Math.round((completed / ms.length) * 100) : 0,
      };
    });

  const totalCompleted = enriched.filter((m) => m.userStatus === 'completed').length;
  const totalMilestones = enriched.length;
  const overallProgressPct = totalMilestones > 0 ? Math.round((totalCompleted / totalMilestones) * 100) : 0;
  const nextMilestone = sortedByOrder.find((m) => m.userStatus === 'active') ?? null;

  return {
    roadmap,
    phases,
    totalCompleted,
    totalMilestones,
    overallProgressPct,
    nextMilestone,
  };
}

export async function toggleMilestoneComplete(
  userId: string,
  milestoneId: string,
  currentlyCompleted: boolean
): Promise<{ error: string | null }> {
  if (currentlyCompleted) {
    // Mark as incomplete — delete the user_roadmap_milestones row
    const { error } = await supabase
      .from('user_roadmap_milestones')
      .delete()
      .eq('user_id', userId)
      .eq('milestone_id', milestoneId);

    return { error: error?.message ?? null };
  }

  // Mark as completed — upsert
  const { error } = await supabase
    .from('user_roadmap_milestones')
    .upsert(
      {
        user_id: userId,
        milestone_id: milestoneId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,milestone_id' }
    );

  return { error: error?.message ?? null };
}

export async function getRoadmapProgressPct(userId: string, role: string): Promise<number> {
  const data = await fetchRoadmapForRole(role, userId);
  return data?.overallProgressPct ?? 0;
}
