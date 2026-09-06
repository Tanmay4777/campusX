import { supabase } from '@/lib/supabase/client';
import type { InterviewEvaluation, InterviewTranscriptEntry } from '@/lib/database.types';

export interface InterviewQuestionDTO {
  id: string;
  category: string;
  difficulty: string;
  question: string;
  tags: string[];
}

export interface InterviewSessionResult {
  interviewId: string | null;
  evaluation: InterviewEvaluation;
  xpEarned: number;
}

export interface InterviewHistoryRow {
  id: string;
  type: string;
  topic: string;
  category: string;
  score: number;
  duration_minutes: number;
  xp_earned: number;
  conducted_at: string;
  evaluation: InterviewEvaluation;
}

export async function fetchInterviewHistory(userId: string): Promise<InterviewHistoryRow[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('id, type, topic, category, score, duration_minutes, xp_earned, conducted_at, evaluation')
    .eq('user_id', userId)
    .order('conducted_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data as InterviewHistoryRow[];
}

export async function startInterview(
  category: string,
  targetRole: string,
  skillGaps: string[],
  userId: string
): Promise<{ questions: InterviewQuestionDTO[] | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { questions: null, error: 'You must be signed in to start an interview.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/mock-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'start',
      category,
      target_role: targetRole,
      skill_gaps: skillGaps,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    let msg = `Failed to start interview (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) msg = body.error;
    } catch { /* no json */ }
    return { questions: null, error: msg };
  }

  const data = await response.json();
  if (!data?.questions) {
    return { questions: null, error: 'No questions returned from the interview service.' };
  }

  return { questions: data.questions as InterviewQuestionDTO[], error: null };
}

export async function submitInterview(
  userId: string,
  category: string,
  targetRole: string,
  questions: InterviewQuestionDTO[],
  answers: { question_id: string; answer: string }[],
  durationMinutes: number
): Promise<{ result: InterviewSessionResult | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { result: null, error: 'You must be signed in to submit an interview.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const response = await fetch(`${supabaseUrl}/functions/v1/mock-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: 'evaluate',
      user_id: userId,
      category,
      target_role: targetRole,
      questions: questions.map((q) => ({ id: q.id, question: q.question, tags: q.tags, difficulty: q.difficulty })),
      answers,
      duration_minutes: durationMinutes,
    }),
  });

  if (!response.ok) {
    let msg = `Evaluation failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) msg = body.error;
    } catch { /* no json */ }
    return { result: null, error: msg };
  }

  const data = await response.json();
  if (!data?.evaluation) {
    return { result: null, error: 'No evaluation returned from the service.' };
  }

  return {
    result: {
      interviewId: data.interview_id ?? null,
      evaluation: data.evaluation as InterviewEvaluation,
      xpEarned: data.xp_earned ?? 100,
    },
    error: null,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 65) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-success/10 border-success/20';
  if (score >= 65) return 'bg-primary/10 border-primary/20';
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
