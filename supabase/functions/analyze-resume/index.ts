import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { getDocument } from "npm:pdfjs-dist@4.8.69/legacy/build/pdf.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ResumeSuggestion {
  category: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface ResumeAnalysisResult {
  extracted_text: string;
  extracted_skills: string[];
  missing_skills: string[];
  project_quality_score: number;
  completeness_score: number;
  match_score: number;
  suggestions: ResumeSuggestion[];
}

const SKILL_KEYWORDS: Record<string, string[]> = {
  "JavaScript": ["javascript", "js", "node", "nodejs", "es6", "ecmascript"],
  "TypeScript": ["typescript", "ts"],
  "React": ["react", "reactjs", "react.js", "jsx", "hooks", "redux"],
  "Node.js": ["node", "nodejs", "node.js", "express", "npm"],
  "Python": ["python", "py", "django", "flask", "fastapi"],
  "Java": ["java", "spring", "spring boot", "maven", "gradle", "jvm"],
  "SQL": ["sql", "mysql", "postgres", "postgresql", "database", "query"],
  "PostgreSQL": ["postgres", "postgresql", "pg"],
  "HTML": ["html", "html5", "semantic html"],
  "CSS": ["css", "css3", "flexbox", "grid", "sass", "scss"],
  "Tailwind": ["tailwind", "tailwindcss"],
  "Git": ["git", "github", "gitlab", "version control", "bitbucket"],
  "Docker": ["docker", "container", "dockerfile", "docker-compose"],
  "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda", "iam"],
  "REST API": ["rest", "restful", "api", "endpoint", "http"],
  "Testing": ["test", "testing", "unit test", "jest", "mocha", "pytest", "junit", "selenium", "cypress"],
  "Machine Learning": ["machine learning", "ml", "model", "neural", "scikit", "sklearn"],
  "Deep Learning": ["deep learning", "tensorflow", "pytorch", "keras", "neural network"],
  "Data Structures": ["data structure", "array", "linked list", "tree", "graph", "stack", "queue"],
  "Algorithms": ["algorithm", "sorting", "searching", "dynamic programming", "complexity"],
  "OOP": ["object-oriented", "oop", "encapsulation", "inheritance", "polymorphism"],
  "Linux": ["linux", "unix", "bash", "shell", "ubuntu"],
  "CI/CD": ["ci/cd", "continuous integration", "continuous deployment", "jenkins", "github actions", "pipeline"],
  "Kubernetes": ["kubernetes", "k8s", "kubectl"],
  "Redis": ["redis", "cache", "caching"],
  "MongoDB": ["mongodb", "mongo", "nosql"],
  "GraphQL": ["graphql", "gql", "apollo"],
  "Next.js": ["next.js", "nextjs", "next js"],
  "Spring Boot": ["spring boot", "spring-boot", "springboot"],
  "Microservices": ["microservice", "microservices", "micro-service"],
  "Authentication": ["authentication", "auth", "jwt", "oauth", "login", "session"],
  "Pandas": ["pandas", "dataframe"],
  "Statistics": ["statistics", "statistical", "probability", "regression"],
  "NLP": ["nlp", "natural language", "text processing", "sentiment"],
  "Data Visualization": ["visualization", "matplotlib", "seaborn", "chart", "plotly", "d3"],
  "Kotlin": ["kotlin", "kt"],
  "Android": ["android", "android sdk", "android studio"],
  "Swift": ["swift", "ios", "xcode"],
  "Flutter": ["flutter", "dart"],
  "C++": ["c++", "cpp", "c plus plus"],
  "System Design": ["system design", "scalability", "distributed", "load balancing"],
  "Terraform": ["terraform", "infrastructure as code", "iac"],
  "UI Design": ["ui design", "figma", "sketch", "adobe xd", "wireframe"],
};

async function extractTextFromPDF(bytes: Uint8Array): Promise<string> {
  const document = await getDocument({
    data: bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: { str?: string }) => item.str ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (pageText) pages.push(pageText);
    }
  } finally {
    await document.destroy();
  }

  return pages.join('\n').trim();
}

