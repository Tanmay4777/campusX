'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Star, Building2, Briefcase, Clock, Check, X,
  Loader2, Users, GraduationCap, MessageSquare, Target,
  Award, ArrowLeft, Send, Sparkles, type LucideIcon,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchMentors, createMentorshipRequest, fetchMyMentorshipRequests,
  fetchReceivedMentorshipRequests, updateMentorshipRequestStatus,
  cancelMentorshipRequest, checkIsMentor, createMentorProfile,
  MENTOR_SKILLS,
  type MentorWithStats, type MentorshipRequestWithDetails,
} from '@/lib/mentorship/mentorship-data';
import { cn } from '@/lib/utils';

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: 'Pending', color: 'text-warning border-warning/30', icon: Clock },
  accepted: { label: 'Accepted', color: 'text-success border-success/30', icon: Check },
  rejected: { label: 'Rejected', color: 'text-destructive border-destructive/30', icon: X },
  completed: { label: 'Completed', color: 'text-primary border-primary/30', icon: Award },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground border-border', icon: X },
};

export default function MentorshipPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('browse');

  // browse state
  const [mentors, setMentors] = useState<MentorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');

  // request modal
  const [selectedMentor, setSelectedMentor] = useState<MentorWithStats | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestGoals, setRequestGoals] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // my requests
  const [myRequests, setMyRequests] = useState<MentorshipRequestWithDetails[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequestWithDetails[]>([]);
  const [isMentor, setIsMentor] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // become mentor form
  const [showMentorForm, setShowMentorForm] = useState(false);
  const [mentorForm, setMentorForm] = useState({
    bio: '', company: '', role: '', skills: [] as string[],
    specializations: [] as string[], experienceYears: 0, linkedinUrl: '',
  });
  const [creatingMentor, setCreatingMentor] = useState(false);

  const loadMentors = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const data = await fetchMentors(searchQuery, skillFilter, user.id);
      setMentors(data);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery, skillFilter]);

  useEffect(() => {
    const debounce = setTimeout(loadMentors, 300);
    return () => clearTimeout(debounce);
  }, [loadMentors]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoadingRequests(true);
    try {
      const [sent, received, mentorStatus] = await Promise.all([
        fetchMyMentorshipRequests(user.id),
        fetchReceivedMentorshipRequests(user.id),
        checkIsMentor(user.id),
      ]);
      setMyRequests(sent);
      setReceivedRequests(received);
      setIsMentor(mentorStatus);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoadingRequests(false);
    }
  }, [user]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSendRequest = async () => {
    if (!user || !selectedMentor) return;
    if (!requestMessage.trim()) {
      toast({ title: 'Please write a message', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await createMentorshipRequest(
        selectedMentor.id, user.id, requestMessage, requestGoals
      );
      if (error) {
        toast({ title: 'Failed to send request', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Mentorship request sent!' });
      setSelectedMentor(null);
      setRequestMessage(''); setRequestGoals('');
      loadMentors(); loadRequests();
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!user) return;
    const { error } = await updateMentorshipRequestStatus(requestId, user.id, status);
    if (error) {
      toast({ title: 'Failed to update request', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: `Request ${status}` });
    loadRequests();
  };

  const handleCancel = async (requestId: string) => {
    if (!user) return;
    const { error } = await cancelMentorshipRequest(requestId, user.id);
    if (error) {
      toast({ title: 'Failed to cancel', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Request cancelled' });
    loadRequests(); loadMentors();
  };

  const handleBecomeMentor = async () => {
    if (!user || !profile) return;
    if (!mentorForm.bio.trim() || !mentorForm.company.trim() || !mentorForm.role.trim()) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setCreatingMentor(true);
    try {
      const { error } = await createMentorProfile(
        user.id,
        profile.full_name,
        mentorForm.bio,
        mentorForm.company,
        mentorForm.role,
        mentorForm.skills,
        mentorForm.specializations,
        mentorForm.experienceYears,
        mentorForm.linkedinUrl,
      );
      if (error) {
        toast({ title: 'Failed to create mentor profile', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: 'You are now a mentor!' });
      setShowMentorForm(false);
      loadRequests();
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setCreatingMentor(false);
    }
  };

  const toggleSkill = (skill: string, field: 'skills' | 'specializations') => {
    setMentorForm((prev) => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(skill)
          ? current.filter((s) => s !== skill)
          : [...current, skill],
      };
    });
  };

  // ===== Request Modal =====
  if (selectedMentor) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => setSelectedMentor(null)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to mentors
        </Button>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{initials(selectedMentor.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedMentor.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMentor.role} at {selectedMentor.company}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {Number(selectedMentor.rating).toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedMentor.total_reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/90">{selectedMentor.bio}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {selectedMentor.skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Send Mentorship Request</CardTitle>
            <CardDescription>Tell the mentor why you want to work with them.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Message *</label>
              <Textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hi, I'm a final year student looking for guidance on..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Your Goals</label>
              <Textarea
                value={requestGoals}
                onChange={(e) => setRequestGoals(e.target.value)}
                placeholder="What do you want to achieve through this mentorship?"
                className="min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
              <Button onClick={handleSendRequest} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== Main Page =====
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mentorship</h1>
        <p className="mt-1 text-muted-foreground">
          Learn from experienced professionals and accelerate your career.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Find Mentors</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          {isMentor && <TabsTrigger value="received">Received</TabsTrigger>}
          <TabsTrigger value="become-mentor">Become a Mentor</TabsTrigger>
        </TabsList>

        {/* Browse Mentors */}
        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, or skill..."
                className="pl-9"
              />
            </div>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {MENTOR_SKILLS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : mentors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No mentors found</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className="flex flex-col transition-all hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{initials(mentor.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold">{mentor.full_name}</h3>
                        <p className="truncate text-xs text-muted-foreground">{mentor.role}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          <Building2 className="mr-1 inline h-3 w-3" />
                          {mentor.company}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{mentor.bio}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {mentor.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                      ))}
                      {mentor.skills.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{mentor.skills.length - 4}</Badge>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        {Number(mentor.rating).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {mentor.experience_years}y exp
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {mentor.current_mentees}/{mentor.max_mentees}
                      </span>
                    </div>

                    <div className="mt-4 border-t pt-3">
                      {mentor.my_request_status ? (
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={cn('text-xs', statusConfig[mentor.my_request_status]?.color)}>
                            {statusConfig[mentor.my_request_status]?.label}
                          </Badge>
                          {mentor.my_request_status === 'pending' && (
                            <span className="text-xs text-muted-foreground">Awaiting response</span>
                          )}
                        </div>
                      ) : mentor.current_mentees >= mentor.max_mentees ? (
                        <Button disabled size="sm" className="w-full" variant="outline">
                          Mentee Slots Full
                        </Button>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => setSelectedMentor(mentor)}>
                          <Send className="mr-1 h-3 w-3" />
                          Request Mentorship
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Requests */}
        <TabsContent value="my-requests" className="space-y-4">
          {loadingRequests ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : myRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No mentorship requests yet</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Browse mentors and send a request to get started.
                  </p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('browse')}>Find Mentors</Button>
              </CardContent>
            </Card>
          ) : (
            myRequests.map((req) => {
              const StatusIcon = statusConfig[req.status]?.icon ?? Clock;
              return (
                <Card key={req.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials(req.mentor_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{req.mentor_name}</h4>
                          <Badge variant="outline" className={cn('text-xs', statusConfig[req.status]?.color)}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[req.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {req.mentor_role} at {req.mentor_company} · {timeAgo(req.created_at)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">{req.message}</p>
                        {req.goals && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            <Target className="mr-1 inline h-3 w-3" />
                            {req.goals}
                          </p>
                        )}
                      </div>
                      {req.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(req.id)}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Received Requests (mentor view) */}
        {isMentor && (
          <TabsContent value="received" className="space-y-4">
            {loadingRequests ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <GraduationCap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold">No incoming requests</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      When students request mentorship, they will appear here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              receivedRequests.map((req) => {
                const StatusIcon = statusConfig[req.status]?.icon ?? Clock;
                return (
                  <Card key={req.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={req.student_avatar ?? undefined} />
                          <AvatarFallback>{initials(req.student_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{req.student_name}</h4>
                            <Badge variant="outline" className="text-[10px]">Lvl {req.student_level}</Badge>
                            <Badge variant="outline" className={cn('text-xs', statusConfig[req.status]?.color)}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusConfig[req.status]?.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {req.student_college} · {req.student_target_role} · {timeAgo(req.created_at)}
                          </p>
                          <p className="mt-2 text-sm text-foreground/90">{req.message}</p>
                          {req.goals && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              <Target className="mr-1 inline h-3 w-3" />
                              {req.goals}
                            </p>
                          )}
                        </div>
                      </div>
                      {req.status === 'pending' && (
                        <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                          <Button variant="outline" size="sm" onClick={() => handleRespond(req.id, 'rejected')}>
                            <X className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                          <Button size="sm" onClick={() => handleRespond(req.id, 'accepted')}>
                            <Check className="mr-1 h-3 w-3" />
                            Accept
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}

        {/* Become a Mentor */}
        <TabsContent value="become-mentor" className="space-y-4">
          {isMentor ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-7 w-7 text-success" />
                </div>
                <div>
                  <h2 className="font-semibold">You are already a mentor!</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Students can find you in the mentor directory and send you mentorship requests.
                  </p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('received')}>
                  View Requests ({receivedRequests.filter((r) => r.status === 'pending').length})
                </Button>
              </CardContent>
            </Card>
          ) : showMentorForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Your Mentor Profile</CardTitle>
                <CardDescription>Share your expertise and help students grow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Bio *</label>
                  <Textarea
                    value={mentorForm.bio}
                    onChange={(e) => setMentorForm({ ...mentorForm, bio: e.target.value })}
                    placeholder="Tell students about your experience, what you can help with, and your mentoring style..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Company *</label>
                    <Input
                      value={mentorForm.company}
                      onChange={(e) => setMentorForm({ ...mentorForm, company: e.target.value })}
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Role *</label>
                    <Input
                      value={mentorForm.role}
                      onChange={(e) => setMentorForm({ ...mentorForm, role: e.target.value })}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Experience (years)</label>
                    <Input
                      type="number"
                      value={mentorForm.experienceYears}
                      onChange={(e) => setMentorForm({ ...mentorForm, experienceYears: Number(e.target.value) })}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">LinkedIn URL</label>
                    <Input
                      value={mentorForm.linkedinUrl}
                      onChange={(e) => setMentorForm({ ...mentorForm, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Skills (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {MENTOR_SKILLS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSkill(s, 'skills')}
                        className={cn(
                          'rounded-full border px-3 py-1 text-xs transition-colors',
                          mentorForm.skills.includes(s)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowMentorForm(false)}>Cancel</Button>
                  <Button onClick={handleBecomeMentor} disabled={creatingMentor}>
                    {creatingMentor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Become a Mentor</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Share your knowledge and experience with students. Create a mentor profile to start receiving mentorship requests.
                  </p>
                </div>
                <Button onClick={() => setShowMentorForm(true)}>
                  Create Mentor Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
