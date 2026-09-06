import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ============================================================
// Semantic skill matching — alias map and normalization
// ============================================================

const SEMANTIC_ALIASES: Record<string, string[]> = {
  "JavaScript": ["js", "node", "nodejs", "node.js", "es6", "ecmascript", "jquery"],
  "TypeScript": ["ts", "tsc"],
  "React": ["react", "reactjs", "react.js", "jsx", "hooks", "redux"],
  "Node.js": ["node", "nodejs", "node.js", "express", "npm", "yarn", "fastify", "nestjs"],
  "Python": ["python", "py", "django", "flask", "fastapi", "pip"],
  "Java": ["java", "jvm", "spring", "spring boot", "maven", "gradle", "jpa", "hibernate"],
  "SQL": ["sql", "mysql", "postgres", "postgresql", "sqlite", "mariadb", "database", "query"],
  "PostgreSQL": ["postgres", "postgresql", "pg", "psql"],
  "HTML": ["html", "html5", "semantic html", "markup"],
  "CSS": ["css", "css3", "flexbox", "grid", "sass", "scss"],
  "Tailwind": ["tailwind", "tailwindcss", "tailwind css"],
  "Git": ["git", "github", "gitlab", "bitbucket", "version control"],
  "Docker": ["docker", "container", "containerization", "dockerfile", "docker-compose"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "iam", "rds", "cloudfront", "ecs"],
  "REST API": ["rest", "restful", "api", "endpoint", "http", "openapi", "swagger"],
  "Testing": ["test", "testing", "unit test", "jest", "mocha", "pytest", "selenium", "cypress", "junit"],
  "Machine Learning": ["machine learning", "ml", "scikit-learn", "sklearn", "model training", "feature engineering"],
  "Deep Learning": ["deep learning", "tensorflow", "pytorch", "keras", "neural network", "neural net"],
  "Data Structures": ["data structure", "array", "linked list", "tree", "graph", "stack", "queue", "hash table", "heap", "trie"],
  "Algorithms": ["algorithm", "sorting", "searching", "dynamic programming", "time complexity", "big o", "greedy", "backtracking"],
  "OOP": ["object-oriented", "oop", "encapsulation", "inheritance", "polymorphism", "abstraction"],
  "Linux": ["linux", "unix", "bash", "shell", "ubuntu", "debian"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions", "pipeline", "circleci"],
  "Kubernetes": ["kubernetes", "k8s", "kubectl", "helm", "pod"],
  "Redis": ["redis", "cache", "caching", "in-memory store"],
  "MongoDB": ["mongodb", "mongo", "nosql", "mongoose"],
  "GraphQL": ["graphql", "gql", "apollo", "hasura", "prisma"],
  "Next.js": ["next.js", "nextjs", "next js"],
  "Microservices": ["microservice", "microservices", "micro-service", "service-oriented", "soa"],
  "Authentication": ["authentication", "auth", "jwt", "oauth", "sso", "session management", "login"],
  "Pandas": ["pandas", "dataframe", "data manipulation"],
  "Statistics": ["statistics", "statistical", "probability", "regression", "hypothesis testing"],
  "NLP": ["nlp", "natural language processing", "text processing", "sentiment analysis", "tokenization"],
  "Data Visualization": ["visualization", "matplotlib", "seaborn", "plotly", "d3", "d3.js", "chart.js", "tableau", "powerbi"],
  "Kotlin": ["kotlin", "kt"],
  "Android": ["android", "android sdk", "android studio", "jetpack"],
  "Swift": ["swift", "ios", "xcode", "swiftui"],
  "Flutter": ["flutter", "dart"],
  "C++": ["c++", "cpp", "c plus plus", "stl", "boost"],
  "System Design": ["system design", "scalability", "distributed systems", "load balancing", "cap theorem", "sharding"],
  "Terraform": ["terraform", "infrastructure as code", "iac"],
  "UI Design": ["ui design", "figma", "sketch", "adobe xd", "wireframing", "prototyping"],
};

const REVERSE_ALIAS_MAP: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SEMANTIC_ALIASES)) {
    map.set(canonical.toLowerCase(), canonical);
    for (const alias of aliases) {
      map.set(alias.toLowerCase(), canonical);
    }
  }
  return map;
})();

function normalizeSkill(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return REVERSE_ALIAS_MAP.get(lower) ?? raw.trim();
}

