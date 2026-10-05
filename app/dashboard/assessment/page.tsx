'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code, Boxes, Database, Atom, Cloud, Network,
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, Target,
  Trophy, RotateCcw, AlertCircle, Zap, TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/auth-provider';
import { useGamification } from '@/components/dashboard/gamification-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { awardXp } from '@/lib/gamification/service';
import { assessmentXp } from '@/lib/gamification/xp-rules';
import { cn } from '@/lib/utils';

interface AssessmentQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  order_index: number;
}

interface AssessmentMeta {
  id: string;
  title: string;
  description: string;
  max_score: number;
  skill_id: string;
}

interface SkillMeta {
  id: string;
  name: string;
  category: string;
  icon_name: string;
  max_level: number;
}

interface AssessmentWithSkill {
  assessment: AssessmentMeta;
  skill: SkillMeta;
  questions: AssessmentQuestion[];
}

interface CategoryInfo {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

const categoryInfo: Record<string, CategoryInfo> = {
  'Programming': { key: 'Programming', label: 'Programming', description: 'Python fundamentals, syntax, and OOP', icon: Code, color: 'text-primary', bg: 'bg-primary/10' },
  'DSA': { key: 'DSA', label: 'DSA', description: 'Data structures, algorithms, complexity', icon: Boxes, color: 'text-accent', bg: 'bg-accent/10' },
  'Database': { key: 'Database', label: 'Database', description: 'DBMS, normalization, and SQL', icon: Database, color: 'text-success', bg: 'bg-success/10' },
  'Web Dev': { key: 'Web Dev', label: 'Web Dev', description: 'Frontend, backend, APIs, and architecture', icon: Atom, color: 'text-warning', bg: 'bg-warning/10' },
  'Cloud': { key: 'Cloud', label: 'Cloud', description: 'Cloud services, deployment, and DevOps', icon: Cloud, color: 'text-primary', bg: 'bg-primary/10' },
  'CS Fundamentals': { key: 'CS Fundamentals', label: 'CS Fundamentals', description: 'Operating systems and networks', icon: Network, color: 'text-accent', bg: 'bg-accent/10' },
};

type Phase = 'select' | 'quiz' | 'result';

interface AssessmentResult {
  assessmentId: string;
  skillId: string;
  skillName: string;
  category: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  xpEarned: number;
}

export default function AssessmentPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { notify } = useGamification();

  const [phase, setPhase] = useState<Phase>('select');
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentWithSkill[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());

  const activeAssessment = assessments[activeIndex];
  const questions = activeAssessment?.questions ?? [];
  const totalQuestions = questions.length;

  // Load all assessments with their skills and questions
  useEffect(() => {
    async function loadAssessments() {
      setLoading(true);

      // Fetch all skills
      const { data: skills, error: skillsErr } = await supabase
        .from('skills')
        .select('*')
        .order('name');
      if (skillsErr || !skills) {
        setLoading(false);
        return;
      }

      // Fetch all assessments
      const { data: assessmentsData, error: assessErr } = await supabase
        .from('assessments')
        .select('*');
      if (assessErr || !assessmentsData) {
        setLoading(false);
        return;
      }

      // Fetch all questions
      const { data: questionsData, error: qErr } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('order_index');
      if (qErr || !questionsData) {
        setLoading(false);
        return;
      }

      // Fetch user's completed assessments (to know which skills are done)
      if (user) {
        const { data: userAssess } = await supabase
          .from('user_assessments')
          .select('assessment_id')
          .eq('user_id', user.id);
        if (userAssess) {
          const completedAssessmentIds = new Set(userAssess.map((ua) => ua.assessment_id));
          const doneSkillIds = new Set<string>();
          for (const a of assessmentsData) {
            if (completedAssessmentIds.has(a.id)) {
              doneSkillIds.add(a.skill_id);
            }
          }
          setCompletedSkills(doneSkillIds);
        }
      }

      // Group questions by assessment and join with skills
      const grouped: AssessmentWithSkill[] = [];
      for (const skill of skills) {
        const assess = assessmentsData.find((a) => a.skill_id === skill.id);
        if (!assess) continue;
        const qs = questionsData.filter((q) => q.assessment_id === assess.id);
        if (qs.length === 0) continue;
        grouped.push({
          assessment: {
            id: assess.id,
            title: assess.title,
            description: assess.description,
            max_score: assess.max_score,
            skill_id: assess.skill_id,
          },
          skill: {
            id: skill.id,
            name: skill.name,
            category: skill.category,
            icon_name: skill.icon_name,
            max_level: skill.max_level,
          },
          questions: qs,
        });
      }

      setAssessments(grouped);
      setLoading(false);
    }

    loadAssessments();
  }, [user]);

