import { supabase } from '@/lib/supabase/client';
import { XP_RULES, getLevelFromXp, MAX_LEVEL } from '@/lib/gamification/xp-rules';
import { BADGE_DEFINITIONS } from '@/lib/gamification/badges';

export interface AchievementEvent {
  type: 'level_up' | 'badge_unlocked' | 'streak_milestone';
  level?: number;
  badgeSlug?: string;
  badgeName?: string;
  badgeIcon?: string;
  streak?: number;
  xpGained?: number;
}

export interface AwardResult {
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: string[];
  streakUpdated: boolean;
  newStreak: number;
  achievements: AchievementEvent[];
  error: string | null;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function dateDiffDays(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00Z').getTime();
  const d2 = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

async function updateStreak(userId: string, currentStreak: number, lastActivityDate: string | null): Promise<{ streak: number; updated: boolean; milestone: number | null }> {
  const today = todayStr();

  if (lastActivityDate === today) {
    return { streak: currentStreak, updated: false, milestone: null };
  }

  let newStreak = 1;
  if (lastActivityDate) {
    const diff = dateDiffDays(lastActivityDate, today);
    if (diff === 1) {
      newStreak = currentStreak + 1;
    } else if (diff === 0) {
      newStreak = currentStreak;
    } else {
      newStreak = 1;
    }
  }

  await supabase
    .from('profiles')
    .update({ streak: newStreak, last_activity_date: today })
    .eq('id', userId);

  await supabase
    .from('streak_log')
    .upsert({ user_id: userId, activity_date: today, xp_earned: XP_RULES.STREAK_DAILY }, { onConflict: 'user_id,activity_date' });

  let milestone: number | null = null;
  if (newStreak === 3 || newStreak === 7 || newStreak === 30) {
    milestone = newStreak;
  }

  return { streak: newStreak, updated: true, milestone };
}

async function checkAndAwardBadges(userId: string): Promise<{ newBadges: string[]; events: AchievementEvent[]; badgeXp: number }> {
  const newBadges: string[] = [];
  const events: AchievementEvent[] = [];
  let badgeXp = 0;

  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);
  const existingBadgeIds = new Set((existingBadges ?? []).map((b) => b.badge_id));

  const { data: allBadges } = await supabase
    .from('badges')
    .select('id, slug, name, icon_name, xp_reward');
  if (!allBadges) return { newBadges, events, badgeXp };
  const badgeMap = new Map(allBadges.map((b) => [b.slug, b]));

  for (const def of BADGE_DEFINITIONS) {
    const badgeRow = badgeMap.get(def.slug);
    if (!badgeRow || existingBadgeIds.has(badgeRow.id)) continue;

    const earned = await evaluateBadgeCriteria(userId, def.slug);
    if (!earned) continue;

    await supabase.from('user_badges').insert({ user_id: userId, badge_id: badgeRow.id });
    newBadges.push(def.slug);
    badgeXp += badgeRow.xp_reward;

    await supabase.from('user_activity').insert({
      user_id: userId,
      activity_type: 'badge',
      title: `Badge unlocked: ${def.name}`,
      description: def.description,
      xp: badgeRow.xp_reward,
    });

    events.push({
      type: 'badge_unlocked',
      badgeSlug: def.slug,
      badgeName: def.name,
      badgeIcon: def.iconName,
      xpGained: badgeRow.xp_reward,
    });
  }

  return { newBadges, events, badgeXp };
}

async function evaluateBadgeCriteria(userId: string, slug: string): Promise<boolean> {
  switch (slug) {
    case 'first_assessment': {
      const { count } = await supabase.from('user_assessments').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      return (count ?? 0) >= 1;
    }
    case 'assessment_master': {
      const { data } = await supabase.from('user_assessments').select('score').eq('user_id', userId);
      return (data ?? []).some((a) => a.score >= 80);
    }
    case 'perfect_score': {
      const { data } = await supabase.from('user_assessments').select('score').eq('user_id', userId);
      return (data ?? []).some((a) => a.score === 100);
    }
    case 'all_assessments': {
      const { count: assessCount } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
      const { data: userAssess } = await supabase.from('user_assessments').select('assessment_id').eq('user_id', userId);
      const uniqueAssessments = new Set((userAssess ?? []).map((a) => a.assessment_id));
      return uniqueAssessments.size >= (assessCount ?? 6);
    }
    case 'streak_3': {
      const { data } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      return (data?.streak ?? 0) >= 3;
    }
    case 'streak_7': {
      const { data } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      return (data?.streak ?? 0) >= 7;
    }
    case 'streak_30': {
      const { data } = await supabase.from('profiles').select('streak').eq('id', userId).maybeSingle();
      return (data?.streak ?? 0) >= 30;
    }
    case 'dsa_10': {
      const { count } = await supabase.from('dsa_practice').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      return (count ?? 0) >= 10;
    }
    case 'dsa_50': {
      const { count } = await supabase.from('dsa_practice').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      return (count ?? 0) >= 50;
    }
    case 'dsa_hard_5': {
      const { count } = await supabase.from('dsa_practice').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('difficulty', 'Hard');
      return (count ?? 0) >= 5;
    }
    case 'first_project': {
      const { count } = await supabase.from('user_projects').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed');
      return (count ?? 0) >= 1;
    }
    case 'project_5': {
      const { count } = await supabase.from('user_projects').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed');
      return (count ?? 0) >= 5;
    }
    case 'skill_master': {
      const { data } = await supabase
        .from('user_skills')
        .select('proficiency, skill_id')
        .eq('user_id', userId);
      const { data: skills } = await supabase.from('skills').select('id, max_level');
      if (!data || !skills) return false;
      const maxMap = new Map(skills.map((s) => [s.id, s.max_level]));
      return data.some((us) => us.proficiency >= (maxMap.get(us.skill_id) ?? 5));
    }
    case 'polymath': {
      const { data } = await supabase.from('user_skills').select('proficiency').eq('user_id', userId);
      return (data ?? []).filter((us) => us.proficiency >= 3).length >= 4;
    }
    case 'first_interview': {
      const { count } = await supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('user_id', userId);
      return (count ?? 0) >= 1;
    }
    case 'interview_pro': {
      const { data } = await supabase.from('interviews').select('score').eq('user_id', userId);
      return (data ?? []).some((i) => i.score >= 80);
    }
    default:
      return false;
  }
}

export async function awardXp(
  userId: string,
  xpAmount: number,
  activity: { type: string; title: string; description?: string }
): Promise<AwardResult> {
  const empty: AwardResult = {
    newTotalXp: 0,
    newLevel: 1,
    leveledUp: false,
    newBadges: [],
    streakUpdated: false,
    newStreak: 0,
    achievements: [],
    error: null,
  };

  if (xpAmount <= 0) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('xp, level, streak')
      .eq('id', userId)
      .maybeSingle();
    return { ...empty, newTotalXp: prof?.xp ?? 0, newLevel: prof?.level ?? 1, newStreak: prof?.streak ?? 0 };
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('xp, level, streak, last_activity_date')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return { ...empty, error: profileErr?.message ?? 'Profile not found' };
  }