function semanticMatch(studentSkill: string, targetSkill: string): boolean {
  const s = normalizeSkill(studentSkill);
  const t = normalizeSkill(targetSkill);
  if (s === t) return true;
  const aliases = SEMANTIC_ALIASES[t];
  if (aliases) {
    const sLower = s.toLowerCase();
    if (aliases.some((a) => a.toLowerCase() === sLower)) return true;
  }
  const tAliases = SEMANTIC_ALIASES[s];
  if (tAliases) {
    const tLower = t.toLowerCase();
    if (tAliases.some((a) => a.toLowerCase() === tLower)) return true;
  }
  return false;
}

// ============================================================
// Skill extraction from text
// ============================================================

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();
  for (const [skill, keywords] of Object.entries(SEMANTIC_ALIASES)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw)) {
        found.add(skill);
        break;
      }
    }
  }
  return Array.from(found);
}

// ============================================================
// Semantic job match
// ============================================================

function semanticJobMatch(
  requiredSkills: string[],
  preferredSkills: string[],
  userSkills: string[]
): { score: number; matched: string[]; missing: string[]; preferredMatched: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  const preferredMatched: string[] = [];

  for (const req of requiredSkills) {
    const has = userSkills.some((us) => semanticMatch(us, req));
    if (has) matched.push(req);
    else missing.push(req);
  }

  for (const pref of preferredSkills) {
    if (userSkills.some((us) => semanticMatch(us, pref))) {
      preferredMatched.push(pref);
    }
  }

  const reqScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 70 : 70;
  const prefScore = preferredSkills.length > 0 ? (preferredMatched.length / preferredSkills.length) * 30 : 30;
  const score = Math.min(100, Math.round(reqScore + prefScore));

  return { score, matched, missing, preferredMatched };
}

// ============================================================
// Roadmap recommendations
// ============================================================

interface RoadmapRecommendation {
  roadmap_id: string;
  role: string;
  title: string;
  description: string;
  estimated_weeks: number;
  match_score: number;
  missing_critical_skills: string[];
  reason: string;
}

async function recommendRoadmaps(
  supabase: ReturnType<typeof createClient>,
  userSkills: string[],
  targetRole: string
): Promise<RoadmapRecommendation[]> {
  const { data: roadmaps } = await supabase
    .from("career_roadmaps")
    .select("*")
    .order("title");

  if (!roadmaps || roadmaps.length === 0) return [];

  const { data: roleSkills } = await supabase
    .from("target_role_skills")
    .select("role, required_skills, preferred_skills")
    .in("role", roadmaps.map((r: { role: string }) => r.role));

  const roleSkillMap = new Map<string, { required: string[]; preferred: string[] }>();
  for (const rs of roleSkills ?? []) {
    roleSkillMap.set(rs.role, { required: rs.required_skills, preferred: rs.preferred_skills });
  }

  const recommendations: RoadmapRecommendation[] = roadmaps.map((r: { id: string; role: string; title: string; description: string; estimated_weeks: number }) => {
    const rs = roleSkillMap.get(r.role);
    const required = rs?.required ?? [];
    const preferred = rs?.preferred ?? [];

    const matched = required.filter((s: string) => userSkills.some((us) => semanticMatch(us, s)));
    const missing = required.filter((s: string) => !userSkills.some((us) => semanticMatch(us, s)));
    const prefMatched = preferred.filter((s: string) => userSkills.some((us) => semanticMatch(us, s)));

    const reqScore = required.length > 0 ? (matched.length / required.length) * 70 : 70;
    const prefScore = preferred.length > 0 ? (prefMatched.length / preferred.length) * 30 : 30;
    const matchScore = Math.min(100, Math.round(reqScore + prefScore));

    const isTarget = r.role === targetRole;
    const reason = isTarget
      ? `Direct match for your target role. ${missing.length > 0 ? `Focus on: ${missing.slice(0, 3).join(", ")}.` : "You've met all requirements!"}`
      : matchScore >= 70
        ? `Strong overlap — you already have ${matched.length}/${required.length} required skills.`
        : matchScore >= 40
          ? `Moderate overlap. Building these skills will diversify your options.`
          : `Different track that could broaden your skill set.`;

    return {
      roadmap_id: r.id,
      role: r.role,
      title: r.title,
      description: r.description,
      estimated_weeks: r.estimated_weeks,
      match_score: isTarget ? 100 : matchScore,
      missing_critical_skills: missing.slice(0, 5),
      reason,
    };
  });

  recommendations.sort((a, b) => b.match_score - a.match_score);
  return recommendations;
}

