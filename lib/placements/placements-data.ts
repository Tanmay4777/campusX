import { supabase } from '@/lib/supabase/client';

export interface JobWithMatch {
  id: string;
  posted_by: string;
  company: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  role: string;
  required_skills: string[];
  preferred_skills: string[];
  min_cgpa: number;
  eligible_years: string[];
  eligible_branches: string[];
  package_lpa: number;
  deadline: string;
  is_active: boolean;
  application_count: number;
  created_at: string;
  updated_at: string;
  is_saved: boolean;
  application_status: string | null;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  is_eligible: boolean;
  eligibility_issues: string[];
}

export interface JobApplicationWithJob {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  cover_letter: string;
  resume_url: string;
  applied_at: string;
  updated_at: string;
  job_company: string;
  job_title: string;
  job_location: string;
  job_package_lpa: number;
  job_role: string;
  job_deadline: string;
}

export interface AdminAnalytics {
  total_students: number;
  total_jobs: number;
  total_applications: number;
  total_assessments: number;
  total_announcements: number;
  applications_by_status: Record<string, number>;
  top_companies: { company: string; count: number }[];
  branch_distribution: Record<string, number>;
  readiness_distribution: { ready: number; developing: number; not_ready: number };
  avg_xp: number;
  avg_level: number;
  avg_streak: number;
}

export interface StudentReadiness {
  user_id: string;
  full_name: string;
  email: string;
  college: string;
  branch: string;
  year: string;
  level: number;
  xp: number;
  streak: number;
  badges_count: number;
  projects_count: number;
  skills_count: number;
  assessments_count: number;
  applications_count: number;
  readiness_score: number;
}

export async function fetchUserSkills(userId: string): Promise<string[]> {
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select('skill_id')
    .eq('user_id', userId);

  if (!userSkills || userSkills.length === 0) return [];

  const skillIds = userSkills.map((us) => us.skill_id);
  const { data: skills } = await supabase
    .from('skills')
    .select('name')
    .in('id', skillIds);

  return (skills ?? []).map((s) => s.name);
}

function calculateMatchScore(
  requiredSkills: string[],
  preferredSkills: string[],
  userSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  const userSkillsLower = userSkills.map((s) => s.toLowerCase());
  const matched = requiredSkills.filter((s) => userSkillsLower.includes(s.toLowerCase()));
  const missing = requiredSkills.filter((s) => !userSkillsLower.includes(s.toLowerCase()));
  const preferredMatched = preferredSkills.filter((s) => userSkillsLower.includes(s.toLowerCase()));

  const requiredScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 70 : 70;
  const preferredScore = preferredSkills.length > 0 ? (preferredMatched.length / preferredSkills.length) * 30 : 30;
  const score = Math.round(requiredScore + preferredScore);

  return { score: Math.min(100, score), matched, missing };
}

function checkEligibility(
  job: { eligible_years: string[]; eligible_branches: string[]; min_cgpa: number },
  profile: { year: string; branch: string }
): { eligible: boolean; issues: string[] } {
  const issues: string[] = [];
  if (job.eligible_years.length > 0 && !job.eligible_years.includes(profile.year)) {
    issues.push(`Year ${profile.year} not eligible (requires: ${job.eligible_years.join(', ')})`);
  }
  if (job.eligible_branches.length > 0 && !job.eligible_branches.includes(profile.branch)) {
    issues.push(`Branch ${profile.branch} not eligible (requires: ${job.eligible_branches.join(', ')})`);
  }
  return { eligible: issues.length === 0, issues };
}

