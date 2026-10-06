import { supabase } from '@/lib/supabase/client';
import type { MentorProfile, MentorshipRequest } from '@/lib/database.types';

export interface MentorWithStats extends MentorProfile {
  pending_requests: number;
  my_request_status: string | null;
}

export interface MentorshipRequestWithDetails extends MentorshipRequest {
  mentor_name: string;
  mentor_company: string;
  mentor_role: string;
  mentor_avatar: string | null;
  student_name: string;
  student_avatar: string | null;
  student_college: string;
  student_target_role: string;
  student_level: number;
}

export async function fetchMentors(
  searchQuery: string,
  skillFilter: string,
  userId: string
): Promise<MentorWithStats[]> {
  let query = supabase
    .from('mentor_profiles')
    .select('*')
    .eq('is_available', true)
    .neq('user_id', userId)
    .order('rating', { ascending: false })
    .limit(30);

  if (skillFilter !== 'all') {
    query = query.contains('skills', [skillFilter]);
  }

  const { data: mentors, error } = await query;
  if (error || !mentors) return [];

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    return mentors.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.skills.some((s: string) => s.toLowerCase().includes(q)) ||
        m.specializations.some((s: string) => s.toLowerCase().includes(q))
    );
  }

  if (mentors.length === 0) return [];

  const mentorIds = mentors.map((m) => m.id);
  const { data: pendingReqs } = await supabase
    .from('mentorship_requests')
    .select('mentor_id')
    .in('mentor_id', mentorIds)
    .eq('status', 'pending');

  const pendingMap = new Map<string, number>();
  for (const r of pendingReqs ?? []) {
    pendingMap.set(r.mentor_id, (pendingMap.get(r.mentor_id) ?? 0) + 1);
  }

  const { data: myRequests } = await supabase
    .from('mentorship_requests')
    .select('mentor_id, status')
    .eq('student_id', userId)
    .in('mentor_id', mentorIds);

  const myReqMap = new Map<string, string>();
  for (const r of myRequests ?? []) {
    myReqMap.set(r.mentor_id, r.status);
  }

  return mentors.map((m) => ({
    ...m,
    pending_requests: pendingMap.get(m.id) ?? 0,
    my_request_status: myReqMap.get(m.id) ?? null,
  }));
}

export async function fetchMentorById(mentorId: string, userId: string): Promise<MentorWithStats | null> {
  const { data: mentor, error } = await supabase
    .from('mentor_profiles')
    .select('*')
    .eq('id', mentorId)
    .maybeSingle();

  if (error || !mentor) return null;

  const { count: pendingCount } = await supabase
    .from('mentorship_requests')
    .select('*', { count: 'exact', head: true })
    .eq('mentor_id', mentorId)
    .eq('status', 'pending');

  const { data: myReq } = await supabase
    .from('mentorship_requests')
    .select('status')
    .eq('mentor_id', mentorId)
    .eq('student_id', userId)
    .maybeSingle();

  return {
    ...mentor,
    pending_requests: pendingCount ?? 0,
    my_request_status: myReq?.status ?? null,
  };
}

export async function createMentorshipRequest(
  mentorId: string,
  studentId: string,
  message: string,
  goals: string
): Promise<{ error: string | null }> {
  const { data: selfMentor } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', studentId)
    .maybeSingle();

  if (selfMentor && selfMentor.id === mentorId) {
    return { error: 'You cannot send a mentorship request to yourself' };
  }

  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id, status')
    .eq('mentor_id', mentorId)
    .eq('student_id', studentId)
    .in('status', ['pending', 'accepted'])
    .maybeSingle();

  if (existing) {
    return { error: existing.status === 'pending' ? 'You already have a pending request with this mentor' : 'You are already mentored by this mentor' };
  }

  const { data: mentor } = await supabase
    .from('mentor_profiles')
    .select('max_mentees, current_mentees')
    .eq('id', mentorId)
    .maybeSingle();

  if (mentor && mentor.current_mentees >= mentor.max_mentees) {
    return { error: 'This mentor has reached their maximum mentee capacity' };
  }

  await supabase
    .from('mentorship_requests')
    .delete()
    .eq('mentor_id', mentorId)
    .eq('student_id', studentId)
    .in('status', ['rejected', 'cancelled', 'completed']);

  const { error } = await supabase.from('mentorship_requests').insert({
    mentor_id: mentorId,
    student_id: studentId,
    message,
    goals,
    status: 'pending',
  });
  return { error: error?.message ?? null };
}

