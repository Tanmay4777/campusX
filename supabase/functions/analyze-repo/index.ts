import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisSuggestion {
  category: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface RepoAnalysis {
  repo_name: string;
  repo_full_name: string;
  description: string;
  stars: number;
  forks: number;
  open_issues: number;
  languages: Record<string, number>;
  has_readme: boolean;
  has_tests: boolean;
  has_docker: boolean;
  has_ci: boolean;
  source_file_count: number;
  license: string;
  quality_score: number;
  suggestions: AnalysisSuggestion[];
}

const TEST_FILE_PATTERNS = [
  /test/i,
  /spec/i,
  /__tests__/i,
  /\.test\./i,
  /\.spec\./i,
  /pytest/i,
  /unittest/i,
];

const CI_CONFIG_PATHS = [
  ".github/workflows",
  ".gitlab-ci.yml",
  ".circleci",
  ".travis.yml",
  "Jenkinsfile",
  "azure-pipelines.yml",
  ".drone.yml",
];

const SOURCE_FILE_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rs",
  ".rb", ".php", ".c", ".cpp", ".h", ".cs", ".swift", ".kt",
  ".scala", ".vue", ".svelte", ".html", ".css", ".scss",
];

const DOCKER_PATTERNS = ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", "docker-compose"];

interface GitTreeItem {
  path: string;
  type: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
  } catch {
    const match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?(?:\/)?$/);
    if (match) return { owner: match[1], repo: match[2] };
    return null;
  }
}

async function fetchGitHubApi(path: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "CampusX-Repo-Analyzer",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`https://api.github.com${path}`, { headers });
}

function isTestFile(path: string): boolean {
  return TEST_FILE_PATTERNS.some((p) => p.test(path));
}

