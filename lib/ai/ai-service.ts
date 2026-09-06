import { supabase } from '@/lib/supabase/client';

const AI_ENGINE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-engine`;

export interface ReadinessScore {
  overall: number;
  skills_score: number;
  projects_score: number;
  interview_score: number;
  resume_score: number;
  roadmap_score: number;
  assessment_score: number;
  factors: { label: string; score: number; weight: number; detail: string }[];
  recommendations: string[];
}

export interface RoadmapRecommendation {
  roadmap_id: string;
  role: string;
  title: string;
  description: string;
  estimated_weeks: number;
  match_score: number;
  missing_critical_skills: string[];
  reason: string;
}

export interface ProjectRecommendation {
  project_id: string;
  title: string;
  description: string;
  difficulty: string;
  tech_stack: string[];
  required_skills: string[];
  xp_reward: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  reason: string;
}

export interface GeneratedQuestion {
  question: string;
  category: string;
  difficulty: string;
  tags: string[];
  expected_topics: string[];
  hint: string;
}

export interface SemanticMatchResult {
  score: number;
  matched: string[];
  missing: string[];
  preferredMatched: string[];
}

export interface FullAnalysis {
  user_skills: string[];
  target_role: string;
  roadmap_recommendations: RoadmapRecommendation[];
  project_recommendations: ProjectRecommendation[];
  readiness_score: ReadinessScore;
}

type AIError = { error: string };

function isAIError(data: unknown): data is AIError {
  return typeof data === 'object' && data !== null && 'error' in data && typeof (data as AIError).error === 'string';
}

async function callAIEngine(body: Record<string, unknown>): Promise<unknown> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  const res = await fetch(AI_ENGINE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: `AI engine returned ${res.status}` }));
    throw new Error(errorData.error || `AI engine request failed (${res.status})`);
  }

  const data = await res.json();
  if (isAIError(data)) {
    throw new Error(data.error);
  }
  return data;
}

export async function extractSkills(text: string): Promise<{ skills: string[]; count: number }> {
  return callAIEngine({ action: 'skill_extraction', text }) as Promise<{ skills: string[]; count: number }>;
}

export async function semanticMatch(
  userId: string,
  requiredSkills: string[],
  preferredSkills: string[]
): Promise<SemanticMatchResult> {
  return callAIEngine({
    action: 'semantic_match',
    user_id: userId,
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
  }) as Promise<SemanticMatchResult>;
}

export async function recommendRoadmaps(userId: string, targetRole?: string): Promise<{ recommendations: RoadmapRecommendation[] }> {
  return callAIEngine({
    action: 'recommend_roadmaps',
    user_id: userId,
    target_role: targetRole,
  }) as Promise<{ recommendations: RoadmapRecommendation[] }>;
}

export async function recommendProjects(userId: string): Promise<{ recommendations: ProjectRecommendation[] }> {
  return callAIEngine({
    action: 'recommend_projects',
    user_id: userId,
  }) as Promise<{ recommendations: ProjectRecommendation[] }>;
}

export async function generateQuestions(
  userId: string,
  category: string,
  skillGaps?: string[],
  count?: number
): Promise<{ questions: GeneratedQuestion[] }> {
  return callAIEngine({
    action: 'generate_questions',
    user_id: userId,
    category,
    skill_gaps: skillGaps,
    count,
  }) as Promise<{ questions: GeneratedQuestion[] }>;
}

export async function getReadinessScore(userId: string, targetRole?: string): Promise<ReadinessScore> {
  return callAIEngine({
    action: 'readiness_score',
    user_id: userId,
    target_role: targetRole,
  }) as Promise<ReadinessScore>;
}

export async function getFullAnalysis(userId: string, targetRole?: string): Promise<FullAnalysis> {
  return callAIEngine({
    action: 'full_analysis',
    user_id: userId,
    target_role: targetRole,
  }) as Promise<FullAnalysis>;
}