  const oldLevel = profile.level;
  const newTotalXp = profile.xp + xpAmount;
  const newLevel = getLevelFromXp(newTotalXp);
  const leveledUp = newLevel > oldLevel;

  const streakResult = await updateStreak(userId, profile.streak, profile.last_activity_date);

  await supabase
    .from('profiles')
    .update({ xp: newTotalXp, level: newLevel })
    .eq('id', userId);

  await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: activity.type,
    title: activity.title,
    description: activity.description ?? '',
    xp: xpAmount,
  });

  const achievements: AchievementEvent[] = [];

  if (leveledUp) {
    achievements.push({ type: 'level_up', level: newLevel, xpGained: xpAmount });
  }

  if (streakResult.milestone) {
    achievements.push({ type: 'streak_milestone', streak: streakResult.milestone });
  }

  const badgeResult = await checkAndAwardBadges(userId);
  achievements.push(...badgeResult.events);

  let finalXp = newTotalXp + badgeResult.badgeXp;
  let finalLevel = getLevelFromXp(finalXp);
  if (badgeResult.badgeXp > 0) {
    await supabase.from('profiles').update({ xp: finalXp, level: finalLevel }).eq('id', userId);
  }

  if (finalLevel > newLevel && !achievements.some((a) => a.type === 'level_up')) {
    achievements.push({ type: 'level_up', level: finalLevel, xpGained: badgeResult.badgeXp });
  }

  return {
    newTotalXp: finalXp,
    newLevel: finalLevel,
    leveledUp: finalLevel > oldLevel,
    newBadges: badgeResult.newBadges,
    streakUpdated: streakResult.updated,
    newStreak: streakResult.streak,
    achievements,
    error: null,
  };
}

export async function getUserStats(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak, last_activity_date')
    .eq('id', userId)
    .maybeSingle();

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId);

  const { data: activity } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const { count: dsaCount } = await supabase
    .from('dsa_practice')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: projectCount } = await supabase
    .from('user_projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed');

  const { count: interviewCount } = await supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: assessmentCount } = await supabase
    .from('user_assessments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    profile,
    badges: badges ?? [],
    activity: activity ?? [],
    dsaCount: dsaCount ?? 0,
    projectCount: projectCount ?? 0,
    interviewCount: interviewCount ?? 0,
    assessmentCount: assessmentCount ?? 0,
  };
}

export { MAX_LEVEL };
