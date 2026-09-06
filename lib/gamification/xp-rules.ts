export const MAX_LEVEL = 7;

export const LEVEL_THRESHOLDS: number[] = [
  0,
  1000,
  3000,
  6000,
  10000,
  15000,
  21000,
];

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Rookie',
  2: 'Explorer',
  3: 'Achiever',
  4: 'Challenger',
  5: 'Expert',
  6: 'Master',
  7: 'Grandmaster',
};

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, MAX_LEVEL);
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? 'Rookie';
}

export function getXpForCurrentLevel(totalXp: number): { currentLevelXp: number; nextLevelXp: number; xpIntoLevel: number; xpForNextLevel: number; progressPct: number; level: number; nextLevel: number | null } {
  const level = getLevelFromXp(totalXp);
  if (level >= MAX_LEVEL) {
    const baseXp = LEVEL_THRESHOLDS[MAX_LEVEL - 1];
    return {
      currentLevelXp: baseXp,
      nextLevelXp: baseXp,
      xpIntoLevel: totalXp - baseXp,
      xpForNextLevel: 0,
      progressPct: 100,
      level,
      nextLevel: null,
    };
  }
  const baseXp = LEVEL_THRESHOLDS[level - 1];
  const nextXp = LEVEL_THRESHOLDS[level];
  const xpIntoLevel = totalXp - baseXp;
  const xpForNextLevel = nextXp - totalXp;
  const progressPct = (xpIntoLevel / (nextXp - baseXp)) * 100;
  return {
    currentLevelXp: baseXp,
    nextLevelXp: nextXp,
    xpIntoLevel,
    xpForNextLevel,
    progressPct,
    level,
    nextLevel: level + 1,
  };
}

export const XP_RULES = {
  ASSESSMENT_CORRECT: 50,
  ASSESSMENT_BONUS_80: 100,
  ASSESSMENT_BONUS_100: 200,

  DSA_EASY: 30,
  DSA_MEDIUM: 60,
  DSA_HARD: 100,

  PROJECT_COMPLETE: 200,
  PROJECT_RATING_BONUS: 50,

  INTERVIEW_COMPLETE: 100,
  INTERVIEW_BONUS_80: 150,

  LEARNING_VIDEO: 20,
  LEARNING_ARTICLE: 15,
  LEARNING_ROADMAP_PHASE: 100,

  STREAK_DAILY: 10,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_30: 200,

  BADGE_REWARD_BASE: 100,
} as const;

export type ActivityType =
  | 'assessment'
  | 'dsa'
  | 'project'
  | 'interview'
  | 'learning'
  | 'badge'
  | 'streak';

export function dsaXpForDifficulty(difficulty: string): number {
  const d = difficulty.toLowerCase();
  if (d === 'hard') return XP_RULES.DSA_HARD;
  if (d === 'medium') return XP_RULES.DSA_MEDIUM;
  return XP_RULES.DSA_EASY;
}

export function assessmentXp(correctCount: number, totalQuestions: number): number {
  let xp = correctCount * XP_RULES.ASSESSMENT_CORRECT;
  const score = (correctCount / totalQuestions) * 100;
  if (score === 100) xp += XP_RULES.ASSESSMENT_BONUS_100;
  else if (score >= 80) xp += XP_RULES.ASSESSMENT_BONUS_80;
  return xp;
}
