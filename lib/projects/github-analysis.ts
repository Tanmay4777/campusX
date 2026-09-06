import { supabase } from '@/lib/supabase/client';
import type { ProjectVerification } from '@/lib/database.types';

export interface RepoAnalysis {
  repo_name: string;
  repo_full_name: string;
  description: string;
  stars: number;
  forks: number;
  open_issues: number;
  languages: Record<string, number>;
  has_readme: boolean;
  has_tests: boolean;
  has_docker: boolean;
  has_ci: boolean;
  source_file_count: number;
  license: string;
  quality_score: number;
  suggestions: AnalysisSuggestion[];
}

export interface AnalysisSuggestion {
  category: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  analysis: RepoAnalysis | null;
  error: string | null;
}

export async function analyzeRepository(
  repoUrl: string,
  projectId: string,
  userId: string
): Promise<AnalysisResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { analysis: null, error: 'You must be signed in to analyze a repository.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-repo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      repo_url: repoUrl,
      project_id: projectId,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    let errorMsg = `Analysis failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
    } catch {
      // response had no JSON body
    }
    return { analysis: null, error: errorMsg };
  }

  const data = await response.json();
  if (!data || typeof data.quality_score !== 'number') {
    return { analysis: null, error: 'Received an unexpected response from the analysis service.' };
  }

  return { analysis: data as RepoAnalysis, error: null };
}

export async function fetchStoredVerification(
  userId: string,
  projectId: string
): Promise<ProjectVerification | null> {
  const { data, error } = await supabase
    .from('project_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-success/10 border-success/20';
  if (score >= 50) return 'bg-warning/10 border-warning/20';
  return 'bg-destructive/10 border-destructive/20';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 30) return 'Needs Work';
  return 'Poor';
}