// ============================================================
// Project recommendations
// ============================================================

interface ProjectRecommendation {
  project_id: string;
  title: string;
  description: string;
  difficulty: string;
  tech_stack: string[];
  required_skills: string[];
  xp_reward: number;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  reason: string;
}

async function recommendProjects(
  supabase: ReturnType<typeof createClient>,
  userSkills: string[],
  userId: string
): Promise<ProjectRecommendation[]> {
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("difficulty", { ascending: true });

  if (!projects || projects.length === 0) return [];

  const { data: userProjects } = await supabase
    .from("user_projects")
    .select("project_id, status")
    .eq("user_id", userId);

  const completedProjectIds = new Set(
    (userProjects ?? []).filter((p: { status: string }) => p.status === "completed").map((p: { project_id: string }) => p.project_id)
  );

  const recommendations: ProjectRecommendation[] = projects
    .filter((p: { id: string }) => !completedProjectIds.has(p.id))
    .map((p: { id: string; title: string; description: string; difficulty: string; tech_stack: string[]; required_skills: string[]; xp_reward: number; category: string }) => {
      const required = p.required_skills ?? [];
      const matched = required.filter((s: string) => userSkills.some((us) => semanticMatch(us, s)));
      const missing = required.filter((s: string) => !userSkills.some((us) => semanticMatch(us, s)));

      const matchScore = required.length > 0
        ? Math.round((matched.length / required.length) * 100)
        : 50;

      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      const diffScore = (difficultyOrder as Record<string, number>)[p.difficulty] ?? 1;

      let reason = "";
      if (matchScore >= 80) {
        reason = `Perfect match — you have ${matched.length}/${required.length} required skills. Great project to solidify your knowledge.`;
      } else if (matchScore >= 50) {
        reason = `Good match — you'll need to learn ${missing.length} new skill${missing.length > 1 ? "s" : ""}: ${missing.slice(0, 3).join(", ")}.`;
      } else if (matchScore >= 25) {
        reason = `Stretch project — builds ${missing.length} new skills. Good for growth if you're up for a challenge.`;
      } else {
        reason = `Ambitious project — requires learning ${missing.length} new skills. Consider starting with easier projects first.`;
      }

      return {
        project_id: p.id,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        tech_stack: p.tech_stack ?? [],
        required_skills: required,
        xp_reward: p.xp_reward,
        match_score: matchScore,
        matched_skills: matched,
        missing_skills: missing,
        reason,
      };
    });

  recommendations.sort((a, b) => {
    if (a.match_score >= 80 && b.match_score < 80) return -1;
    if (b.match_score >= 80 && a.match_score < 80) return 1;
    return b.xp_reward - a.xp_reward;
  });

  return recommendations.slice(0, 10);
}

// ============================================================
// AI interview question generation
// ============================================================

interface GeneratedQuestion {
  question: string;
  category: string;
  difficulty: string;
  tags: string[];
  expected_topics: string[];
  hint: string;
}

const QUESTION_TEMPLATES: Record<string, { template: string; tags: string[]; hint: string }[]> = {
  technical: [
    { template: "Explain how {skill} works under the hood, and describe a scenario where you'd use it in a real project.", tags: ["concepts", "practical"], hint: "Cover the core mechanism and give a concrete example." },
    { template: "What are the key differences between {skill} and its alternatives? When would you choose one over the other?", tags: ["comparison", "trade-offs"], hint: "Compare 2-3 alternatives and justify your choice." },
    { template: "Walk through how you would debug a complex issue related to {skill}. What steps do you take?", tags: ["debugging", "problem-solving"], hint: "Describe your systematic debugging approach." },
    { template: "Describe a common performance bottleneck in {skill} and how you would optimize it.", tags: ["performance", "optimization"], hint: "Identify a specific bottleneck and your optimization strategy." },
    { template: "How does {skill} relate to {skill2} in a typical production system?", tags: ["architecture", "integration"], hint: "Explain how they interact in a real system." },
  ],
  behavioral: [
    { template: "Tell me about a time you faced a challenging technical problem related to {skill}. How did you resolve it?", tags: ["problem-solving", "resilience"], hint: "Use STAR: Situation, Task, Action, Result." },
    { template: "Describe a project where you used {skill}. What was your role and what did you learn?", tags: ["experience", "learning"], hint: "Focus on your specific contribution and takeaways." },
    { template: "Have you ever disagreed with a teammate about how to implement {skill}? How did you handle it?", tags: ["conflict", "collaboration"], hint: "Show your communication and compromise skills." },
    { template: "Tell me about a time you had to learn {skill} quickly. What was your approach?", tags: ["learning", "adaptability"], hint: "Show your learning strategy and time management." },
  ],
  system_design: [
    { template: "Design a system that heavily uses {skill}. What components would you include and how do they scale?", tags: ["scalability", "architecture"], hint: "Cover data flow, scaling strategy, and trade-offs." },
    { template: "How would you design a monitoring system for a service built with {skill}? What metrics matter?", tags: ["observability", "monitoring"], hint: "Cover latency, error rate, throughput, and alerting." },
  ],
};