function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const found = new Set<string>();
  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerText.includes(kw)) {
        found.add(skill);
        break;
      }
    }
  }
  return Array.from(found);
}

function calculateCompleteness(text: string, extractedSkills: string[]): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  if (text.length > 200) score += 15; else if (text.length > 50) score += 8;
  if (/experience|work|internship|employment/i.test(text)) score += 20;
  if (/education|degree|bachelor|master|b\.tech|m\.tech|university|college/i.test(text)) score += 20;
  if (/project|portfolio|github|repository/i.test(text)) score += 15;
  if (/skill|technolog|proficient|familiar/i.test(text)) score += 10;
  if (extractedSkills.length >= 5) score += 10; else if (extractedSkills.length >= 2) score += 5;
  if (/contact|email|phone|@/i.test(text)) score += 5;
  if (/achievement|award|honor|certification/i.test(text)) score += 5;
  return Math.min(100, score);
}

function calculateMatchScore(
  extractedSkills: string[],
  requiredSkills: string[],
  preferredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 0;
  const extractedLower = new Set(extractedSkills.map((s) => s.toLowerCase()));
  const reqMatched = requiredSkills.filter((s) => extractedLower.has(s.toLowerCase())).length;
  const prefMatched = preferredSkills.filter((s) => extractedLower.has(s.toLowerCase())).length;
  const reqScore = (reqMatched / requiredSkills.length) * 70;
  const prefScore = preferredSkills.length > 0 ? (prefMatched / preferredSkills.length) * 30 : 30;
  return Math.round(reqScore + prefScore);
}

function calculateProjectQuality(
  extractedSkills: string[],
  hasGithub: boolean,
  hasProjectSection: boolean
): number {
  let score = 0;
  if (hasProjectSection) score += 30;
  if (hasGithub) score += 20;
  if (extractedSkills.length >= 8) score += 25;
  else if (extractedSkills.length >= 5) score += 15;
  else if (extractedSkills.length >= 2) score += 8;
  if (hasProjectSection && extractedSkills.length >= 5) score += 15;
  if (hasGithub && hasProjectSection) score += 10;
  return Math.min(100, score);
}

