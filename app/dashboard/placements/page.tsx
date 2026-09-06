'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Briefcase, MapPin, IndianRupee, Clock, Bookmark, BookmarkCheck,
  CheckCircle2, XCircle, Loader2, Building2, Star, Target, TrendingUp,
  FileText, Send, ArrowLeft, AlertTriangle, Users, BarChart3,
  Plus, Trash2, Bell, ClipboardList, Award, Zap, Flame,
} from 'lucide-react';

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
  fetchJobs, toggleSaveJob, applyToJob, fetchMyApplications, withdrawApplication,
  fetchAnnouncements, timeAgo, daysUntil,
  type JobWithMatch, type JobApplicationWithJob,
} from '@/lib/placements/placements-data';
import { createNotification } from '@/lib/notifications/notifications-service';
import { cn } from '@/lib/utils';

const appStatusConfig: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'text-primary border-primary/30' },
  shortlisted: { label: 'Shortlisted', color: 'text-warning border-warning/30' },
  interviewed: { label: 'Interviewed', color: 'text-accent border-accent/30' },
  offered: { label: 'Offered', color: 'text-success border-success/30' },
  rejected: { label: 'Rejected', color: 'text-destructive border-destructive/30' },
  withdrawn: { label: 'Withdrawn', color: 'text-muted-foreground border-border' },
};

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PlacementsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<JobWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobType, setJobType] = useState('all');
  const [sortBy, setSortBy] = useState('match');
  const [applications, setApplications] = useState<JobApplicationWithJob[]>([]);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; content: string; type: string; priority: string; is_pinned: boolean; created_at: string }[]>([]);

  // selected job detail
  const [selectedJob, setSelectedJob] = useState<JobWithMatch | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user || !profile) { setLoading(false); return; }
    setLoading(true);
    const [jobData, appData, annData] = await Promise.all([
      fetchJobs(user.id, { year: profile.year, branch: profile.branch }, searchQuery, jobType, sortBy),
      fetchMyApplications(user.id),
      fetchAnnouncements(),
    ]);
    setJobs(jobData);
    setApplications(appData);
    setAnnouncements(annData);
    setLoading(false);
  }, [user, profile, searchQuery, jobType, sortBy]);

  useEffect(() => {
    const debounce = setTimeout(loadAll, 300);
    return () => clearTimeout(debounce);
  }, [loadAll]);

  const handleSave = async (job: JobWithMatch) => {
    if (!user) return;
    const { error } = await toggleSaveJob(job.id, user.id, job.is_saved);
    if (error) { toast({ title: 'Failed to save job', description: error, variant: 'destructive' }); return; }
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, is_saved: !j.is_saved } : j));
    if (selectedJob?.id === job.id) setSelectedJob((prev) => prev ? { ...prev, is_saved: !prev.is_saved } : prev);
  };

  const handleApply = async () => {
    if (!user || !selectedJob) return;

    if (coverLetter.trim().length < 20) {
      toast({ title: 'Cover letter too short', description: 'Please write at least 20 characters to tell the company why you\'re a good fit.', variant: 'destructive' });
      return;
    }

    if (resumeUrl && !/^https?:\/\/.+/.test(resumeUrl.trim())) {
      toast({ title: 'Invalid resume URL', description: 'Please enter a valid URL starting with http:// or https://', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    const { error } = await applyToJob(selectedJob.id, user.id, coverLetter, resumeUrl);
    setSubmitting(false);
    if (error) { toast({ title: 'Failed to apply', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Application submitted!' });
    await createNotification(user.id, {
      type: 'job',
      title: `Applied to ${selectedJob.company}`,
      message: `Your application for ${selectedJob.title} has been submitted successfully.`,
      link: '/dashboard/placements',
    });
    setShowApplyForm(false);
    setCoverLetter(''); setResumeUrl('');
    loadAll();
    setSelectedJob((prev) => prev ? { ...prev, application_status: 'applied' } : prev);
  };

  const handleWithdraw = async (appId: string) => {
    if (!user) return;
    const { error } = await withdrawApplication(appId, user.id);
    if (error) { toast({ title: 'Failed to withdraw', description: error, variant: 'destructive' }); return; }
    toast({ title: 'Application withdrawn' });
    await createNotification(user.id, {
      type: 'info',
      title: 'Application withdrawn',
      message: 'Your job application has been withdrawn.',
      link: '/dashboard/placements',
    });
    loadAll();
  };

  // ===== Job Detail View =====
  if (selectedJob) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedJob(null); setShowApplyForm(false); }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to jobs
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{selectedJob.title}</h1>
                  <p className="text-sm text-muted-foreground">{selectedJob.company}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{selectedJob.job_type}</span>
                    {selectedJob.package_lpa > 0 && (
                      <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{selectedJob.package_lpa} LPA</span>
                    )}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{daysUntil(selectedJob.deadline)}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleSave(selectedJob)}>
                {selectedJob.is_saved ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
              </Button>
            </div>

            {selectedJob.description && (
              <p className="mt-4 text-sm text-foreground/90">{selectedJob.description}</p>
            )}

            {/* Match Score */}
            <div className="mt-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  Your Match Score
                </span>
                <span className={cn(
                  'text-2xl font-bold',
                  selectedJob.match_score >= 70 ? 'text-success' :
                  selectedJob.match_score >= 40 ? 'text-warning' : 'text-destructive'
                )}>
                  {selectedJob.match_score}%
                </span>
              </div>
              <Progress value={selectedJob.match_score} className="mt-2 h-2" />
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedJob.matched_skills.map((s) => (
                  <Badge key={s} className="text-xs bg-success/10 text-success border-success/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" />{s}
                  </Badge>
                ))}
                {selectedJob.missing_skills.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs text-destructive border-destructive/30">
                    <XCircle className="mr-1 h-3 w-3" />{s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Eligibility */}
            {!selectedJob.is_eligible && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-medium text-warning">Eligibility Issues</p>
                  {selectedJob.eligibility_issues.map((issue, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{issue}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-sm font-medium">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.required_skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Preferred Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.preferred_skills.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Min CGPA</p>
                <p className="font-medium">{Number(selectedJob.min_cgpa).toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Eligible Years</p>
                <p className="font-medium">{selectedJob.eligible_years.join(', ') || 'All'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Eligible Branches</p>
                <p className="font-medium">{selectedJob.eligible_branches.join(', ') || 'All'}</p>
              </div>
            </div>

            {/* Apply Section */}
            <div className="mt-4 border-t pt-4">
              {selectedJob.application_status ? (
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn('text-sm', appStatusConfig[selectedJob.application_status]?.color)}>
                    {appStatusConfig[selectedJob.application_status]?.label}
                  </Badge>
                  {selectedJob.application_status === 'applied' && (
                    <Button variant="outline" size="sm" onClick={() => handleWithdraw(applications.find((a) => a.job_id === selectedJob.id)?.id ?? '')}>
                      Withdraw
                    </Button>
                  )}
                </div>
              ) : showApplyForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Cover Letter</label>
                    <Textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell the company why you're a great fit..."
                      className="min-h-[100px]"
                    />
                    <p className={cn('mt-1 text-xs', coverLetter.trim().length > 0 && coverLetter.trim().length < 20 ? 'text-destructive' : 'text-muted-foreground')}>
                      {coverLetter.trim().length} / 20 characters minimum
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Resume URL (optional)</label>
                    <Input
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowApplyForm(false)}>Cancel</Button>
                    <Button onClick={handleApply} disabled={submitting || coverLetter.trim().length < 20}>
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Submit Application
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="w-full" onClick={() => setShowApplyForm(true)} disabled={!selectedJob.is_eligible}>
                  {!selectedJob.is_eligible ? 'Not Eligible' : 'Apply Now'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== Main List View =====
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Placement Drives</h1>
          <p className="mt-1 text-muted-foreground">
            Track company drives, check your match, and apply.
          </p>
        </div>
        {isAdmin && (
          <Button asChild>
            <a href="/dashboard/placements/admin">
              <BarChart3 className="mr-2 h-4 w-4" />
              Admin Panel
            </a>
          </Button>
        )}
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          {announcements.slice(0, 3).map((ann) => (
            <Card key={ann.id} className={cn(ann.is_pinned && 'border-primary/30 bg-primary/5')}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  ann.priority === 'high' ? 'bg-warning/10' : 'bg-primary/10'
                )}>
                  <Bell className={cn('h-4 w-4', ann.priority === 'high' ? 'text-warning' : 'text-primary')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{ann.title}</p>
                    {ann.is_pinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{ann.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(ann.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Browse Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        {/* Browse Jobs */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, role, or location..."
                className="pl-9"
              />
            </div>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Best Match</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Briefcase className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No jobs found</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold">{job.title}</h3>
                          <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSave(job); }}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {job.is_saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      {job.package_lpa > 0 && (
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{job.package_lpa} LPA</span>
                      )}
                      <span className={cn(
                        'flex items-center gap-1',
                        daysUntil(job.deadline) === 'Closed' && 'text-destructive'
                      )}>
                        <Clock className="h-3 w-3" />{daysUntil(job.deadline)}
                      </span>
                    </div>

                    {/* Match Score Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Match</span>
                        <span className={cn(
                          'font-bold',
                          job.match_score >= 70 ? 'text-success' :
                          job.match_score >= 40 ? 'text-warning' : 'text-destructive'
                        )}>{job.match_score}%</span>
                      </div>
                      <Progress value={job.match_score} className="mt-1 h-1.5" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.required_skills.slice(0, 3).map((s) => (
                        <Badge
                          key={s}
                          variant={job.matched_skills.includes(s) ? 'secondary' : 'outline'}
                          className={cn('text-[10px]', !job.matched_skills.includes(s) && 'text-destructive')}
                        >
                          {job.matched_skills.includes(s) ? <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> : <XCircle className="mr-1 h-2.5 w-2.5" />}
                          {s}
                        </Badge>
                      ))}
                      {job.required_skills.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{job.required_skills.length - 3}</Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      {job.application_status ? (
                        <Badge variant="outline" className={cn('text-xs', appStatusConfig[job.application_status]?.color)}>
                          {appStatusConfig[job.application_status]?.label}
                        </Badge>
                      ) : !job.is_eligible ? (
                        <Badge variant="outline" className="text-xs text-warning border-warning/30">
                          <AlertTriangle className="mr-1 h-3 w-3" />Not Eligible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          <Send className="mr-1 h-3 w-3" />Ready to Apply
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{job.application_count} applied</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Applications */}
        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No applications yet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Browse jobs and apply to get started.</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('jobs')}>Browse Jobs</Button>
              </CardContent>
            </Card>
          ) : (
            applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{app.job_title}</h3>
                        <p className="text-xs text-muted-foreground">{app.job_company} · {app.job_location}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {app.job_package_lpa > 0 && <span>{app.job_package_lpa} LPA</span>}
                          <span>Applied {timeAgo(app.applied_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={cn('text-xs', appStatusConfig[app.status]?.color)}>
                        {appStatusConfig[app.status]?.label}
                      </Badge>
                      {app.status === 'applied' && (
                        <Button variant="ghost" size="sm" onClick={() => handleWithdraw(app.id)}>
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Saved Jobs */}
        <TabsContent value="saved" className="space-y-4">
          {jobs.filter((j) => j.is_saved).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Bookmark className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No saved jobs</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Bookmark jobs to find them quickly later.</p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('jobs')}>Browse Jobs</Button>
              </CardContent>
            </Card>
          ) : (
            jobs.filter((j) => j.is_saved).map((job) => (
              <Card key={job.id} className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedJob(job)}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{job.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">{job.company} · {job.location}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className={cn(
                          'font-bold',
                          job.match_score >= 70 ? 'text-success' : job.match_score >= 40 ? 'text-warning' : 'text-destructive'
                        )}>{job.match_score}% match</span>
                        <span className={daysUntil(job.deadline) === 'Closed' ? 'text-destructive' : 'text-muted-foreground'}>
                          {daysUntil(job.deadline)}
                        </span>
                      </div>
                    </div>
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