function generateQuestions(
  skillGaps: string[],
  targetRole: string,
  category: string,
  count: number
): GeneratedQuestion[] {
  const templates = QUESTION_TEMPLATES[category] ?? QUESTION_TEMPLATES.technical;
  const skills = skillGaps.length > 0 ? skillGaps : ["programming", "problem-solving"];

  const questions: GeneratedQuestion[] = [];
  const usedTemplates = new Set<number>();

  for (let i = 0; i < count; i++) {
    const skill = skills[i % skills.length];
    const skill2 = skills[(i + 1) % skills.length] ?? "system design";

    let templateIdx = i % templates.length;
    if (usedTemplates.has(templateIdx)) {
      templateIdx = (templateIdx + 1) % templates.length;
    }
    usedTemplates.add(templateIdx);

    const t = templates[templateIdx];
    const question = t.template
      .replace("{skill}", skill)
      .replace("{skill2}", skill2);

    const difficulty = category === "behavioral" ? "medium" : i < 2 ? "easy" : i < 4 ? "medium" : "hard";

    questions.push({
      question,
      category,
      difficulty,
      tags: t.tags,
      expected_topics: [skill, skill2],
      hint: t.hint,
    });
  }

  return questions;
}

// ============================================================
// Readiness score calculation
// ============================================================

interface ReadinessScore {
  overall: number;
  skills_score: number;
  projects_score: number;
  interview_score: number;
  resume_score: number;
  roadmap_score: number;
  assessment_score: number;
  factors: { label: string; score: number; weight: number; detail: string }[];
  recommendations: string[];
}

