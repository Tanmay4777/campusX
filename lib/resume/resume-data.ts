import { supabase } from '@/lib/supabase/client';
import type { TargetRoleSkills, ResumeAnalysis } from '@/lib/database.types';

export interface AnalysisResult {
  extracted_text: string;
  extracted_skills: string[];
  missing_skills: string[];
  project_quality_score: number;
  completeness_score: number;
  match_score: number;
  suggestions: AnalysisSuggestion[];
  completed_projects: number;
}

export interface AnalysisSuggestion {
  category: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export async function fetchTargetRoles(): Promise<TargetRoleSkills[]> {
  const { data, error } = await supabase
    .from('target_role_skills')
    .select('*')
    .order('role');

  if (error || !data) return [];
  return data;
}

export async function fetchResumeHistory(userId: string): Promise<ResumeAnalysis[]> {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false })
    .limit(10);

  if (error || !data) return [];
  return data;
}

export async function fetchLatestAnalysis(userId: string): Promise<ResumeAnalysis | null> {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function analyzeResume(
  file: File,
  targetRole: string,
  userId: string
): Promise<{ result: AnalysisResult | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { result: null, error: 'You must be signed in to analyze your resume.' };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('target_role', targetRole);
  formData.append('user_id', userId);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Analysis failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) errorMsg = body.error;
    } catch {
      // no JSON body
    }
    return { result: null, error: errorMsg };
  }

  const data = await response.json();
  if (!data || typeof data.match_score !== 'number') {
    return { result: null, error: 'Received an unexpected response from the analysis service.' };
  }

  return { result: data as AnalysisResult, error: null };
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