export async function fetchJobs(
  userId: string,
  profile: { year: string; branch: string },
  searchQuery: string,
  jobType: string,
  sortBy: string
): Promise<JobWithMatch[]> {
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (jobType !== 'all') {
    query = query.eq('job_type', jobType);
  }

  const { data: jobsData, error } = await query;
  if (error || !jobsData) return [];

  let jobs: typeof jobsData = jobsData;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    jobs = jobs.filter(
      (j: { company: string; title: string; role: string; location: string }) =>
        j.company.toLowerCase().includes(q) ||
        j.title.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }

  if (jobs.length === 0) return [];

  const [userSkills, savedJobs, applications] = await Promise.all([
    fetchUserSkills(userId),
    supabase.from('saved_jobs').select('job_id').eq('user_id', userId),
    supabase.from('job_applications').select('job_id, status').eq('user_id', userId),
  ]);

  const savedJobIds = new Set((savedJobs.data ?? []).map((s: { job_id: string }) => s.job_id));
  const appMap = new Map((applications.data ?? []).map((a: { job_id: string; status: string }) => [a.job_id, a.status]));

  let result = jobs.map((job: typeof jobs[number]) => {
    const match = calculateMatchScore(job.required_skills, job.preferred_skills, userSkills);
    const eligibility = checkEligibility(job, profile);
    return {
      ...job,
      is_saved: savedJobIds.has(job.id),
      application_status: appMap.get(job.id) ?? null,
      match_score: match.score,
      matched_skills: match.matched,
      missing_skills: match.missing,
      is_eligible: eligibility.eligible,
      eligibility_issues: eligibility.issues,
    } as JobWithMatch;
  });

  if (sortBy === 'match') {
    result = result.sort((a, b) => b.match_score - a.match_score);
  } else if (sortBy === 'deadline') {
    result = result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  } else if (sortBy === 'package') {
    result = result.sort((a, b) => b.package_lpa - a.package_lpa);
  }

  return result;
}

export async function toggleSaveJob(jobId: string, userId: string, isSaved: boolean): Promise<{ error: string | null }> {
  if (isSaved) {
    const { error } = await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', userId);
    return { error: error?.message ?? null };
  } else {
    const { error } = await supabase.from('saved_jobs').insert({ job_id: jobId, user_id: userId });
    return { error: error?.message ?? null };
  }
}

export async function applyToJob(
  jobId: string,
  userId: string,
  coverLetter: string,
  resumeUrl: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('job_applications').insert({
    job_id: jobId,
    user_id: userId,
    cover_letter: coverLetter,
    resume_url: resumeUrl,
    status: 'applied',
  });
  if (error) return { error: error.message };

  const { count } = await supabase
    .from('job_applications')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', jobId);

  await supabase.from('jobs').update({ application_count: count ?? 0 }).eq('id', jobId);
  return { error: null };
}

export async function withdrawApplication(applicationId: string, userId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('job_applications')
    .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

export async function fetchMyApplications(userId: string): Promise<JobApplicationWithJob[]> {
  const { data: apps, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'withdrawn')
    .order('applied_at', { ascending: false });

  if (error || !apps || apps.length === 0) return [];

  const jobIds = apps.map((a: { job_id: string }) => a.job_id);
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, company, title, location, package_lpa, role, deadline')
    .in('id', jobIds);

  const jobMap = new Map((jobs ?? []).map((j: { id: string; company: string; title: string; location: string; package_lpa: number; role: string; deadline: string }) => [j.id, j]));

  return apps.map((a: typeof apps[number]) => {
    const job = jobMap.get(a.job_id);
    return {
      ...a,
      job_company: job?.company ?? '',
      job_title: job?.title ?? '',
      job_location: job?.location ?? '',
      job_package_lpa: job?.package_lpa ?? 0,
      job_role: job?.role ?? '',
      job_deadline: job?.deadline ?? '',
    } as JobApplicationWithJob;
  });
}

// ============ Admin functions ============

export async function fetchAllJobsAdmin(): Promise<JobWithMatch[]> {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !jobs) return [];

  return jobs.map((job: typeof jobs[number]) => ({
    ...job,
    is_saved: false,
    application_status: null,
    match_score: 0,
    matched_skills: [],
    missing_skills: [],
    is_eligible: true,
    eligibility_issues: [],
  })) as JobWithMatch[];
}