async function calculateReadinessScore(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  targetRole: string
): Promise<ReadinessScore> {
  const [userSkillsRes, userProjectsRes, interviewsRes, resumeRes, roadmapRes, assessmentsRes, profileRes] = await Promise.all([
    supabase.from("user_skills").select("skill_id, proficiency").eq("user_id", userId),
    supabase.from("user_projects").select("status, project_id").eq("user_id", userId),
    supabase.from("interviews").select("score").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("resume_analyses").select("match_score, completeness_score").eq("user_id", userId).order("analyzed_at", { ascending: false }).limit(1),
    supabase.from("user_roadmap_milestones").select("status, milestone_id").eq("user_id", userId).eq("status", "completed"),
    supabase.from("user_assessments").select("score").eq("user_id", userId).order("taken_at", { ascending: false }).limit(5),
    supabase.from("profiles").select("xp, level, streak").eq("id", userId).maybeSingle(),
  ]);

  // Skills score
  const userSkills = userSkillsRes.data ?? [];
  const { data: roleData } = await supabase
    .from("target_role_skills")
    .select("required_skills, preferred_skills")
    .eq("role", targetRole)
    .maybeSingle();

  const requiredSkills = roleData?.required_skills ?? [];
  const preferredSkills = roleData?.preferred_skills ?? [];

  const { data: skillRows } = await supabase
    .from("skills")
    .select("id, name")
    .in("id", userSkills.map((us: { skill_id: string }) => us.skill_id));

  const skillNameProficiency = new Map<string, number>();
  for (const us of userSkills) {
    const skill = (skillRows ?? []).find((s: { id: string }) => s.id === us.skill_id);
    if (skill) {
      skillNameProficiency.set(skill.name, (us as { proficiency: number }).proficiency);
    }
  }

  const reqMatched = requiredSkills.filter((s: string) => {
    for (const [name, prof] of Array.from(skillNameProficiency.entries())) {
      if (semanticMatch(name, s) && prof >= 3) return true;
    }
    return false;
  }).length;
  const prefMatched = preferredSkills.filter((s: string) => {
    for (const [name, prof] of Array.from(skillNameProficiency.entries())) {
      if (semanticMatch(name, s) && prof >= 3) return true;
    }
    return false;
  }).length;

  const skillsScore = requiredSkills.length > 0
    ? Math.round((reqMatched / requiredSkills.length) * 70 + (preferredSkills.length > 0 ? (prefMatched / preferredSkills.length) * 30 : 30))
    : 50;

  // Projects score
  const completedProjects = (userProjectsRes.data ?? []).filter((p: { status: string }) => p.status === "completed").length;
  const projectsScore = Math.min(100, completedProjects * 20);

  // Interview score
  const interviewScores = (interviewsRes.data ?? []).map((i: { score: number }) => i.score);
  const avgInterview = interviewScores.length > 0
    ? Math.round(interviewScores.reduce((a: number, b: number) => a + b, 0) / interviewScores.length)
    : 0;

  // Resume score
  const resumeData = resumeRes.data?.[0];
  const resumeScore = resumeData
    ? Math.round(((resumeData as { match_score: number }).match_score + (resumeData as { completeness_score: number }).completeness_score) / 2)
    : 0;

  // Roadmap score
  const completedMilestones = (roadmapRes.data ?? []).length;
  const roadmapScore = Math.min(100, completedMilestones * 10);

  // Assessment score
  const assessmentScores = (assessmentsRes.data ?? []).map((a: { score: number }) => a.score);
  const avgAssessment = assessmentScores.length > 0
    ? Math.round(assessmentScores.reduce((a: number, b: number) => a + b, 0) / assessmentScores.length)
    : 0;

  // Weighted overall
  const factors = [
    { label: "Skills Match", score: skillsScore, weight: 25, detail: `${reqMatched}/${requiredSkills.length} required skills at proficiency 3+` },
    { label: "Projects", score: projectsScore, weight: 20, detail: `${completedProjects} completed project${completedProjects !== 1 ? "s" : ""}` },
    { label: "Interview Practice", score: avgInterview, weight: 20, detail: `${interviewScores.length} interview${interviewScores.length !== 1 ? "s" : ""} taken, avg ${avgInterview}/100` },
    { label: "Resume Quality", score: resumeScore, weight: 10, detail: resumeData ? `Match: ${(resumeData as { match_score: number }).match_score}%, Completeness: ${(resumeData as { completeness_score: number }).completeness_score}%` : "No resume uploaded" },
    { label: "Roadmap Progress", score: roadmapScore, weight: 15, detail: `${completedMilestones} milestones completed` },
    { label: "Assessments", score: avgAssessment, weight: 10, detail: `${assessmentScores.length} assessment${assessmentScores.length !== 1 ? "s" : ""} taken, avg ${avgAssessment}/100` },
  ];

  const overall = Math.round(factors.reduce((acc, f) => acc + (f.score * f.weight / 100), 0));

  // Recommendations
  const recommendations: string[] = [];
  if (skillsScore < 60) recommendations.push(`Focus on building ${requiredSkills.length - reqMatched} missing required skills for ${targetRole}.`);
  if (projectsScore < 60) recommendations.push(`Complete ${Math.ceil((60 - projectsScore) / 20)} more project${Math.ceil((60 - projectsScore) / 20) > 1 ? "s" : ""} to demonstrate practical skills.`);
  if (avgInterview < 60) recommendations.push("Practice more mock interviews to improve your interview performance.");
  if (resumeScore < 50) recommendations.push("Upload and optimize your resume to improve your application success rate.");
  if (roadmapScore < 50) recommendations.push(`Complete ${Math.ceil((50 - roadmapScore) / 10)} more roadmap milestones to stay on track.`);
  if (avgAssessment < 60) recommendations.push("Take more skill assessments to validate your knowledge.");
  if (recommendations.length === 0) recommendations.push("You're on track! Keep maintaining your skills and applying to opportunities.");

  return { overall, skills_score: skillsScore, projects_score: projectsScore, interview_score: avgInterview, resume_score: resumeScore, roadmap_score: roadmapScore, assessment_score: avgAssessment, factors, recommendations };
}

