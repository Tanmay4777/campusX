'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText,
  Upload,
  Loader2,
  Target,
  CheckCircle2,
  XCircle,
  Lightbulb,
  TrendingUp,
  FileCheck,
  Code2,
  Sparkles,
  AlertCircle,
  History,
  Clock,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTargetRoles,
  fetchLatestAnalysis,
  fetchResumeHistory,
  analyzeResume,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
  type AnalysisResult,
  type AnalysisSuggestion,
} from '@/lib/resume/resume-data';
import type { TargetRoleSkills, ResumeAnalysis } from '@/lib/database.types';
import { cn } from '@/lib/utils';

const severityConfig: Record<string, { color: string; icon: typeof AlertCircle }> = {
  high: { color: 'text-destructive bg-destructive/5 border-destructive/20', icon: XCircle },
  medium: { color: 'text-warning bg-warning/5 border-warning/20', icon: AlertCircle },
  low: { color: 'text-muted-foreground bg-muted/40 border-muted', icon: Lightbulb },
};

export default function ResumePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roles, setRoles] = useState<TargetRoleSkills[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [latestStored, setLatestStored] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const [roleData, latest, hist] = await Promise.all([
        fetchTargetRoles(),
        fetchLatestAnalysis(user.id),
        fetchResumeHistory(user.id),
      ]);
      setRoles(roleData);
      setLatestStored(latest);
      setHistory(hist);
      if (latest) {
        setSelectedRole(latest.target_role);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload a PDF under 5 MB.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!user || !selectedFile || !selectedRole) {
      toast({
        title: 'Missing information',
        description: 'Please select a target role and upload your resume PDF.',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const { result, error } = await analyzeResume(selectedFile, selectedRole, user.id);

      if (error) {
        toast({ title: 'Analysis failed', description: error, variant: 'destructive' });
      } else if (result) {
        setAnalysis(result);
        toast({
          title: 'Resume analyzed',
          description: `Match score: ${result.match_score}/100 — ${getScoreLabel(result.match_score)}`,
        });
        // Refresh history
        const hist = await fetchResumeHistory(user.id);
        setHistory(hist);
        const latest = await fetchLatestAnalysis(user.id);
        setLatestStored(latest);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const displayAnalysis: AnalysisResult | null = analysis ?? (latestStored ? {
    extracted_text: latestStored.extracted_text,
    extracted_skills: latestStored.extracted_skills,
    missing_skills: latestStored.missing_skills,
    project_quality_score: latestStored.project_quality_score,
    completeness_score: latestStored.completeness_score,
    match_score: latestStored.match_score,
    suggestions: latestStored.suggestions,
    completed_projects: 0,
  } : null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Resume Intelligence</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your resume, pick a target role, and get an instant analysis with a match score and improvement suggestions.
        </p>
      </div>

      {/* Upload + Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Upload & Analyze
          </CardTitle>
          <CardDescription>Select your target role and upload a PDF resume (max 5 MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.role}>
                      {r.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume PDF</label>
              <div
                className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 transition-colors hover:border-primary/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select a PDF file'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : 'PDF only, up to 5 MB'}
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !selectedFile || !selectedRole}
            className="w-full sm:w-auto"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing resume...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {displayAnalysis && (
        <>
          {/* Score Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <ScoreCard
              icon={Target}
              label="Role Match Score"
              score={displayAnalysis.match_score}
              description="How well your skills align with the target role"
            />
            <ScoreCard
              icon={FileCheck}
              label="Resume Completeness"
              score={displayAnalysis.completeness_score}
              description="Presence of key resume sections"
            />
            <ScoreCard
              icon={TrendingUp}
              label="Project Quality"
              score={displayAnalysis.project_quality_score}
              description="Project and skills presentation quality"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Skills Analysis */}
            <div className="space-y-6 lg:col-span-2">
              {/* Extracted Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Code2 className="h-4 w-4 text-primary" />
                    Extracted Skills
                  </CardTitle>
                  <CardDescription>Skills detected from your resume</CardDescription>
                </CardHeader>
                <CardContent>
                  {displayAnalysis.extracted_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayAnalysis.extracted_skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills were detected. Make sure your resume lists technologies clearly.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Missing Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Missing Skills
                  </CardTitle>
                  <CardDescription>
                    Key skills for {selectedRole || 'this role'} not found in your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {displayAnalysis.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {displayAnalysis.missing_skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="gap-1 border-destructive/30 text-destructive">
                          <XCircle className="h-3 w-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1 text-sm text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      You have all the required skills for this role.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Improvement Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Improvement Suggestions
                  </CardTitle>
                  <CardDescription>
                    {displayAnalysis.suggestions.length} suggestion{displayAnalysis.suggestions.length !== 1 ? 's' : ''} to improve your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {displayAnalysis.suggestions.length > 0 ? (
                    displayAnalysis.suggestions.map((s: AnalysisSuggestion, i: number) => {
                      const config = severityConfig[s.severity] ?? severityConfig['low'];
                      const Icon = config.icon;
                      return (
                        <div
                          key={i}
                          className={cn('flex items-start gap-2 rounded-lg border p-3', config.color)}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{s.category}</p>
                            <p className="text-sm text-muted-foreground">{s.message}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <p className="text-sm text-success">
                        Great job! Your resume meets all quality standards for this role.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: History + Extracted Text Preview */}
            <div className="space-y-6">
              {/* Analysis History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4 text-primary" />
                    Analysis History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No previous analyses.</p>
                  ) : (
                    history.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{h.target_role}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(h.analyzed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={cn('shrink-0 font-bold', getScoreColor(h.match_score))}>
                          {h.match_score}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Extracted Text Preview */}
              {displayAnalysis.extracted_text && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      Extracted Text Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {displayAnalysis.extracted_text.substring(0, 1500)}
                        {displayAnalysis.extracted_text.length > 1500 ? '...' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {!displayAnalysis && !analyzing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Ready to analyze your resume</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Select a target role, upload your resume PDF, and click Analyze. You will get a match
                score, skill gap analysis, and personalized improvement suggestions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScoreCard({
  icon: Icon,
  label,
  score,
  description,
}: {
  icon: typeof Target;
  label: string;
  score: number;
  description: string;
}) {
  return (
    <Card className={cn('border', getScoreBg(score))}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80">
              <Icon className={cn('h-5 w-5', getScoreColor(score))} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className="flex items-baseline gap-1">
                <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>
          <span className={cn('text-xs font-medium', getScoreColor(score))}>
            {getScoreLabel(score)}
          </span>
        </div>
        <Progress value={score} className="mt-3 h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
