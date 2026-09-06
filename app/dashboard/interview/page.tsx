'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Mic, Clock, Star, TrendingUp, Loader2, Code, MessageSquare,
  Brain, Database as DatabaseIcon, Server, Network, Cpu,
  FileText, User, Send, ArrowRight, ArrowLeft, Trophy,
  CheckCircle2, AlertCircle, Zap, RotateCcw, Target,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import {
  fetchInterviewHistory,
  startInterview,
  submitInterview,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
  type InterviewQuestionDTO,
  type InterviewHistoryRow,
  type InterviewSessionResult,
} from '@/lib/interview/interview-data';
import { analyzeSkillGap } from '@/lib/skills/gap-analysis';
import type { InterviewEvaluation } from '@/lib/database.types';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  difficulty: string;
  duration: string;
}

const categories: Category[] = [
  { id: 'DSA', label: 'DSA', desc: 'Data structures, algorithms, complexity analysis', icon: Code, difficulty: 'Hard', duration: '45-60 min' },
  { id: 'OOP', label: 'OOP', desc: 'Object-oriented principles, design patterns, SOLID', icon: Cpu, difficulty: 'Medium', duration: '30 min' },
  { id: 'DBMS', label: 'DBMS', desc: 'Normalization, SQL, transactions, indexing', icon: DatabaseIcon, difficulty: 'Medium', duration: '30 min' },
  { id: 'OS', label: 'OS', desc: 'Processes, threads, scheduling, memory management', icon: Server, difficulty: 'Hard', duration: '30 min' },
  { id: 'CN', label: 'CN', desc: 'OSI model, TCP/UDP, DNS, HTTP/HTTPS', icon: Network, difficulty: 'Medium', duration: '30 min' },
  { id: 'Development', label: 'Development', desc: 'REST APIs, Docker, auth, microservices', icon: Code, difficulty: 'Medium', duration: '30 min' },
  { id: 'System Design', label: 'System Design', desc: 'Scalability, caching, load balancing, architecture', icon: Brain, difficulty: 'Hard', duration: '60 min' },
  { id: 'HR', label: 'HR', desc: 'Behavioral questions, strengths, culture fit', icon: MessageSquare, difficulty: 'Medium', duration: '30 min' },
  { id: 'Resume/Project', label: 'Resume/Project', desc: 'Project walkthrough, debugging, code quality', icon: FileText, difficulty: 'Medium', duration: '30 min' },
];

const dimensionConfig = [
  { key: 'technical_depth', label: 'Technical Depth', icon: Code },
  { key: 'relevance', label: 'Relevance', icon: Target },
  { key: 'clarity', label: 'Clarity', icon: CheckCircle2 },
  { key: 'communication', label: 'Communication', icon: MessageSquare },
] as const;

type ChatMessage = {
  role: 'interviewer' | 'candidate';
  content: string;
  questionIndex?: number;
};