// ============================================================
// Main handler
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, user_id } = body as { action: string; user_id: string };

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user profile for target role
    const { data: profile } = await supabase
      .from("profiles")
      .select("target_role, role, level, xp")
      .eq("id", user_id)
      .maybeSingle();

    const targetRole = body.target_role ?? profile?.target_role ?? "software_developer";

    // Get user skills
    const { data: userSkillsData } = await supabase
      .from("user_skills")
      .select("skill_id, proficiency")
      .eq("user_id", user_id);

    const { data: skillRows } = await supabase
      .from("skills")
      .select("id, name")
      .in("id", (userSkillsData ?? []).map((us: { skill_id: string }) => us.skill_id));

    const userSkills = (skillRows ?? []).map((s: { name: string }) => s.name);

    // Also get skills from latest resume
    const { data: latestResume } = await supabase
      .from("resume_analyses")
      .select("extracted_skills")
      .eq("user_id", user_id)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const allUserSkills = Array.from(new Set([
      ...userSkills,
      ...((latestResume?.extracted_skills ?? []) as string[]),
    ]));

    // ============================================================
    // Action: skill_extraction
    // ============================================================
    if (action === "skill_extraction") {
      const { text } = body as { text: string };
      if (!text) {
        return new Response(
          JSON.stringify({ error: "Missing required field: text" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const extracted = extractSkills(text);
      return new Response(
        JSON.stringify({ skills: extracted, count: extracted.length }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: semantic_match
    // ============================================================
    if (action === "semantic_match") {
      const { required_skills, preferred_skills } = body as { required_skills: string[]; preferred_skills: string[] };
      if (!required_skills) {
        return new Response(
          JSON.stringify({ error: "Missing required field: required_skills" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = semanticJobMatch(required_skills ?? [], preferred_skills ?? [], allUserSkills);
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: recommend_roadmaps
    // ============================================================
    if (action === "recommend_roadmaps") {
      const recommendations = await recommendRoadmaps(supabase, allUserSkills, targetRole);
      return new Response(
        JSON.stringify({ recommendations }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: recommend_projects
    // ============================================================
    if (action === "recommend_projects") {
      const recommendations = await recommendProjects(supabase, allUserSkills, user_id);
      return new Response(
        JSON.stringify({ recommendations }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: generate_questions
    // ============================================================
    if (action === "generate_questions") {
      const { category, skill_gaps, count } = body as { category: string; skill_gaps: string[]; count: number };
      if (!category) {
        return new Response(
          JSON.stringify({ error: "Missing required field: category" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get skill gaps if not provided
      let gaps = skill_gaps ?? [];
      if (gaps.length === 0) {
        const { data: roleData } = await supabase
          .from("target_role_skills")
          .select("required_skills")
          .eq("role", targetRole)
          .maybeSingle();

        const required = roleData?.required_skills ?? [];
        gaps = required.filter((s: string) => !allUserSkills.some((us: string) => semanticMatch(us, s)));
      }

      const questions = generateQuestions(gaps, targetRole, category, count ?? 5);
      return new Response(
        JSON.stringify({ questions }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: readiness_score
    // ============================================================
    if (action === "readiness_score") {
      const result = await calculateReadinessScore(supabase, user_id, targetRole);

      // Store readiness score in profile
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user_id);

      // Create notification if readiness improved significantly
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // Action: full_analysis (all-in-one)
    // ============================================================
    if (action === "full_analysis") {
      const [roadmaps, projects, readiness] = await Promise.all([
        recommendRoadmaps(supabase, allUserSkills, targetRole),
        recommendProjects(supabase, allUserSkills, user_id),
        calculateReadinessScore(supabase, user_id, targetRole),
      ]);

      return new Response(
        JSON.stringify({
          user_skills: allUserSkills,
          target_role: targetRole,
          roadmap_recommendations: roadmaps.slice(0, 3),
          project_recommendations: projects.slice(0, 5),
          readiness_score: readiness,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}. Valid actions: skill_extraction, semantic_match, recommend_roadmaps, recommend_projects, generate_questions, readiness_score, full_analysis` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred in the AI engine.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
