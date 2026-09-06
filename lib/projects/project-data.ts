import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type UserProjectRow = Database['public']['Tables']['user_projects']['Row'];

export interface ProjectWithStatus extends ProjectRow {
  userStatus: 'not-started' | 'in-progress' | 'completed';
  progressPct: number;
  rating: number;
  githubUrl: string;
}

export interface ProjectDetail extends ProjectWithStatus {
  steps: ProjectStep[];
}

export interface ProjectStep {
  label: string;
  description: string;
}

const PROJECT_STEPS: Record<string, ProjectStep[]> = {
  default: [
    { label: 'Plan & Setup', description: 'Initialize the project repository, set up the tech stack, and outline the architecture.' },
    { label: 'Core Features', description: 'Implement the main functionality — data models, business logic, and primary UI components.' },
    { label: 'Integration & Testing', description: 'Connect APIs, add authentication if needed, write tests, and fix bugs.' },
    { label: 'Polish & Deploy', description: 'Add styling, error handling, deploy to a hosting platform, and write a README.' },
  ],
};

export async function fetchAllProjects(userId: string): Promise<ProjectWithStatus[]> {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('order_index');

  if (error || !projects) return [];

  const { data: userProjects } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', userId);

  const userProjectMap = new Map<string, UserProjectRow>();
  for (const up of userProjects ?? []) {
    userProjectMap.set(up.project_id, up);
  }

  return projects.map((p) => {
    const up = userProjectMap.get(p.id);
    return {
      ...p,
      userStatus: (up?.status === 'completed' ? 'completed' : up?.status === 'in-progress' ? 'in-progress' : 'not-started') as ProjectWithStatus['userStatus'],
      progressPct: up?.progress_pct ?? 0,
      rating: up?.rating ?? 0,
      githubUrl: up?.github_url ?? '',
    };
  });
}

export async function fetchProjectDetail(projectId: string, userId: string): Promise<ProjectDetail | null> {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !project) return null;

  const { data: userProject } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();

  return {
    ...project,
    userStatus: (userProject?.status === 'completed' ? 'completed' : userProject?.status === 'in-progress' ? 'in-progress' : 'not-started') as ProjectWithStatus['userStatus'],
    progressPct: userProject?.progress_pct ?? 0,
    rating: userProject?.rating ?? 0,
    githubUrl: userProject?.github_url ?? '',
    steps: PROJECT_STEPS.default,
  };
}

export async function startProject(userId: string, projectId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_projects')
    .upsert(
      {
        user_id: userId,
        project_id: projectId,
        status: 'in-progress',
        progress_pct: 10,
      },
      { onConflict: 'user_id,project_id' }
    );

  return { error: error?.message ?? null };
}

export async function updateProjectProgress(
  userId: string,
  projectId: string,
  progressPct: number
): Promise<{ error: string | null }> {
  const clamped = Math.max(0, Math.min(100, progressPct));
  const { error } = await supabase
    .from('user_projects')
    .update({ progress_pct: clamped })
    .eq('user_id', userId)
    .eq('project_id', projectId);

  return { error: error?.message ?? null };
}

export async function submitGitHubUrl(
  userId: string,
  projectId: string,
  githubUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_projects')
    .update({ github_url: githubUrl })
    .eq('user_id', userId)
    .eq('project_id', projectId);

  return { error: error?.message ?? null };
}

export async function completeProject(
  userId: string,
  projectId: string,
  githubUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_projects')
    .update({
      status: 'completed',
      progress_pct: 100,
      github_url: githubUrl,
    })
    .eq('user_id', userId)
    .eq('project_id', projectId);

  return { error: error?.message ?? null };
}

export async function abandonProject(
  userId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('user_projects')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);

  return { error: error?.message ?? null };
}

export function isValidGitHubUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (u.hostname === 'github.com' || u.hostname === 'gitlab.com') && u.pathname.length > 1;
  } catch {
    return false;
  }
}