export async function createJob(
  adminId: string,
  data: {
    company: string;
    title: string;
    description: string;
    location: string;
    jobType: string;
    role: string;
    requiredSkills: string[];
    preferredSkills: string[];
    minCgpa: number;
    eligibleYears: string[];
    eligibleBranches: string[];
    packageLpa: number;
    deadline: string;
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('jobs').insert({
    posted_by: adminId,
    company: data.company,
    title: data.title,
    description: data.description,
    location: data.location,
    job_type: data.jobType,
    role: data.role,
    required_skills: data.requiredSkills,
    preferred_skills: data.preferredSkills,
    min_cgpa: data.minCgpa,
    eligible_years: data.eligibleYears,
    eligible_branches: data.eligibleBranches,
    package_lpa: data.packageLpa,
    deadline: data.deadline,
    is_active: true,
  });
  return { error: error?.message ?? null };
}

export async function toggleJobActive(jobId: string, isActive: boolean): Promise<{ error: string | null }> {
  const { error } = await supabase.from('jobs').update({ is_active: isActive }).eq('id', jobId);
  return { error: error?.message ?? null };
}

export async function deleteJob(jobId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  return { error: error?.message ?? null };
}

export async function fetchAnnouncements(): Promise<{ id: string; posted_by: string; title: string; content: string; type: string; priority: string; is_pinned: boolean; created_at: string }[]> {
  const { data, error } = await supabase
    .from('placement_announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}

export async function createAnnouncement(
  adminId: string,
  title: string,
  content: string,
  type: string,
  priority: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('placement_announcements').insert({
    posted_by: adminId,
    title,
    content,
    type,
    priority,
    is_pinned: priority === 'high',
  });
  return { error: error?.message ?? null };
}

export async function deleteAnnouncement(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('placement_announcements').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function fetchPlacementAssessments(): Promise<{ id: string; job_id: string | null; posted_by: string; title: string; description: string; test_type: string; duration_minutes: number; deadline: string; is_active: boolean; created_at: string }[]> {
  const { data, error } = await supabase
    .from('placement_assessments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data;
}

export async function createPlacementAssessment(
  adminId: string,
  data: { title: string; description: string; testType: string; durationMinutes: number; deadline: string; jobId?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('placement_assessments').insert({
    posted_by: adminId,
    job_id: data.jobId ?? null,
    title: data.title,
    description: data.description,
    test_type: data.testType,
    duration_minutes: data.durationMinutes,
    deadline: data.deadline,
    is_active: true,
  });
  return { error: error?.message ?? null };
}

export async function deletePlacementAssessment(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('placement_assessments').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const [studentsRes, jobsRes, appsRes, assessmentsRes, announcementsRes] = await Promise.all([
    supabase.from('profiles').select('id, role, xp, level, streak, branch').eq('role', 'student'),
    supabase.from('jobs').select('id, company', { count: 'exact', head: false }),
    supabase.from('job_applications').select('id, status'),
    supabase.from('placement_assessments').select('*', { count: 'exact', head: true }),
    supabase.from('placement_announcements').select('*', { count: 'exact', head: true }),
  ]);

  const students = studentsRes.data ?? [];
  const jobs = jobsRes.data ?? [];
  const apps = appsRes.data ?? [];

  const applicationsByStatus: Record<string, number> = {};
  for (const a of apps) {
    applicationsByStatus[a.status] = (applicationsByStatus[a.status] ?? 0) + 1;
  }

  const companyMap = new Map<string, number>();
  const jobIds = jobs.map((j: { id: string }) => j.id);
  if (jobIds.length > 0) {
    const { data: appsByJob } = await supabase
      .from('job_applications')
      .select('job_id')
      .in('job_id', jobIds);
    const appIdCount = new Map<string, number>();
    for (const a of (appsByJob ?? [])) {
      appIdCount.set(a.job_id, (appIdCount.get(a.job_id) ?? 0) + 1);
    }
    for (const j of jobs) {
      companyMap.set(j.company, (companyMap.get(j.company) ?? 0) + (appIdCount.get(j.id) ?? 0));
    }
  }

  const topCompanies = Array.from(companyMap.entries())
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const branchDistribution: Record<string, number> = {};
  for (const s of students) {
    const branch = s.branch || 'Unknown';
    branchDistribution[branch] = (branchDistribution[branch] ?? 0) + 1;
  }

  const totalXp = students.reduce((sum: number, s: { xp: number }) => sum + s.xp, 0);
  const totalLevel = students.reduce((sum: number, s: { level: number }) => sum + s.level, 0);
  const totalStreak = students.reduce((sum: number, s: { streak: number }) => sum + s.streak, 0);
  const count = students.length || 1;

  let ready = 0, developing = 0, notReady = 0;
  for (const s of students) {
    if (s.level >= 5 && s.xp >= 3000) ready++;
    else if (s.level >= 3) developing++;
    else notReady++;
  }

  return {
    total_students: students.length,
    total_jobs: jobs.length,
    total_applications: apps.length,
    total_assessments: assessmentsRes.count ?? 0,
    total_announcements: announcementsRes.count ?? 0,
    applications_by_status: applicationsByStatus,
    top_companies: topCompanies,
    branch_distribution: branchDistribution,
    readiness_distribution: { ready, developing, not_ready: notReady },
    avg_xp: Math.round(totalXp / count),
    avg_level: Math.round((totalLevel / count) * 10) / 10,
    avg_streak: Math.round((totalStreak / count) * 10) / 10,
  };
}

export async function fetchStudentReadiness(): Promise<StudentReadiness[]> {
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, college, branch, year, level, xp, streak')
    .eq('role', 'student')
    .order('xp', { ascending: false })
    .limit(100);

  if (error || !students) return [];

  const studentIds = students.map((s: { id: string }) => s.id);

  const [badgesRes, projectsRes, skillsRes, assessmentsRes, appsRes] = await Promise.all([
    supabase.from('user_badges').select('user_id').in('user_id', studentIds),
    supabase.from('user_projects').select('user_id').in('user_id', studentIds).neq('status', 'not_started'),
    supabase.from('user_skills').select('user_id').in('user_id', studentIds),
    supabase.from('user_assessments').select('user_id').in('user_id', studentIds),
    supabase.from('job_applications').select('user_id').in('user_id', studentIds),
  ]);

  const countMap = (data: { user_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const d of data ?? []) {
      m.set(d.user_id, (m.get(d.user_id) ?? 0) + 1);
    }
    return m;
  };

  const badgeMap = countMap(badgesRes.data as { user_id: string }[] | null);
  const projectMap = countMap(projectsRes.data as { user_id: string }[] | null);
  const skillMap = countMap(skillsRes.data as { user_id: string }[] | null);
  const assessmentMap = countMap(assessmentsRes.data as { user_id: string }[] | null);
  const appMap = countMap(appsRes.data as { user_id: string }[] | null);

  return students.map((s: typeof students[number]) => {
    const badges = badgeMap.get(s.id) ?? 0;
    const projects = projectMap.get(s.id) ?? 0;
    const skills = skillMap.get(s.id) ?? 0;
    const assessments = assessmentMap.get(s.id) ?? 0;
    const applications = appMap.get(s.id) ?? 0;

    const readinessScore = Math.min(100, Math.round(
      (s.level / 10) * 25 +
      Math.min(s.xp / 5000, 1) * 25 +
      Math.min(badges / 10, 1) * 15 +
      Math.min(projects / 5, 1) * 15 +
      Math.min(skills / 10, 1) * 10 +
      Math.min(assessments / 5, 1) * 10
    ));

    return {
      user_id: s.id,
      full_name: s.full_name,
      email: s.email,
      college: s.college,
      branch: s.branch,
      year: s.year,
      level: s.level,
      xp: s.xp,
      streak: s.streak,
      badges_count: badges,
      projects_count: projects,
      skills_count: skills,
      assessments_count: assessments,
      applications_count: applications,
      readiness_score: readinessScore,
    } as StudentReadiness;
  });
}

export async function fetchAllApplicationsAdmin(): Promise<{ id: string; job_id: string; user_id: string; status: string; applied_at: string; job_company: string; job_title: string; student_name: string; student_email: string }[]> {
  const { data: apps, error } = await supabase
    .from('job_applications')
    .select('*')
    .order('applied_at', { ascending: false })
    .limit(100);

  if (error || !apps || apps.length === 0) return [];

  const jobIds = apps.map((a: { job_id: string }) => a.job_id);
  const userIds = apps.map((a: { user_id: string }) => a.user_id);

  const [jobsRes, studentsRes] = await Promise.all([
    supabase.from('jobs').select('id, company, title').in('id', jobIds),
    supabase.from('profiles').select('id, full_name, email').in('id', userIds),
  ]);

  const jobMap = new Map((jobsRes.data ?? []).map((j: { id: string; company: string; title: string }) => [j.id, j]));
  const studentMap = new Map((studentsRes.data ?? []).map((s: { id: string; full_name: string; email: string }) => [s.id, s]));

  return apps.map((a: typeof apps[number]) => {
    const job = jobMap.get(a.job_id);
    const student = studentMap.get(a.user_id);
    return {
      ...a,
      job_company: job?.company ?? '',
      job_title: job?.title ?? '',
      student_name: student?.full_name ?? 'Unknown',
      student_email: student?.email ?? '',
    } as { id: string; job_id: string; user_id: string; status: string; applied_at: string; job_company: string; job_title: string; student_name: string; student_email: string };
  });
}

export async function updateApplicationStatusAdmin(applicationId: string, status: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('job_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId);
  return { error: error?.message ?? null };
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function daysUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return 'Closed';
  if (days === 0) return 'Last day!';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
