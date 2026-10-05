'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, Building2, Bell, ClipboardList, Users,
  BarChart3, TrendingUp, CheckCircle2, XCircle, ArrowLeft,
  Zap, Flame, Award, Target, Briefcase, AlertTriangle, Star, FileText,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchAdminAnalytics, fetchStudentReadiness, fetchAllJobsAdmin,
  createJob, toggleJobActive, deleteJob, fetchAnnouncements,
  createAnnouncement, deleteAnnouncement, fetchPlacementAssessments,
  createPlacementAssessment, deletePlacementAssessment,
  fetchAllApplicationsAdmin, updateApplicationStatusAdmin,
  timeAgo, daysUntil,
  type AdminAnalytics, type StudentReadiness,
} from '@/lib/placements/placements-data';
import { cn } from '@/lib/utils';

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const appStatusOptions = ['applied', 'shortlisted', 'interviewed', 'offered', 'rejected'];

export default function AdminPlacementsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [students, setStudents] = useState<StudentReadiness[]>([]);
  const [jobs, setJobs] = useState<{ id: string; company: string; title: string; is_active: boolean; application_count: number; deadline: string; package_lpa: number }[]>([]);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; type: string; priority: string; is_pinned: boolean; created_at: string }[]>([]);
  const [assessments, setAssessments] = useState<{ id: string; title: string; test_type: string; duration_minutes: number; deadline: string; is_active: boolean }[]>([]);
  const [allApps, setAllApps] = useState<{ id: string; job_id: string; user_id: string; status: string; applied_at: string; job_company: string; job_title: string; student_name: string; student_email: string }[]>([]);

  // new job form
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    company: '', title: '', description: '', location: '', jobType: 'full-time',
    role: '', requiredSkills: '', preferredSkills: '', minCgpa: '6.0',
    eligibleYears: '', eligibleBranches: '', packageLpa: '0', deadline: '',
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // new announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', content: '', type: 'info', priority: 'normal' });
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // new assessment form
  const [showAssessForm, setShowAssessForm] = useState(false);
  const [assessForm, setAssessForm] = useState({ title: '', description: '', testType: 'aptitude', durationMinutes: '60', deadline: '' });
  const [submittingAssess, setSubmittingAssess] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, s, j, ann, asss, apps] = await Promise.all([
        fetchAdminAnalytics(),
        fetchStudentReadiness(),
        fetchAllJobsAdmin(),
        fetchAnnouncements(),
        fetchPlacementAssessments(),
        fetchAllApplicationsAdmin(),
      ]);
      setAnalytics(a);
      setStudents(s);
      setJobs(j as typeof jobs);
      setAnnouncements(ann);
      setAssessments(asss);
      setAllApps(apps);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreateJob = async () => {
    if (!user) return;
    if (!jobForm.company.trim() || !jobForm.title.trim()) {
      toast({ title: 'Company and title are required', variant: 'destructive' });
      return;
    }
    setSubmittingJob(true);
    try {
      const { error } = await createJob(user.id, {
        company: jobForm.company,
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        jobType: jobForm.jobType,
        role: jobForm.role,
        requiredSkills: jobForm.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferredSkills: jobForm.preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        minCgpa: parseFloat(jobForm.minCgpa) || 0,
        eligibleYears: jobForm.eligibleYears.split(',').map((s) => s.trim()).filter(Boolean),
        eligibleBranches: jobForm.eligibleBranches.split(',').map((s) => s.trim()).filter(Boolean),
        packageLpa: parseFloat(jobForm.packageLpa) || 0,
        deadline: jobForm.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
      });
      if (error) { toast({ title: 'Failed to create job', description: error, variant: 'destructive' }); return; }
      toast({ title: 'Job posted!' });
      setJobForm({ company: '', title: '', description: '', location: '', jobType: 'full-time', role: '', requiredSkills: '', preferredSkills: '', minCgpa: '6.0', eligibleYears: '', eligibleBranches: '', packageLpa: '0', deadline: '' });
      setShowJobForm(false);
      loadAll();
    } catch {
      toast({ title: 'Failed to create job', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleToggleJob = async (jobId: string, isActive: boolean) => {
    const { error } = await toggleJobActive(jobId, isActive);
    if (error) { toast({ title: 'Failed to update', description: error, variant: 'destructive' }); return; }
    loadAll();
  };

  const handleDeleteJob = async (jobId: string) => {
    const { error } = await deleteJob(jobId);
    if (error) { toast({ title: 'Failed to delete', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Job deleted' });
    loadAll();
  };

  const handleCreateAnn = async () => {
    if (!user) return;
    if (!annForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSubmittingAnn(true);
    try {
      const { error } = await createAnnouncement(user.id, annForm.title, annForm.content, annForm.type, annForm.priority);
      if (error) { toast({ title: 'Failed to create', description: error, variant: 'destructive' }); return; }
      toast({ title: 'Announcement posted!' });
      setAnnForm({ title: '', content: '', type: 'info', priority: 'normal' });
      setShowAnnForm(false);
      loadAll();
    } catch {
      toast({ title: 'Failed to create', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleDeleteAnn = async (id: string) => {
    const { error } = await deleteAnnouncement(id);
    if (error) { toast({ title: 'Failed to delete', variant: 'destructive' }); return; }
    toast({ title: 'Announcement deleted' });
    loadAll();
  };

  const handleCreateAssess = async () => {
    if (!user) return;
    if (!assessForm.title.trim()) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    setSubmittingAssess(true);
    try {
      const { error } = await createPlacementAssessment(user.id, {
        title: assessForm.title,
        description: assessForm.description,
        testType: assessForm.testType,
        durationMinutes: parseInt(assessForm.durationMinutes) || 60,
        deadline: assessForm.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      if (error) { toast({ title: 'Failed to create', description: error, variant: 'destructive' }); return; }
      toast({ title: 'Assessment created!' });
      setAssessForm({ title: '', description: '', testType: 'aptitude', durationMinutes: '60', deadline: '' });
      setShowAssessForm(false);
      loadAll();
    } catch {
      toast({ title: 'Failed to create', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingAssess(false);
    }
  };

  const handleDeleteAssess = async (id: string) => {
    const { error } = await deletePlacementAssessment(id);
    if (error) { toast({ title: 'Failed to delete', variant: 'destructive' }); return; }
    toast({ title: 'Assessment deleted' });
    loadAll();
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    const { error } = await updateApplicationStatusAdmin(appId, status);
    if (error) { toast({ title: 'Failed to update', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Application status updated' });
    loadAll();
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Access Denied</h1>
          <p className="mt-1 text-sm text-muted-foreground">Only admins can access this page.</p>
        </div>
        <Button asChild variant="outline"><Link href="/dashboard/placements">Back to Placements</Link></Button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Failed to load data</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => loadAll()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/placements"><ArrowLeft className="mr-2 h-4 w-4" />Back to Placements</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Placement Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">Manage jobs, announcements, assessments, and track student readiness.</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-xl font-bold">{analytics?.total_students ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Briefcase className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Jobs</p>
              <p className="text-xl font-bold">{analytics?.total_jobs ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <FileText className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Applications</p>
              <p className="text-xl font-bold">{analytics?.total_applications ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Readiness</p>
              <p className="text-xl font-bold">
                {analytics ? Math.round((analytics.readiness_distribution.ready / Math.max(1, analytics.total_students)) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" />Placement Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <p className="text-2xl font-bold text-success">{analytics.readiness_distribution.ready}</p>
                <p className="text-xs text-muted-foreground">Ready (Lvl 5+, 3k+ XP)</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                <TrendingUp className="h-6 w-6 text-warning" />
                <p className="text-2xl font-bold text-warning">{analytics.readiness_distribution.developing}</p>
                <p className="text-xs text-muted-foreground">Developing (Lvl 3+)</p>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="text-2xl font-bold text-destructive">{analytics.readiness_distribution.not_ready}</p>
                <p className="text-xs text-muted-foreground">Not Ready (below Lvl 3)</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Avg XP:</span>
                <span className="font-medium">{(analytics.avg_xp ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-muted-foreground">Avg Level:</span>
                <span className="font-medium">{analytics.avg_level ?? 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-muted-foreground">Avg Streak:</span>
                <span className="font-medium">{analytics.avg_streak ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
        </TabsList>

        {/* Manage Jobs */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Job Postings ({jobs.length})</h3>
            <Button size="sm" onClick={() => setShowJobForm(!showJobForm)}>
              <Plus className="mr-1 h-4 w-4" />Post Job
            </Button>
          </div>

          {showJobForm && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Company *" value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} />
                  <Input placeholder="Job Title *" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} />
                </div>
                <Textarea placeholder="Job description..." value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
                  <Input placeholder="Role" value={jobForm.role} onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })} />
                  <Select value={jobForm.jobType} onValueChange={(v) => setJobForm({ ...jobForm, jobType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Required skills (comma-separated)" value={jobForm.requiredSkills} onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })} />
                  <Input placeholder="Preferred skills (comma-separated)" value={jobForm.preferredSkills} onChange={(e) => setJobForm({ ...jobForm, preferredSkills: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Input placeholder="Min CGPA" type="number" value={jobForm.minCgpa} onChange={(e) => setJobForm({ ...jobForm, minCgpa: e.target.value })} />
                  <Input placeholder="Package (LPA)" type="number" value={jobForm.packageLpa} onChange={(e) => setJobForm({ ...jobForm, packageLpa: e.target.value })} />
                  <Input placeholder="Years (e.g. 2026,2027)" value={jobForm.eligibleYears} onChange={(e) => setJobForm({ ...jobForm, eligibleYears: e.target.value })} />
                  <Input placeholder="Branches (e.g. CSE,IT)" value={jobForm.eligibleBranches} onChange={(e) => setJobForm({ ...jobForm, eligibleBranches: e.target.value })} />
                </div>
                <Input type="datetime-local" value={jobForm.deadline ? jobForm.deadline.slice(0, 16) : ''} onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowJobForm(false)}>Cancel</Button>
                  <Button onClick={handleCreateJob} disabled={submittingJob}>
                    {submittingJob && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{job.title}</h4>
                    <p className="text-xs text-muted-foreground">{job.company} · {job.application_count} applications</p>
                    <p className="text-xs text-muted-foreground">{daysUntil(job.deadline)} · {job.package_lpa} LPA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={job.is_active ? 'secondary' : 'outline'} className="text-xs">
                    {job.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleJob(job.id, !job.is_active)}>
                    {job.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications" className="space-y-4">
          <h3 className="text-lg font-semibold">All Applications ({allApps.length})</h3>
          {allApps.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No applications yet.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {allApps.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{initials(app.student_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{app.student_name}</p>
                          <p className="text-xs text-muted-foreground">{app.job_title} at {app.job_company}</p>
                          <p className="text-[10px] text-muted-foreground">{timeAgo(app.applied_at)}</p>
                        </div>
                      </div>
                      <Select value={app.status} onValueChange={(v) => handleUpdateAppStatus(app.id, v)}>
                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {appStatusOptions.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Announcements ({announcements.length})</h3>
            <Button size="sm" onClick={() => setShowAnnForm(!showAnnForm)}>
              <Plus className="mr-1 h-4 w-4" />New Announcement
            </Button>
          </div>

          {showAnnForm && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <Input placeholder="Title *" value={annForm.title} onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })} />
                <Textarea placeholder="Content..." value={annForm.content} onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={annForm.type} onValueChange={(v) => setAnnForm({ ...annForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="drive">Drive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={annForm.priority} onValueChange={(v) => setAnnForm({ ...annForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAnnForm(false)}>Cancel</Button>
                  <Button onClick={handleCreateAnn} disabled={submittingAnn}>
                    {submittingAnn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {announcements.map((ann) => (
            <Card key={ann.id} className={cn(ann.is_pinned && 'border-primary/30 bg-primary/5')}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', ann.priority === 'high' ? 'bg-warning/10' : 'bg-primary/10')}>
                    <Bell className={cn('h-4 w-4', ann.priority === 'high' ? 'text-warning' : 'text-primary')} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ann.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{ann.content}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(ann.created_at)} · {ann.type}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAnn(ann.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Assessments */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">Placement Assessments ({assessments.length})</h3>
            <Button size="sm" onClick={() => setShowAssessForm(!showAssessForm)}>
              <Plus className="mr-1 h-4 w-4" />Create Assessment
            </Button>
          </div>

          {showAssessForm && (
            <Card>
              <CardContent className="space-y-3 p-5">
                <Input placeholder="Title *" value={assessForm.title} onChange={(e) => setAssessForm({ ...assessForm, title: e.target.value })} />
                <Textarea placeholder="Description..." value={assessForm.description} onChange={(e) => setAssessForm({ ...assessForm, description: e.target.value })} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Select value={assessForm.testType} onValueChange={(v) => setAssessForm({ ...assessForm, testType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aptitude">Aptitude</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Duration (min)" type="number" value={assessForm.durationMinutes} onChange={(e) => setAssessForm({ ...assessForm, durationMinutes: e.target.value })} />
                  <Input type="datetime-local" value={assessForm.deadline} onChange={(e) => setAssessForm({ ...assessForm, deadline: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAssessForm(false)}>Cancel</Button>
                  <Button onClick={handleCreateAssess} disabled={submittingAssess}>
                    {submittingAssess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {assessments.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                    <ClipboardList className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.test_type} · {a.duration_minutes} min · {daysUntil(a.deadline)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAssess(a.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Student Analytics */}
        <TabsContent value="students" className="space-y-4">
          <h3 className="text-lg font-semibold">Student Placement Readiness ({students.length})</h3>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {students.map((s) => (
                  <div key={s.user_id} className="flex items-center gap-3 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">{initials(s.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.branch} · {s.year}</p>
                    </div>
                    <div className="hidden gap-4 text-xs text-muted-foreground sm:flex">
                      <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" />{s.xp}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-accent" />Lvl {s.level}</span>
                      <span className="flex items-center gap-1"><Award className="h-3 w-3 text-warning" />{s.badges_count}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{s.projects_count}</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{s.applications_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Ready</span>
                          <span className={cn(
                            'font-bold',
                            s.readiness_score >= 70 ? 'text-success' :
                            s.readiness_score >= 40 ? 'text-warning' : 'text-destructive'
                          )}>{s.readiness_score}%</span>
                        </div>
                        <Progress value={s.readiness_score} className="mt-0.5 h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
