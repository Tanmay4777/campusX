'use client';

import { useState } from 'react';
import {
  GitBranch,
  Loader2,
  FileText,
  TestTube,
  Container,
  GitMerge,
  Code2,
  Star,
  GitFork,
  CircleAlert,
  Lightbulb,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeRepository,
  getScoreColor,
  getScoreBg,
  getScoreLabel,
  type RepoAnalysis,
  type AnalysisSuggestion,
} from '@/lib/projects/github-analysis';
import { cn } from '@/lib/utils';

interface GitHubVerificationProps {
  projectId: string;
  userId: string;
  githubUrl: string;
  hasGithubUrl: boolean;
}

const severityConfig: Record<string, { color: string; icon: typeof CircleAlert }> = {
  high: { color: 'text-destructive bg-destructive/5 border-destructive/20', icon: XCircle },
  medium: { color: 'text-warning bg-warning/5 border-warning/20', icon: CircleAlert },
  low: { color: 'text-muted-foreground bg-muted/40 border-muted', icon: Lightbulb },
};

export function GitHubVerification({ projectId, userId, githubUrl, hasGithubUrl }: GitHubVerificationProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!githubUrl) {
      toast({
        title: 'No repository URL',
        description: 'Please save a GitHub repository URL first.',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzing(true);
    setError(null);

    const result = await analyzeRepository(githubUrl, projectId, userId);

    if (result.error) {
      setError(result.error);
      toast({ title: 'Analysis failed', description: result.error, variant: 'destructive' });
    } else if (result.analysis) {
      setAnalysis(result.analysis);
      toast({
        title: 'Repository analyzed',
        description: `Quality score: ${result.analysis.quality_score}/100 — ${getScoreLabel(result.analysis.quality_score)}`,
      });
    }

    setAnalyzing(false);
  };

  if (!hasGithubUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Repository Verification
          </CardTitle>
          <CardDescription>
            Submit your GitHub URL above, then analyze your repository for a quality score.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Repository Verification
            </CardTitle>
            <CardDescription className="mt-1">
              Analyze your GitHub repository for code quality, tests, and best practices.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            {analysis ? 'Re-analyze' : 'Analyze'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {analyzing && !analysis && (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing repository...</p>
          </div>
        )}

        {analysis && (
          <>
            {/* Score Card */}
            <div className={cn('rounded-lg border p-4', getScoreBg(analysis.quality_score))}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Project Quality Score</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className={cn('text-3xl font-bold', getScoreColor(analysis.quality_score))}>
                      {analysis.quality_score}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <p className={cn('mt-0.5 text-sm font-medium', getScoreColor(analysis.quality_score))}>
                    {getScoreLabel(analysis.quality_score)}
                  </p>
                </div>
                <Progress
                  value={analysis.quality_score}
                  className="h-2 w-24"
                />
              </div>
            </div>

            {/* Repo Info */}
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{analysis.repo_full_name}</span>
                </div>
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {analysis.description && (
                <p className="text-xs text-muted-foreground">{analysis.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {analysis.stars}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  {analysis.forks}
                </span>
                <span className="flex items-center gap-1">
                  <CircleAlert className="h-3 w-3" />
                  {analysis.open_issues} issues
                </span>
                {analysis.license && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {analysis.license}
                  </span>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-2">
              <ChecklistItem
                icon={FileText}
                label="README"
                passed={analysis.has_readme}
              />
              <ChecklistItem
                icon={TestTube}
                label="Tests"
                passed={analysis.has_tests}
              />
              <ChecklistItem
                icon={Container}
                label="Docker"
                passed={analysis.has_docker}
              />
              <ChecklistItem
                icon={GitMerge}
                label="CI/CD"
                passed={analysis.has_ci}
              />
            </div>

            {/* Languages */}
            {Object.keys(analysis.languages).length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Code2 className="h-3 w-3" />
                  Languages
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(analysis.languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, bytes]) => (
                      <Badge key={lang} variant="secondary" className="text-xs font-normal">
                        {lang}
                        <span className="ml-1 text-muted-foreground">
                          {formatBytes(bytes)}
                        </span>
                      </Badge>
                    ))}
                </div>
              </div>
            )}

            {/* Source files */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Source files detected</span>
              <span className="font-medium">{analysis.source_file_count}</span>
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Improvement Suggestions ({analysis.suggestions.length})
                </p>
                <div className="space-y-2">
                  {analysis.suggestions.map((s: AnalysisSuggestion, i: number) => {
                    const config = severityConfig[s.severity] ?? severityConfig['low'];
                    const Icon = config.icon;
                    return (
                      <div
                        key={i}
                        className={cn('flex items-start gap-2 rounded-lg border p-2.5', config.color)}
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{s.category}</p>
                          <p className="text-xs text-muted-foreground">{s.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {analysis.suggestions.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <p className="text-sm text-success">
                  Great job! Your repository meets all quality standards.
                </p>
              </div>
            )}
          </>
        )}

        {!analysis && !analyzing && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Ready to analyze</p>
              <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
                Click "Analyze" to check your repository for README, tests, Docker support, and more.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  icon: Icon,
  label,
  passed,
}: {
  icon: typeof FileText;
  label: string;
  passed: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border p-2.5 text-sm',
        passed
          ? 'border-success/20 bg-success/5 text-success'
          : 'border-muted bg-muted/30 text-muted-foreground'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {passed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4 opacity-50" />
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
