import { supabase } from '@/lib/supabase/client';
import type { TargetRoleSkills } from '@/lib/database.types';

export interface SkillGap {
  skill: string;
  isRequired: boolean;
  isPreferred: boolean;
  hasSkill: boolean;
  proficiency: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

export interface RecommendedLearningTopic {
  id: string;
  slug: string;
  title: string;
  skill: string;
  difficulty: string;
  estimated_minutes: number;
  status: string;
  reason: string;
}

export interface RecommendedProject {
  id: string;
  title: string;
  difficulty: string;
  tech_stack: string[];
  xp_reward: number;
  userStatus: string;
  matchCount: number;
  reason: string;
}

export interface GapAnalysisResult {
  targetRole: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  partialSkills: string[];
  gaps: SkillGap[];
  recommendedTopics: RecommendedLearningTopic[];
  recommendedProjects: RecommendedProject[];
  error: string | null;
}

const SEMANTIC_ALIASES: Record<string, string[]> = {
  'JavaScript': ['JS', 'Node.js', 'Node', 'ES6', 'ECMAScript', 'React', 'Next.js', 'Vue', 'Angular', 'jQuery'],
  'TypeScript': ['TS', 'tsc'],
  'React': ['ReactJS', 'React.js', 'JSX', 'Redux', 'Hooks', 'Next.js', 'React Native'],
  'Node.js': ['Node', 'NodeJS', 'Express', 'NestJS', 'Fastify', 'npm', 'yarn'],
  'Python': ['py', 'Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'pip'],
  'Java': ['JVM', 'Spring', 'Spring Boot', 'Maven', 'Gradle', 'JPA', 'Hibernate'],
  'SQL': ['MySQL', 'PostgreSQL', 'Postgres', 'SQLite', 'MariaDB', 'Database', 'Query', 'T-SQL'],
  'PostgreSQL': ['Postgres', 'pg', 'psql'],
  'HTML': ['HTML5', 'Semantic HTML', 'Markup'],
  'CSS': ['CSS3', 'Flexbox', 'Grid', 'SASS', 'SCSS', 'Tailwind', 'Bootstrap', 'Styled Components'],
  'Tailwind': ['TailwindCSS', 'Tailwind CSS'],
  'Git': ['GitHub', 'GitLab', 'Bitbucket', 'Version Control', 'Gitting'],
  'Docker': ['Container', 'Containerization', 'Dockerfile', 'Docker Compose', 'docker-compose'],
  'AWS': ['Amazon Web Services', 'EC2', 'S3', 'Lambda', 'IAM', 'RDS', 'CloudFront', 'ECS'],
  'REST API': ['REST', 'RESTful', 'API', 'Endpoint', 'HTTP', 'OpenAPI', 'Swagger'],
  'Testing': ['Unit Test', 'JUnit', 'Jest', 'Mocha', 'PyTest', 'Selenium', 'Cypress', 'TestNG', 'Integration Test', 'E2E'],
  'Machine Learning': ['ML', 'Scikit-learn', 'sklearn', 'Model Training', 'Predictive Modeling', 'Feature Engineering'],
  'Deep Learning': ['TensorFlow', 'PyTorch', 'Keras', 'Neural Network', 'Neural Net', 'Deep Net'],
  'Data Structures': ['Array', 'Linked List', 'Tree', 'Graph', 'Stack', 'Queue', 'Hash Table', 'Heap', 'Trie'],
  'Algorithms': ['Algorithm', 'Sorting', 'Searching', 'Dynamic Programming', 'Time Complexity', 'Big O', 'Greedy', 'Backtracking'],
  'OOP': ['Object-Oriented', 'Object Oriented Programming', 'Encapsulation', 'Inheritance', 'Polymorphism', 'Abstraction'],
  'Linux': ['Unix', 'Bash', 'Shell', 'Ubuntu', 'Debian', 'CentOS', 'Shell Scripting'],
  'CI/CD': ['Continuous Integration', 'Continuous Deployment', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Pipeline', 'CircleCI'],
  'Kubernetes': ['K8s', 'kubectl', 'Helm', 'K8s Cluster', 'Pod', 'Deployment'],
  'Redis': ['Cache', 'Caching', 'Redis Cache', 'In-Memory Store'],
  'Microservices': ['Microservice', 'Micro-service', 'Service-Oriented', 'SOA', 'Distributed Services'],
  'Authentication': ['Auth', 'JWT', 'OAuth', 'OAuth2', 'SSO', 'Session Management', 'Login', 'Auth0', 'Firebase Auth'],
  'Pandas': ['DataFrame', 'Data Manipulation', 'pandas'],
  'Statistics': ['Statistical', 'Probability', 'Regression', 'Hypothesis Testing', 'Bayesian', 'Descriptive Statistics'],
  'NLP': ['Natural Language Processing', 'Text Processing', 'Sentiment Analysis', 'Tokenization', 'Word2Vec'],
  'Data Visualization': ['Visualization', 'Matplotlib', 'Seaborn', 'Plotly', 'D3.js', 'D3', 'Chart.js', 'Tableau', 'PowerBI'],
  'Kotlin': ['kt', 'Kotlin Coroutines'],
  'Android': ['Android SDK', 'Android Studio', 'Jetpack', 'Material Design'],
  'Swift': ['iOS', 'Xcode', 'SwiftUI', 'Combine'],
  'Flutter': ['Dart', 'Flutter SDK', 'Widget'],
  'C++': ['cpp', 'C Plus Plus', 'STL', 'Boost'],
  'System Design': ['Scalability', 'Distributed Systems', 'Load Balancing', 'CAP Theorem', 'Sharding', 'Caching Strategy'],
  'Terraform': ['Infrastructure as Code', 'IaC', 'Terraform Cloud'],
  'UI Design': ['Figma', 'Sketch', 'Adobe XD', 'Wireframing', 'Prototyping', 'User Interface'],
  'GraphQL': ['GQL', 'Apollo', 'Hasura', 'Prisma'],
  'MongoDB': ['Mongo', 'NoSQL', 'Mongoose', 'Document Database'],
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

export function normalizeSkill(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return REVERSE_ALIAS_MAP.get(lower) ?? raw.trim();
}

export function semanticMatch(studentSkill: string, targetSkill: string): boolean {
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

function calculatePriority(
  skill: string,
  isRequired: boolean,
  isPreferred: boolean,
  hasSkill: boolean,
  proficiency: number,
  minProficiency: number
): SkillGap['priority'] {
  if (hasSkill && proficiency >= minProficiency) return 'low';

  if (!hasSkill) {
    if (isRequired) return 'critical';
    if (isPreferred) return 'medium';
    return 'low';
  }

  if (proficiency < minProficiency) {
    if (isRequired) return 'high';
    if (isPreferred) return 'medium';
    return 'low';
  }

  return 'low';
}

export async function analyzeSkillGap(
  userId: string,
  targetRole: string
): Promise<GapAnalysisResult> {
  const empty: GapAnalysisResult = {
    targetRole,
    matchScore: 0,
    matchedSkills: [],
    missingSkills: [],
    partialSkills: [],
    gaps: [],
    recommendedTopics: [],
    recommendedProjects: [],
    error: null,
  };

  const { data: roleData, error: roleError } = await supabase
    .from('target_role_skills')
    .select('*')
    .eq('role', targetRole)
    .maybeSingle();

  if (roleError || !roleData) {
    return { ...empty, error: roleError?.message ?? 'Target role not found' };
  }

  const roleSkills = roleData as TargetRoleSkills;
  const requiredSkills = roleSkills.required_skills;
  const preferredSkills = roleSkills.preferred_skills;

  const { data: userSkills, error: userSkillsError } = await supabase
    .from('user_skills')
    .select('skill_id, proficiency, xp')
    .eq('user_id', userId);

  if (userSkillsError) {
    return { ...empty, error: userSkillsError.message };
  }

  const { data: skillRows } = await supabase
    .from('skills')
    .select('id, name, category, max_level')
    .in('id', (userSkills ?? []).map((us) => us.skill_id));

  const skillNameMap = new Map<string, { proficiency: number; maxLevel: number }>();
  for (const us of userSkills ?? []) {
    const skill = (skillRows ?? []).find((s) => s.id === us.skill_id);
    if (skill) {
      skillNameMap.set(skill.name, {
        proficiency: us.proficiency,
        maxLevel: skill.max_level,
      });
    }
  }

  const { data: latestResume } = await supabase
    .from('resume_analyses')
    .select('extracted_skills')
    .eq('user_id', userId)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const resumeSkills = new Set<string>((latestResume?.extracted_skills ?? []).map(normalizeSkill));

  const allTargetSkills = Array.from(new Set([...requiredSkills, ...preferredSkills]));
  const gaps: SkillGap[] = [];
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const partialSkills: string[] = [];
  const minProficiency = 3;

  for (const targetSkill of allTargetSkills) {
    const isRequired = requiredSkills.includes(targetSkill);
    const isPreferred = preferredSkills.includes(targetSkill);

    let hasSkill = false;
    let proficiency = 0;

    for (const [studentSkillName, info] of Array.from(skillNameMap.entries())) {
      if (semanticMatch(studentSkillName, targetSkill)) {
        hasSkill = true;
        proficiency = info.proficiency;
        break;
      }
    }

    if (!hasSkill && resumeSkills.has(normalizeSkill(targetSkill))) {
      hasSkill = true;
      proficiency = 2;
    }

    const priority = calculatePriority(
      targetSkill, isRequired, isPreferred, hasSkill, proficiency, minProficiency
    );

    let reason = '';
    if (!hasSkill) {
      reason = isRequired
        ? `Required skill for ${targetRole} — not yet acquired`
        : `Preferred skill for ${targetRole} — not yet acquired`;
      missingSkills.push(targetSkill);
    } else if (proficiency < minProficiency) {
      reason = `Current level ${proficiency} — need level ${minProficiency}+ for ${targetRole}`;
      partialSkills.push(targetSkill);
    } else {
      reason = `Achieved level ${proficiency} — meets ${targetRole} requirements`;
      matchedSkills.push(targetSkill);
    }

    gaps.push({
      skill: targetSkill,
      isRequired,
      isPreferred,
      hasSkill,
      proficiency,
      priority,
      reason,
    });
  }

  gaps.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const reqTotal = requiredSkills.length;
  const reqMatched = requiredSkills.filter((s) =>
    gaps.find((g) => g.skill === s && g.hasSkill && g.proficiency >= minProficiency)
  ).length;
  const prefTotal = preferredSkills.length;
  const prefMatched = preferredSkills.filter((s) =>
    gaps.find((g) => g.skill === s && g.hasSkill && g.proficiency >= minProficiency)
  ).length;
  const matchScore = Math.round(
    (reqMatched / Math.max(reqTotal, 1)) * 70 + (prefTotal > 0 ? (prefMatched / prefTotal) * 30 : 30)
  );

  const skillsToLearn = gaps
    .filter((g) => g.priority === 'critical' || g.priority === 'high')
    .map((g) => g.skill);

  const { data: topics } = await supabase
    .from('learning_topics')
    .select('id, slug, title, skill, difficulty, estimated_minutes, tags')
    .order('order_index');

  const { data: topicProgress } = await supabase
    .from('user_learning_progress')
    .select('topic_id, status')
    .eq('user_id', userId);
  const progressMap = new Map<string, string>();
  for (const p of topicProgress ?? []) {
    progressMap.set(p.topic_id, p.status);
  }

  const recommendedTopics: RecommendedLearningTopic[] = [];
  if (topics) {
    const topicScore = (topic: typeof topics[0]): number => {
      let score = 0;
      if (skillsToLearn.includes(topic.skill)) score += 10;
      const topicSkillNorm = normalizeSkill(topic.skill);
      for (const needed of skillsToLearn) {
        if (semanticMatch(topicSkillNorm, needed)) score += 8;
      }
      if (topic.tags) {
        for (const tag of topic.tags) {
          const tagNorm = normalizeSkill(tag);
          if (skillsToLearn.some((s) => semanticMatch(tagNorm, s))) score += 5;
        }
      }
      const status = progressMap.get(topic.id) ?? 'not-started';
      if (status === 'completed') score -= 100;
      else if (status === 'in_progress') score -= 5;
      return score;
    };

    const scored = topics
      .map((t) => ({ topic: t, score: topicScore(t) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    for (const { topic } of scored) {
      const status = progressMap.get(topic.id) ?? 'not-started';
      const statusLabel = status === 'completed' ? 'completed' : status === 'in_progress' ? 'in-progress' : 'not-started';
      const neededSkill = skillsToLearn.find((s) =>
        semanticMatch(normalizeSkill(topic.skill), s)
      );
      recommendedTopics.push({
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        skill: topic.skill,
        difficulty: topic.difficulty,
        estimated_minutes: topic.estimated_minutes,
        status: statusLabel,
        reason: neededSkill
          ? `Builds ${neededSkill} — a ${gaps.find((g) => g.skill === neededSkill)?.priority} priority gap`
          : `Strengthens skills needed for ${targetRole}`,
      });
    }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, difficulty, tech_stack, required_skills, xp_reward, category')
    .order('order_index');

  const { data: userProjects } = await supabase
    .from('user_projects')
    .select('project_id, status')
    .eq('user_id', userId);
  const userProjectMap = new Map<string, string>();
  for (const up of userProjects ?? []) {
    userProjectMap.set(up.project_id, up.status);
  }

  const recommendedProjects: RecommendedProject[] = [];
  if (projects) {
    const projectScore = (project: typeof projects[0]): { score: number; matchCount: number } => {
      let matchCount = 0;
      let score = 0;
      const allProjectSkills = [
        ...(project.required_skills ?? []),
        ...(project.tech_stack ?? []),
      ];
      for (const ps of allProjectSkills) {
        const psNorm = normalizeSkill(ps);
        for (const needed of skillsToLearn) {
          if (semanticMatch(psNorm, needed)) {
            matchCount++;
            score += 10;
          }
        }
      }
      const status = userProjectMap.get(project.id) ?? 'not-started';
      if (status === 'completed') score -= 50;
      else if (status === 'in-progress') score -= 10;
      return { score, matchCount };
    };

    const scoredProjects = projects
      .map((p) => {
        const { score, matchCount } = projectScore(p);
        return { project: p, score, matchCount };
      })
      .filter((x) => x.score > 0 && x.matchCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    for (const { project, matchCount } of scoredProjects) {
      const status = userProjectMap.get(project.id) ?? 'not-started';
      const statusLabel = status === 'completed' ? 'completed' : status === 'in-progress' ? 'in-progress' : 'not-started';
      recommendedProjects.push({
        id: project.id,
        title: project.title,
        difficulty: project.difficulty,
        tech_stack: project.tech_stack,
        xp_reward: project.xp_reward,
        userStatus: statusLabel,
        matchCount,
        reason: `Matches ${matchCount} skill${matchCount !== 1 ? 's' : ''} you need for ${targetRole}`,
      });
    }
  }

  return {
    targetRole,
    matchScore: Math.min(100, matchScore),
    matchedSkills,
    missingSkills,
    partialSkills,
    gaps,
    recommendedTopics,
    recommendedProjects,
    error: null,
  };
}