function generateSuggestions(
  extractedSkills: string[],
  missingSkills: string[],
  completenessScore: number,
  matchScore: number,
  projectQualityScore: number,
  text: string,
  minProjects: number
): ResumeSuggestion[] {
  const suggestions: ResumeSuggestion[] = [];
  const lowerText = text.toLowerCase();

  if (missingSkills.length > 0) {
    const highPriority = missingSkills.slice(0, 3);
    suggestions.push({
      category: "Missing Skills",
      message: `Your resume is missing key skills for this role: ${highPriority.join(", ")}${missingSkills.length > 3 ? `, and ${missingSkills.length - 3} more` : ""}. Consider learning and highlighting these skills.`,
      severity: "high",
    });
  }

  if (!/experience|work|internship|employment/i.test(text)) {
    suggestions.push({
      category: "Experience",
      message: "No work experience section detected. Add any internships, part-time jobs, or relevant work experience.",
      severity: "high",
    });
  }

  if (!/project|portfolio|github|repository/i.test(text)) {
    suggestions.push({
      category: "Projects",
      message: "No projects section found. Add at least " + minProjects + " projects with descriptions of your role and technologies used.",
      severity: "high",
    });
  }

  if (!/education|degree|bachelor|master|b\.tech|m\.tech|university|college/i.test(text)) {
    suggestions.push({
      category: "Education",
      message: "No education section detected. Add your degree, university, and graduation year.",
      severity: "high",
    });
  }

  if (!/contact|email|phone|@/i.test(text)) {
    suggestions.push({
      category: "Contact Info",
      message: "No contact information found. Add your email, phone number, and LinkedIn profile.",
      severity: "medium",
    });
  }

  if (extractedSkills.length < 5) {
    suggestions.push({
      category: "Skills",
      message: "Your resume lists very few skills. Add a dedicated skills section listing technologies you know.",
      severity: "medium",
    });
  }

  if (completenessScore < 60) {
    suggestions.push({
      category: "Completeness",
      message: "Your resume is missing several key sections. Aim for: contact info, summary, experience, education, skills, and projects.",
      severity: "medium",
    });
  }

  if (matchScore < 50) {
    suggestions.push({
      category: "Role Match",
      message: `Your current skills match ${matchScore}% of the target role requirements. Focus on building the missing skills through projects and courses.`,
      severity: "medium",
    });
  }

  if (!/achievement|award|honor|certification/i.test(text)) {
    suggestions.push({
      category: "Achievements",
      message: "No achievements or certifications section found. Highlight any awards, hackathon wins, or certifications.",
      severity: "low",
    });
  }

  if (text.length < 200) {
    suggestions.push({
      category: "Content Length",
      message: "Your resume content seems very short. A typical resume should be 1-2 pages with detailed descriptions.",
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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const targetRole = formData.get("target_role") as string | null;
    const userId = formData.get("user_id") as string | null;

    if (!file || !targetRole || !userId) {
      return new Response(
        JSON.stringify({ error: "Please provide a PDF and target role." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "The resume must be smaller than 5 MB." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authorization = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !supabaseUrl || !anonKey) {
      return new Response(
        JSON.stringify({ error: "Please sign in again and retry." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData } = await authClient.auth.getUser();
    if (!authData.user || authData.user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Your session is no longer valid. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const pdfHeader = new TextDecoder().decode(fileBytes.slice(0, 5));
    if (pdfHeader !== "%PDF-") {
      return new Response(
        JSON.stringify({ error: "The selected file is not a valid PDF." }),
        { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedText = await extractTextFromPDF(fileBytes);

    if (extractedText.length < 20) {
      return new Response(
        JSON.stringify({ error: "Could not extract readable text from this PDF. It may be a scanned image or use non-standard encoding." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) throw new Error("Missing server configuration");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await supabase
      .from("target_role_skills")
      .select("*")
      .eq("role", targetRole)
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Please choose a supported target role." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requiredSkills = roleData.required_skills ?? [];
    const preferredSkills = roleData?.preferred_skills ?? [];
    const minProjects = roleData?.min_projects ?? 2;

    const extractedSkills = extractSkills(extractedText);
    const extractedLower = new Set(extractedSkills.map((s) => s.toLowerCase()));
    const missingSkills = requiredSkills.filter((s) => !extractedLower.has(s.toLowerCase()));

    const hasProjectSection = /project|portfolio|github|repository/i.test(extractedText);
    const hasGithub = /github\.com|github\.io/i.test(extractedText);

    const completenessScore = calculateCompleteness(extractedText, extractedSkills);
    const matchScore = calculateMatchScore(extractedSkills, requiredSkills, preferredSkills);
    const projectQualityScore = calculateProjectQuality(extractedSkills, hasGithub, hasProjectSection);
    const suggestions = generateSuggestions(
      extractedSkills, missingSkills, completenessScore,
      matchScore, projectQualityScore, extractedText, minProjects
    );

    const result: ResumeAnalysisResult = {
      extracted_text: extractedText.substring(0, 10000),
      extracted_skills: extractedSkills,
      missing_skills: missingSkills,
      project_quality_score: projectQualityScore,
      completeness_score: completenessScore,
      match_score: matchScore,
      suggestions,
    };

    const { data: userProjects } = await supabase
      .from("user_projects")
      .select("status, project_id")
      .eq("user_id", userId);

    const completedProjects = (userProjects ?? []).filter((p: { status: string }) => p.status === "completed").length;

    const { error: saveError } = await supabase.from("resume_analyses").insert({
      user_id: userId,
      file_name: file.name,
      target_role: targetRole,
      extracted_text: result.extracted_text,
      extracted_skills: result.extracted_skills,
      missing_skills: result.missing_skills,
      project_quality_score: result.project_quality_score,
      completeness_score: result.completeness_score,
      match_score: result.match_score,
      suggestions: result.suggestions,
    });

    if (saveError) {
      return new Response(
        JSON.stringify({ error: "The analysis completed but could not be saved. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ...result, completed_projects: completedProjects }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error('Resume analysis failed', err);
    return new Response(
      JSON.stringify({ error: "We could not analyze this resume. Please try another PDF." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