  const startAssessment = (index: number) => {
    setActiveIndex(index);
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setPhase('quiz');
  };

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const goNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const submitAssessment = useCallback(async () => {
    if (!user || !activeAssessment) return;
    setSubmitting(true);

    const qs = activeAssessment.questions;
    let correctCount = 0;
    for (const q of qs) {
      if (answers[q.id] === q.correct_option) {
        correctCount++;
      }
    }
    const score = Math.round((correctCount / qs.length) * 100);
    const xpEarned = assessmentXp(correctCount, qs.length);

    // 1. Save the assessment attempt
    const { error: assessErr } = await supabase
      .from('user_assessments')
      .insert({
        user_id: user.id,
        assessment_id: activeAssessment.assessment.id,
        score,
        xp_earned: xpEarned,
      });

    if (assessErr) {
      toast({
        title: 'Error saving results',
        description: assessErr.message,
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    // 2. Upsert user_skills — set proficiency based on score and XP
    const proficiency = Math.max(1, Math.ceil((score / 100) * activeAssessment.skill.max_level));
    const { data: existingSkill } = await supabase
      .from('user_skills')
      .select('id, xp')
      .eq('user_id', user.id)
      .eq('skill_id', activeAssessment.skill.id)
      .maybeSingle();

    if (existingSkill) {
      // Update — take the higher proficiency and accumulate XP
      const newXp = existingSkill.xp + xpEarned;
      const newProficiency = Math.max(proficiency, Math.ceil((newXp / 2500) * activeAssessment.skill.max_level));
      await supabase
        .from('user_skills')
        .update({
          proficiency: Math.min(newProficiency, activeAssessment.skill.max_level),
          xp: newXp,
        })
        .eq('id', existingSkill.id);
    } else {
      await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          skill_id: activeAssessment.skill.id,
          proficiency,
          xp: xpEarned,
        });
    }

    // 3. Award XP through the gamification engine (handles profile XP,
    //    level, streak, activity log, and badge checks atomically)
    const awardResult = await awardXp(user.id, xpEarned, {
      type: 'assessment',
      title: `${activeAssessment.skill.name} assessment completed`,
      description: `Scored ${score}% — ${correctCount}/${qs.length} correct`,
    });

    if (awardResult.error) {
      toast({ title: 'XP could not be awarded', description: awardResult.error, variant: 'destructive' });
    }

    if (awardResult.achievements.length > 0) {
      notify(awardResult.achievements);
    }

    // 4. Refresh profile in auth context so navbar/dashboard reflect new XP
    await refreshProfile();

    // Mark skill as completed
    setCompletedSkills((prev) => {
      const next = new Set(prev);
      next.add(activeAssessment.skill.id);
      return next;
    });

    setResult({
      assessmentId: activeAssessment.assessment.id,
      skillId: activeAssessment.skill.id,
      skillName: activeAssessment.skill.name,
      category: activeAssessment.skill.category,
      score,
      correctCount,
      totalQuestions: qs.length,
      xpEarned,
    });

    setPhase('result');
    setSubmitting(false);
  }, [user, activeAssessment, answers, profile, toast, notify, refreshProfile]);

  // ===== Loading state =====
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ===== Phase: Category Selection =====
  if (phase === 'select') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Skill Assessment</h1>
          <p className="mt-1 text-muted-foreground">
            Take assessments to evaluate your skills and build your skill profile. Each assessment has 5 multiple-choice questions.
          </p>
        </div>

        {completedSkills.size > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {completedSkills.size} {completedSkills.size === 1 ? 'assessment' : 'assessments'} completed
                </p>
                <p className="text-xs text-muted-foreground">
                  Take more assessments to build a complete skill profile on your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((item, idx) => {
            const info = categoryInfo[item.skill.category] ?? categoryInfo['Programming'];
            const Icon = info.icon;
            const isCompleted = completedSkills.has(item.skill.id);

            return (
              <Card
                key={item.assessment.id}
                className="group flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${info.bg}`}>
                      <Icon className={`h-5 w-5 ${info.color}`} />
                    </div>
                    {isCompleted && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{item.assessment.title}</CardTitle>
                  <CardDescription className="text-sm">{item.assessment.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      {item.questions.length} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      {assessmentXp(item.questions.length, item.questions.length)} XP
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isCompleted ? 'outline' : 'default'}
                    onClick={() => startAssessment(idx)}
                  >
                    {isCompleted ? 'Retake' : 'Start'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== Phase: Quiz =====
  if (phase === 'quiz' && activeAssessment) {
    const q = questions[currentQuestion];
    const progressPercent = ((currentQuestion + 1) / totalQuestions) * 100;
    const answeredCount = Object.keys(answers).length;
    const allAnswered = answeredCount === totalQuestions;
    const info = categoryInfo[activeAssessment.skill.category] ?? categoryInfo['Programming'];
    const Icon = info.icon;

    const options = [
      { key: 'a', text: q.option_a },
      { key: 'b', text: q.option_b },
      { key: 'c', text: q.option_c },
      { key: 'd', text: q.option_d },
    ];

    return (
      <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setPhase('select')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Exit Assessment
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Icon className={`h-3.5 w-3.5 ${info.color}`} />
            {activeAssessment.skill.name}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">{q.question_text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[q.id] ?? ''}
              onValueChange={(val) => selectAnswer(q.id, val)}
              className="space-y-3"
            >
              {options.map((opt) => (
                <div
                  key={opt.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-4 transition-all cursor-pointer hover:bg-secondary/50',
                    answers[q.id] === opt.key && 'border-primary bg-primary/5'
                  )}
                  onClick={() => selectAnswer(q.id, opt.key)}
                >
                  <RadioGroupItem value={opt.key} id={`opt-${opt.key}`} />
                  <Label
                    htmlFor={`opt-${opt.key}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    <span className="font-semibold mr-2 text-muted-foreground">
                      {opt.key.toUpperCase()}.
                    </span>
                    {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          {currentQuestion < totalQuestions - 1 ? (
            <Button onClick={goNext} disabled={!answers[q.id]}>
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submitAssessment}
              disabled={!allAnswered || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          )}
        </div>

        {/* Question navigator dots */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {questions.map((question, idx) => {
            const isAnswered = !!answers[question.id];
            const isCurrent = idx === currentQuestion;
            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestion(idx)}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all',
                  isCurrent && 'bg-primary text-primary-foreground',
                  !isCurrent && isAnswered && 'bg-primary/20 text-primary',
                  !isCurrent && !isAnswered && 'bg-secondary text-muted-foreground'
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== Phase: Result =====
  if (phase === 'result' && result) {
    const scoreColor =
      result.score >= 80 ? 'text-success' : result.score >= 50 ? 'text-warning' : 'text-destructive';
    const scoreBg =
      result.score >= 80 ? 'bg-success/10' : result.score >= 50 ? 'bg-warning/10' : 'bg-destructive/10';
    const scoreLabel =
      result.score >= 80 ? 'Excellent!' : result.score >= 50 ? 'Good effort!' : 'Keep practicing!';
    const info = categoryInfo[result.category] ?? categoryInfo['Programming'];
    const Icon = info.icon;

    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="text-center space-y-4 py-8">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${scoreBg}`}>
            <Trophy className={`h-10 w-10 ${scoreColor}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{result.score}%</h1>
            <p className="mt-1 text-lg font-medium text-muted-foreground">{scoreLabel}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {result.skillName} Assessment
          </p>
        </div>

        {/* Score breakdown */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
              <div className="mt-2 text-2xl font-bold">
                {result.correctCount}/{result.totalQuestions}
              </div>
              <div className="text-xs text-muted-foreground">Correct Answers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Zap className="mx-auto h-5 w-5 text-primary" />
              <div className="mt-2 text-2xl font-bold">+{result.xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-accent" />
              <div className="mt-2 text-2xl font-bold">
                {Math.max(1, Math.ceil((result.score / 100) * (assessments.find(a => a.assessment.id === result.assessmentId)?.skill.max_level ?? 5)))}/{assessments.find(a => a.assessment.id === result.assessmentId)?.skill.max_level ?? 5}
              </div>
              <div className="text-xs text-muted-foreground">Proficiency Level</div>
            </CardContent>
          </Card>
        </div>

        {/* Skill profile created note */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-5">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${info.bg}`}>
              <Icon className={`h-5 w-5 ${info.color}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">Skill profile updated</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your {result.skillName} skill has been added to your profile. View your skill overview on the dashboard to see how all your skills stack up.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={() => setPhase('select')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Assessments
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const idx = assessments.findIndex((a) => a.assessment.id === result.assessmentId);
              if (idx >= 0) startAssessment(idx);
            }}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Retake Assessment
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            View Dashboard
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <AlertCircle className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">No assessments available right now.</p>
      <Button variant="outline" onClick={() => router.push('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  );
}