export async function updateMentorshipRequestStatus(
  requestId: string,
  mentorUserId: string,
  status: 'accepted' | 'rejected' | 'completed'
): Promise<{ error: string | null }> {
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', mentorUserId)
    .maybeSingle();

  if (!mentorProfile) return { error: 'Mentor profile not found' };

  const { error } = await supabase
    .from('mentorship_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('mentor_id', mentorProfile.id);

  if (error) return { error: error.message };

  if (status === 'accepted') {
    const { data: req } = await supabase
      .from('mentorship_requests')
      .select('mentor_id')
      .eq('id', requestId)
      .maybeSingle();

    if (req) {
      const { count } = await supabase
        .from('mentorship_requests')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', req.mentor_id)
        .eq('status', 'accepted');

      await supabase
        .from('mentor_profiles')
        .update({ current_mentees: count ?? 0 })
        .eq('id', req.mentor_id);
    }
  }

  return { error: null };
}

export async function cancelMentorshipRequest(
  requestId: string,
  studentId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('mentorship_requests')
    .delete()
    .eq('id', requestId)
    .eq('student_id', studentId);
  return { error: error?.message ?? null };
}

export async function fetchMyMentorshipRequests(studentId: string): Promise<MentorshipRequestWithDetails[]> {
  const { data: requests, error } = await supabase
    .from('mentorship_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error || !requests || requests.length === 0) return [];

  const mentorIds = Array.from(new Set(requests.map((r) => r.mentor_id)));
  const { data: mentors } = await supabase
    .from('mentor_profiles')
    .select('id, user_id, full_name, company, role')
    .in('id', mentorIds);

  const mentorMap = new Map((mentors ?? []).map((m) => [m.id, m]));

  const mentorUserIds = (mentors ?? []).map((m) => m.user_id);
  const { data: mentorProfiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .in('id', mentorUserIds);
  const avatarMap = new Map((mentorProfiles ?? []).map((p) => [p.id, p.avatar_url]));

  return requests.map((r) => {
    const mentor = mentorMap.get(r.mentor_id);
    return {
      ...r,
      mentor_name: mentor?.full_name ?? 'Unknown',
      mentor_company: mentor?.company ?? '',
      mentor_role: mentor?.role ?? '',
      mentor_avatar: mentor ? avatarMap.get(mentor.user_id) ?? null : null,
      student_name: '',
      student_avatar: null,
      student_college: '',
      student_target_role: '',
      student_level: 1,
    } as MentorshipRequestWithDetails;
  });
}

export async function fetchReceivedMentorshipRequests(mentorUserId: string): Promise<MentorshipRequestWithDetails[]> {
  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', mentorUserId)
    .maybeSingle();

  if (!mentorProfile) return [];

  const { data: requests, error } = await supabase
    .from('mentorship_requests')
    .select('*')
    .eq('mentor_id', mentorProfile.id)
    .order('created_at', { ascending: false });

  if (error || !requests || requests.length === 0) return [];

  const studentIds = Array.from(new Set(requests.map((r) => r.student_id)));
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, college, target_role, level')
    .in('id', studentIds);

  const studentMap = new Map((students ?? []).map((s) => [s.id, s]));

  return requests.map((r) => {
    const student = studentMap.get(r.student_id);
    return {
      ...r,
      mentor_name: '',
      mentor_company: '',
      mentor_role: '',
      mentor_avatar: null,
      student_name: student?.full_name ?? 'Unknown',
      student_avatar: student?.avatar_url ?? null,
      student_college: student?.college ?? '',
      student_target_role: student?.target_role ?? '',
      student_level: student?.level ?? 1,
    } as MentorshipRequestWithDetails;
  });
}

export async function checkIsMentor(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('mentor_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function createMentorProfile(
  userId: string,
  fullName: string,
  bio: string,
  company: string,
  role: string,
  skills: string[],
  specializations: string[],
  experienceYears: number,
  linkedinUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('mentor_profiles').insert({
    user_id: userId,
    full_name: fullName,
    bio,
    company,
    role,
    skills,
    specializations,
    experience_years: experienceYears,
    linkedin_url: linkedinUrl,
    is_available: true,
    max_mentees: 5,
  });
  return { error: error?.message ?? null };
}

export const MENTOR_SKILLS = [
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Node.js',
  'PostgreSQL', 'System Design', 'Docker', 'Kubernetes', 'AWS',
  'Machine Learning', 'Data Science', 'SQL', 'Algorithms', 'DSA',
  'Microservices', 'CI/CD', 'Linux', 'Flutter', 'React Native',
  'Testing', 'GraphQL', 'Redis', 'MongoDB', 'Git',
];