function isSourceFile(path: string): boolean {
  return SOURCE_FILE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

function isCIConfig(path: string): boolean {
  return CI_CONFIG_PATHS.some((ci) => path === ci || path.startsWith(ci + "/"));
}

function isDockerFile(path: string): boolean {
  return DOCKER_PATTERNS.some((d) => path === d || path.startsWith(d));
}

function calculateScore(
  hasReadme: boolean,
  hasTests: boolean,
  hasDocker: boolean,
  hasCI: boolean,
  sourceFileCount: number,
  languageCount: number,
  hasLicense: boolean
): number {
  let score = 0;
  if (hasReadme) score += 25;
  if (hasTests) score += 20;
  if (hasDocker) score += 15;
  if (hasCI) score += 15;
  if (sourceFileCount >= 5) score += 10;
  else if (sourceFileCount >= 1) score += 5;
  if (languageCount >= 2) score += 5;
  if (hasLicense) score += 10;
  return Math.min(100, score);
}

function generateSuggestions(
  hasReadme: boolean,
  hasTests: boolean,
  hasDocker: boolean,
  hasCI: boolean,
  sourceFileCount: number,
  hasLicense: boolean,
  openIssues: number
): AnalysisSuggestion[] {
  const suggestions: AnalysisSuggestion[] = [];

  if (!hasReadme) {
    suggestions.push({
      category: "Documentation",
      message: "Add a README.md file describing what your project does, how to install it, and how to run it.",
      severity: "high",
    });
  }

  if (!hasTests) {
    suggestions.push({
      category: "Testing",
      message: "No test files detected. Add unit tests to verify your code works correctly and prevent regressions.",
      severity: "high",
    });
  }

  if (!hasDocker) {
    suggestions.push({
      category: "Deployment",
      message: "Add a Dockerfile to make your project easy to deploy and run in any environment.",
      severity: "medium",
    });
  }

  if (!hasCI) {
    suggestions.push({
      category: "CI/CD",
      message: "Set up continuous integration (GitHub Actions, etc.) to automatically run tests on every push.",
      severity: "medium",
    });
  }

  if (!hasLicense) {
    suggestions.push({
      category: "Licensing",
      message: "Add a LICENSE file so others know how they can use your code.",
      severity: "low",
    });
  }

  if (sourceFileCount < 5) {
    suggestions.push({
      category: "Code Structure",
      message: "Your repository has very few source files. Consider organizing your code into modular files.",
      severity: "low",
    });
  }

  if (openIssues > 10) {
    suggestions.push({
      category: "Issue Management",
      message: `You have ${openIssues} open issues. Consider closing or addressing stale issues.`,
      severity: "low",
    });
  }

  return suggestions;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { repo_url, project_id, user_id } = await req.json();

    if (!repo_url || !project_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: repo_url, project_id, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseGitHubUrl(repo_url);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub URL. Please provide a valid https://github.com/owner/repo URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { owner, repo } = parsed;
    const githubToken = Deno.env.get("GITHUB_TOKEN");

    // Fetch repo metadata
    const repoResponse = await fetchGitHubApi(`/repos/${owner}/${repo}`, githubToken);
    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: "Repository not found. Make sure it is public and the URL is correct." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (repoResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: "GitHub API rate limit reached. Please try again in a few minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: `GitHub API error: ${repoResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const repoData = await repoResponse.json();

    // Fetch languages
    const langResponse = await fetchGitHubApi(`/repos/${owner}/${repo}/languages`, githubToken);
    const languages: Record<string, number> = langResponse.ok ? await langResponse.json() : {};

    // Fetch file tree (recursive)
    const treeResponse = await fetchGitHubApi(
      `/repos/${owner}/${repo}/git/trees/${repoData.default_branch ?? "main"}?recursive=1`,
      githubToken
    );
    const treeItems: GitTreeItem[] = treeResponse.ok ? (await treeResponse.json()).tree ?? [] : [];

    let hasReadme = false;
    let hasTests = false;
    let hasDocker = false;
    let hasCI = false;
    let sourceFileCount = 0;

    for (const item of treeItems) {
      if (item.type !== "blob") continue;
      const path = item.path.toLowerCase();

      if (path === "readme.md" || path.startsWith("readme.")) {
        hasReadme = true;
      }
      if (isTestFile(path)) {
        hasTests = true;
      }
      if (isDockerFile(path)) {
        hasDocker = true;
      }
      if (isCIConfig(path)) {
        hasCI = true;
      }
      if (isSourceFile(path)) {
        sourceFileCount++;
      }
    }

    const licenseName = repoData.license?.name ?? "";
    const languageCount = Object.keys(languages).length;

    const qualityScore = calculateScore(
      hasReadme, hasTests, hasDocker, hasCI,
      sourceFileCount, languageCount, !!licenseName
    );

    const suggestions = generateSuggestions(
      hasReadme, hasTests, hasDocker, hasCI,
      sourceFileCount, !!licenseName, repoData.open_issues_count ?? 0
    );

    const analysis: RepoAnalysis = {
      repo_name: repoData.name ?? repo,
      repo_full_name: repoData.full_name ?? `${owner}/${repo}`,
      description: repoData.description ?? "",
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      open_issues: repoData.open_issues_count ?? 0,
      languages,
      has_readme: hasReadme,
      has_tests: hasTests,
      has_docker: hasDocker,
      has_ci: hasCI,
      source_file_count: sourceFileCount,
      license: licenseName,
      quality_score: qualityScore,
      suggestions,
    };

    // Persist to Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase
      .from("project_verifications")
      .upsert(
        {
          user_id,
          project_id,
          repo_url: repo_url,
          repo_name: analysis.repo_name,
          repo_full_name: analysis.repo_full_name,
          description: analysis.description,
          stars: analysis.stars,
          forks: analysis.forks,
          open_issues: analysis.open_issues,
          languages: analysis.languages,
          has_readme: analysis.has_readme,
          has_tests: analysis.has_tests,
          has_docker: analysis.has_docker,
          has_ci: analysis.has_ci,
          source_file_count: analysis.source_file_count,
          license: analysis.license,
          quality_score: analysis.quality_score,
          suggestions: analysis.suggestions,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,project_id" }
      );

    return new Response(
      JSON.stringify(analysis),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during analysis.';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