type Phase = 'select' | 'chat' | 'results';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function InterviewPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState('practice');
  const [history, setHistory] = useState<InterviewHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionDTO[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [answer, setAnswer] = useState('');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<InterviewSessionResult | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const data = await fetchInterviewHistory(user.id);
    setHistory(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleStartInterview = async (category: Category) => {
    if (!user) return;
    setStarting(true);
    setSelectedCategory(category);

    let skillGaps: string[] = [];
    if (profile?.target_role) {
      const gapResult = await analyzeSkillGap(user.id, profile.target_role);
      skillGaps = gapResult.missingSkills;
    }

    const { questions: qs, error } = await startInterview(
      category.id,
      profile?.target_role ?? '',
      skillGaps,
      user.id
    );

    if (error || !qs || qs.length === 0) {
      toast({
        title: 'Could not start interview',
        description: error ?? 'No questions available for this category.',
        variant: 'destructive',
      });
      setStarting(false);
      return;
    }

    setQuestions(qs);
    setCurrentQ(0);
    setChat([{ role: 'interviewer', content: qs[0].question, questionIndex: 0 }]);
    setAnswer('');
    setPhase('chat');
    setStartTime(Date.now());
    setStarting(false);
  };

  const handleNextQuestion = () => {
    if (!answer.trim()) {
      toast({
        title: 'Please write an answer',
        description: 'Type your answer before moving to the next question.',
        variant: 'destructive',
      });
      return;
    }

    const newChat: ChatMessage[] = [...chat, { role: 'candidate' as const, content: answer, questionIndex: currentQ }];

    if (currentQ + 1 < questions.length) {
      const nextIdx = currentQ + 1;
      newChat.push({ role: 'interviewer' as const, content: questions[nextIdx].question, questionIndex: nextIdx });
      setChat(newChat);
      setCurrentQ(nextIdx);
      setAnswer('');
    } else {
      setChat(newChat);
      handleSubmit(newChat);
    }
  };

  const handleSubmit = async (finalChat: ChatMessage[]) => {
    if (!user || !selectedCategory) return;
    setSubmitting(true);

    const answers = finalChat
      .filter((m) => m.role === 'candidate')
      .map((m) => ({
        question_id: questions[m.questionIndex ?? 0].id,
        answer: m.content,
      }));

    const durationMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    const { result: res, error } = await submitInterview(
      user.id,
      selectedCategory.id,
      profile?.target_role ?? '',
      questions,
      answers,
      durationMin
    );

    if (error || !res) {
      toast({
        title: 'Evaluation failed',
        description: error ?? 'Could not evaluate your answers.',
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    setResult(res);
    setPhase('results');
    setSubmitting(false);
    loadHistory();

    toast({
      title: 'Interview complete!',
      description: `You scored ${res.evaluation.overall}/100 and earned ${res.xpEarned} XP.`,
    });
  };

  const handleReset = () => {
    setPhase('select');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentQ(0);
    setChat([]);
    setAnswer('');
    setResult(null);
  };

  const avgScore = history.length > 0
    ? Math.round(history.reduce((acc, s) => acc + s.score, 0) / history.length)
    : 0;
  const totalMinutes = history.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalXp = history.reduce((acc, s) => acc + s.xp_earned, 0);

  // ===== Chat Phase =====
  if (phase === 'chat' && selectedCategory) {
    const progress = ((currentQ + 1) / questions.length) * 100;
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <selectedCategory.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{selectedCategory.label} Mock Interview</h1>
              <p className="text-xs text-muted-foreground">
                Question {currentQ + 1} of {questions.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Exit
          </Button>
        </div>

        <Progress value={progress} className="h-1.5" />

        <Card className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col">
          <CardHeader className="border-b py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                AI
              </div>
              <div>
                <p className="text-sm font-medium">AI Interviewer</p>
                <p className="text-xs text-muted-foreground">{selectedCategory.label} · {selectedCategory.difficulty}</p>
              </div>
            </div>
          </CardHeader>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-3',
                  msg.role === 'candidate' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    msg.role === 'interviewer'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-foreground'
                  )}
                >
                  {msg.role === 'interviewer' ? 'AI' : <User className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg p-3 text-sm',
                    msg.role === 'interviewer'
                      ? 'bg-secondary text-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {submitting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Evaluating your answers...
              </div>
            )}
          </div>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="min-h-[80px] resize-none"
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleNextQuestion();
                  }
                }}
              />
              <Button
                onClick={handleNextQuestion}
                disabled={submitting || !answer.trim()}
                className="shrink-0"
                size="lg"
              >
                {currentQ + 1 < questions.length ? (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4" />
                    Finish
                  </>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {currentQ + 1 < questions.length
                ? 'Press Ctrl+Enter to submit and move to the next question.'
                : 'Press Ctrl+Enter to submit and see your results.'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ===== Results Phase =====
  if (phase === 'results' && result && selectedCategory) {
    const ev = result.evaluation;
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Interview Results</h1>
            <p className="mt-1 text-muted-foreground">{selectedCategory.label} Mock Interview</p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>

        {/* Overall Score */}
        <Card className={cn('border', getScoreBg(ev.overall))}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background/80">
                <span className={cn('text-3xl font-bold', getScoreColor(ev.overall))}>
                  {ev.overall}
                </span>
              </div>
              <div className="flex-1">
                <h2 className={cn('text-xl font-bold', getScoreColor(ev.overall))}>
                  {getScoreLabel(ev.overall)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Overall score across {ev.answers.length} questions
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <Zap className="h-3 w-3" />
                    +{result.xpEarned} XP
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dimensionConfig.map(({ key, label, icon: Icon }) => {
            const score = ev[key] as number;
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', getScoreColor(score))} />
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <Progress value={score} className="mt-2 h-1.5" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Per-Question Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Question-by-Question Feedback</CardTitle>
            <CardDescription>Detailed evaluation for each answer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ev.answers.map((a, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className={cn('text-sm font-bold', getScoreColor(a.score))}>
                      {a.score}/100
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium">{a.question}</p>
                <div className="mt-2 rounded-md bg-muted/30 p-2">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Your answer:</span> {a.answer || '(no answer provided)'}
                  </p>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs text-muted-foreground">{a.feedback}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Practice Again
          </Button>
          <Button asChild>
            <Link href="/dashboard/skills/gap">
              View Skill Gaps
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ===== Selection Phase (default) =====
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mock Interviews</h1>
        <p className="mt-1 text-muted-foreground">
          Practice with AI-powered mock interviews across 9 categories. Get instant feedback on technical depth, relevance, clarity, and communication.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
                <p className="mt-1 text-2xl font-bold">{loading ? '—' : history.length}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Mic className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="mt-1 text-2xl font-bold">{loading ? '—' : avgScore || '—'}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success/10">
                <Star className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="mt-1 text-2xl font-bold">{loading ? '—' : `${Math.round(totalMinutes / 60)}h`}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">XP Earned</p>
                <p className="mt-1 text-2xl font-bold text-primary">{loading ? '—' : totalXp}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <Card key={cat.id} className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <cat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{cat.difficulty}</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold">{cat.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{cat.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {cat.duration}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleStartInterview(cat)}
                      disabled={starting}
                    >
                      {starting && selectedCategory?.id === cat.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Mic className="mr-1 h-3 w-3" />
                      )}
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {profile?.target_role && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Smart Question Selection</h3>
                  <p className="text-xs text-muted-foreground">
                    Questions are tailored to your target role ({profile.target_role}) and prioritize your skill gaps.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mic className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">No mock interviews yet</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Start a practice session from the Practice tab and your results will appear here.
                  </p>
                </div>
                <Button size="sm" onClick={() => setActiveTab('practice')}>Go to Practice</Button>
              </CardContent>
            </Card>
          ) : (
            history.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg',
                        getScoreBg(session.score)
                      )}>
                        <span className={cn('text-lg font-bold', getScoreColor(session.score))}>
                          {session.score}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{session.category || session.type}</h4>
                          {session.topic && session.topic !== session.category && (
                            <Badge variant="secondary" className="text-xs">{session.topic}</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {session.duration_minutes} min</span>
                          <span>{formatDate(session.conducted_at)}</span>
                          <span className="flex items-center gap-0.5 text-primary font-medium">
                            <Zap className="h-3 w-3" /> +{session.xp_earned} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {session.evaluation && session.evaluation.answers && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {dimensionConfig.map(({ key, label }) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className={cn('text-sm font-bold', getScoreColor(session.evaluation[key] as number))}>
                            {session.evaluation[key] as number}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
