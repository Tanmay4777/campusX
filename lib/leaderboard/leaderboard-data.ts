import { supabase } from '@/lib/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  college: string;
  level: number;
  xp: number;
  streak: number;
  badge_count: number;
  rank: number;
  is_current_user: boolean;
}

export interface SkillLeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  college: string;
  skill_name: string;
  proficiency: number;
  skill_xp: number;
  rank: number;
  is_current_user: boolean;
}

export interface ImprovedUserEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  college: string;
  xp_this_period: number;
  previous_xp: number;
  improvement_pct: number;
  rank: number;
  is_current_user: boolean;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

function periodStart(period: LeaderboardPeriod): Date {
  const now = new Date();
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }
  if (period === 'monthly') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }
  return new Date(0);
}

export async function fetchXpLeaderboard(
  period: LeaderboardPeriod,
  currentUserId: string
): Promise<LeaderboardEntry[]> {
  if (period === 'all-time') {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, college, level, xp, streak')
      .order('xp', { ascending: false })
      .limit(50);

    if (error || !profiles) return [];

    const userIds = profiles.map((p) => p.id);
    const { data: badges } = await supabase
      .from('user_badges')
      .select('user_id')
      .in('user_id', userIds);

    const badgeCountMap = new Map<string, number>();
    for (const b of badges ?? []) {
      badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) ?? 0) + 1);
    }

    return profiles.map((p, idx) => ({
      user_id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      college: p.college,
      level: p.level,
      xp: p.xp,
      streak: p.streak,
      badge_count: badgeCountMap.get(p.id) ?? 0,
      rank: idx + 1,
      is_current_user: p.id === currentUserId,
    }));
  }

  const start = periodStart(period);

  const { data: activities, error } = await supabase
    .from('user_activity')
    .select('user_id, xp')
    .gte('created_at', start.toISOString());

  if (error || !activities) return [];

  const xpMap = new Map<string, number>();
  for (const a of activities) {
    xpMap.set(a.user_id, (xpMap.get(a.user_id) ?? 0) + a.xp);
  }

  const sortedUserIds = Array.from(xpMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([uid]) => uid);

  if (sortedUserIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, college, level, xp, streak')
    .in('id', sortedUserIds);

  if (!profiles) return [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const { data: badges } = await supabase
    .from('user_badges')
    .select('user_id')
    .in('user_id', sortedUserIds);

  const badgeCountMap = new Map<string, number>();
  for (const b of badges ?? []) {
    badgeCountMap.set(b.user_id, (badgeCountMap.get(b.user_id) ?? 0) + 1);
  }

  return sortedUserIds.map((uid, idx) => {
    const p = profileMap.get(uid);
    return {
      user_id: uid,
      full_name: p?.full_name ?? 'Unknown',
      avatar_url: p?.avatar_url ?? null,
      college: p?.college ?? '',
      level: p?.level ?? 1,
      xp: xpMap.get(uid) ?? 0,
      streak: p?.streak ?? 0,
      badge_count: badgeCountMap.get(uid) ?? 0,
      rank: idx + 1,
      is_current_user: uid === currentUserId,
    };
  });
}

export async function fetchSkillLeaderboard(
  currentUserId: string
): Promise<SkillLeaderboardEntry[]> {
  const { data: userSkills, error } = await supabase
    .from('user_skills')
    .select('user_id, skill_id, proficiency, xp')
    .order('xp', { ascending: false })
    .limit(50);

  if (error || !userSkills) return [];

  const skillIds = Array.from(new Set(userSkills.map((us) => us.skill_id)));
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name')
    .in('id', skillIds);

  const skillMap = new Map((skills ?? []).map((s) => [s.id, s.name]));

  const userIds = Array.from(new Set(userSkills.map((us) => us.user_id)));
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, college')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return userSkills.map((us, idx) => {
    const p = profileMap.get(us.user_id);
    return {
      user_id: us.user_id,
      full_name: p?.full_name ?? 'Unknown',
      avatar_url: p?.avatar_url ?? null,
      college: p?.college ?? '',
      skill_name: skillMap.get(us.skill_id) ?? 'Unknown',
      proficiency: us.proficiency,
      skill_xp: us.xp,
      rank: idx + 1,
      is_current_user: us.user_id === currentUserId,
    };
  });
}

export async function fetchMostImproved(
  currentUserId: string
): Promise<ImprovedUserEntry[]> {
  const now = new Date();
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

  const { data: recentActivity } = await supabase
    .from('user_activity')
    .select('user_id, xp, created_at')
    .gte('created_at', monthStart.toISOString());

  const { data: olderActivity } = await supabase
    .from('user_activity')
    .select('user_id, xp, created_at')
    .gte('created_at', twoMonthsAgo.toISOString())
    .lt('created_at', monthStart.toISOString());

  const recentXpMap = new Map<string, number>();
  for (const a of recentActivity ?? []) {
    recentXpMap.set(a.user_id, (recentXpMap.get(a.user_id) ?? 0) + a.xp);
  }

  const olderXpMap = new Map<string, number>();
  for (const a of olderActivity ?? []) {
    olderXpMap.set(a.user_id, (olderXpMap.get(a.user_id) ?? 0) + a.xp);
  }

  const allUserIds = Array.from(new Set(Array.from(recentXpMap.keys()).concat(Array.from(olderXpMap.keys()))));

  const entries: ImprovedUserEntry[] = [];
  for (const uid of allUserIds) {
    const recentXp = recentXpMap.get(uid) ?? 0;
    const olderXp = olderXpMap.get(uid) ?? 0;
    if (recentXp === 0) continue;
    const improvementPct = olderXp > 0 ? Math.round(((recentXp - olderXp) / olderXp) * 100) : recentXp > 0 ? 100 : 0;
    entries.push({
      user_id: uid,
      full_name: '',
      avatar_url: null,
      college: '',
      xp_this_period: recentXp,
      previous_xp: olderXp,
      improvement_pct: improvementPct,
      rank: 0,
      is_current_user: uid === currentUserId,
    });
  }

  entries.sort((a, b) => b.improvement_pct - a.improvement_pct);
  const top = entries.slice(0, 30);

  if (top.length === 0) return [];

  const userIds = top.map((e) => e.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, college')
    .in('id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return top.map((e, idx) => {
    const p = profileMap.get(e.user_id);
    return {
      ...e,
      full_name: p?.full_name ?? 'Unknown',
      avatar_url: p?.avatar_url ?? null,
      college: p?.college ?? '',
      rank: idx + 1,
    };
  });
}
