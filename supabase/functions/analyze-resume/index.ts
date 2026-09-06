import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

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

function extractTextFromPDF(bytes: Uint8Array): string {
  let text = "";
  let i = 0;
  while (i < bytes.length) {
    if (bytes[i] === 0x28) {
      let depth = 1;
      const start = i + 1;
      i++;
      while (i < bytes.length && depth > 0) {
        if (bytes[i] === 0x28) depth++;
        else if (bytes[i] === 0x29) depth--;
        if (depth > 0) i++;
      }
      const content = new TextDecoder("latin1").decode(bytes.slice(start, i));
      if (content.includes("BT")) {
        const textMatches = content.match(/\(([^)]*)\)/g);
        if (textMatches) {
          for (const m of textMatches) {
            text += m.slice(1, -1) + " ";
          }
        }
      }
    }
    i++;
  }
  return text.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
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
        JSON.stringify({ error: "Missing required fields: file, target_role, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const extractedText = extractTextFromPDF(fileBytes);

    if (extractedText.length < 20) {
      return new Response(
        JSON.stringify({ error: "Could not extract readable text from this PDF. It may be a scanned image or use non-standard encoding." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await supabase
      .from("target_role_skills")
      .select("*")
      .eq("role", targetRole)
      .maybeSingle();

    const requiredSkills = roleData?.required_skills ?? [];
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

    await supabase.from("resume_analyses").insert({
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

    return new Response(
      JSON.stringify({ ...result, completed_projects: completedProjects }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during resume analysis.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
