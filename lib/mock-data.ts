export type SkillCategory =
  | 'Programming'
  | 'DSA'
  | 'Web Dev'
  | 'Database'
  | 'System Design'
  | 'Aptitude'
  | 'Soft Skills'
  | 'Cloud';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: number;
  totalLevels: number;
  xp: number;
  xpToNext: number;
  icon: string;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'in-progress' | 'locked';
  progress: number;
  milestones: { id: string; title: string; done: boolean }[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  estimatedHours: number;
  rating: number;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  college: string;
  xp: number;
  level: number;
  streak: number;
  trend: 'up' | 'down' | 'same';
}

export interface PlacementDrive {
  id: string;
  company: string;
  logo: string;
  role: string;
  package: string;
  location: string;
  deadline: string;
  status: 'upcoming' | 'applied' | 'in-review' | 'shortlisted' | 'rejected';
  eligibility: string;
  type: 'Internship' | 'Full-time' | 'PPO';
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  comments: number;
  timeAgo: string;
  category: 'Discussion' | 'Question' | 'Resource' | 'Interview Exp';
}

export interface ActivityItem {
  id: string;
  type: 'skill-up' | 'project' | 'quiz' | 'milestone' | 'badge';
  title: string;
  description: string;
  xp: number;
  timeAgo: string;
}

export const mockUser = {
  name: 'Aarav Sharma',
  email: 'aarav.sharma@campusx.edu',
  avatar: 'AS',
  college: 'IIT Bombay',
  branch: 'Computer Science',
  year: '3rd Year',
  level: 14,
  title: 'Rising Developer',
  xp: 12450,
  xpToNext: 15000,
  rank: 47,
  streak: 23,
  badges: 12,
  projectsCompleted: 8,
  skillsMastered: 15,
  applications: 6,
};

export const mockSkills: Skill[] = [
  { id: 's1', name: 'Data Structures', category: 'DSA', proficiency: 4, totalLevels: 5, xp: 3200, xpToNext: 4000, icon: 'Boxes' },
  { id: 's2', name: 'React', category: 'Web Dev', proficiency: 4, totalLevels: 5, xp: 2800, xpToNext: 3500, icon: 'Atom' },
  { id: 's3', name: 'Python', category: 'Programming', proficiency: 5, totalLevels: 5, xp: 4500, xpToNext: 4500, icon: 'Code' },
  { id: 's4', name: 'SQL', category: 'Database', proficiency: 3, totalLevels: 5, xp: 1800, xpToNext: 2500, icon: 'Database' },
  { id: 's5', name: 'System Design', category: 'System Design', proficiency: 2, totalLevels: 5, xp: 900, xpToNext: 2000, icon: 'Network' },
  { id: 's6', name: 'Aptitude', category: 'Aptitude', proficiency: 3, totalLevels: 5, xp: 1500, xpToNext: 2500, icon: 'Calculator' },
  { id: 's7', name: 'Node.js', category: 'Web Dev', proficiency: 3, totalLevels: 5, xp: 1700, xpToNext: 2500, icon: 'Server' },
  { id: 's8', name: 'Communication', category: 'Soft Skills', proficiency: 4, totalLevels: 5, xp: 2600, xpToNext: 3500, icon: 'MessageCircle' },
  { id: 's9', name: 'AWS', category: 'Cloud', proficiency: 2, totalLevels: 5, xp: 800, xpToNext: 2000, icon: 'Cloud' },
  { id: 's10', name: 'Java', category: 'Programming', proficiency: 4, totalLevels: 5, xp: 3100, xpToNext: 4000, icon: 'Coffee' },
];

export const mockRoadmap: RoadmapPhase[] = [
  {
    id: 'r1',
    title: 'Foundation: Programming Fundamentals',
    description: 'Master core programming concepts, variables, loops, functions, and OOP principles.',
    duration: '4 weeks',
    status: 'completed',
    progress: 100,
    milestones: [
      { id: 'm1', title: 'Complete C++ basics course', done: true },
      { id: 'm2', title: 'Solve 50 basic problems', done: true },
      { id: 'm3', title: 'Build a CLI calculator', done: true },
      { id: 'm4', title: 'OOP mini-project', done: true },
    ],
  },
  {
    id: 'r2',
    title: 'Core: Data Structures & Algorithms',
    description: 'Learn arrays, linked lists, trees, graphs, and dynamic programming with 200+ problems.',
    duration: '8 weeks',
    status: 'in-progress',
    progress: 65,
    milestones: [
      { id: 'm5', title: 'Arrays & Strings (50 problems)', done: true },
      { id: 'm6', title: 'Linked Lists & Stacks (30 problems)', done: true },
      { id: 'm7', title: 'Trees & Graphs (40 problems)', done: false },
      { id: 'm8', title: 'DP & Greedy (30 problems)', done: false },
    ],
  },
  {
    id: 'r3',
    title: 'Specialization: Full-Stack Development',
    description: 'Build production-grade web apps with React, Node.js, and databases.',
    duration: '6 weeks',
    status: 'in-progress',
    progress: 30,
    milestones: [
      { id: 'm9', title: 'React fundamentals', done: true },
      { id: 'm10', title: 'Build a portfolio site', done: false },
      { id: 'm11', title: 'REST API with Node.js', done: false },
      { id: 'm12', title: 'Full-stack capstone project', done: false },
    ],
  },
  {
    id: 'r4',
    title: 'Advanced: System Design & CS Fundamentals',
    description: 'Learn scalability, OS, DBMS, and CN concepts for technical interviews.',
    duration: '6 weeks',
    status: 'locked',
    progress: 0,
    milestones: [
      { id: 'm13', title: 'OS & DBMS concepts', done: false },
      { id: 'm14', title: 'Computer Networks', done: false },
      { id: 'm15', title: 'System design basics', done: false },
      { id: 'm16', title: 'Mock system design interviews', done: false },
    ],
  },
  {
    id: 'r5',
    title: 'Career: Interview Prep & Placement Ready',
    description: 'Resume building, mock interviews, aptitude, and company-specific preparation.',
    duration: '4 weeks',
    status: 'locked',
    progress: 0,
    milestones: [
      { id: 'm17', title: 'ATS-friendly resume', done: false },
      { id: 'm18', title: '10 mock interviews', done: false },
      { id: 'm19', title: 'Aptitude mastery', done: false },
      { id: 'm20', title: 'Apply to 20 companies', done: false },
    ],
  },
];

export const mockProjects: Project[] = [
  { id: 'p1', title: 'E-commerce Platform', description: 'Full-stack store with cart, payments, and admin dashboard.', techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe'], difficulty: 'Advanced', status: 'in-progress', progress: 70, estimatedHours: 40, rating: 0 },
  { id: 'p2', title: 'Real-time Chat App', description: 'WebSocket-based messaging with rooms and presence.', techStack: ['React', 'Socket.io', 'Express'], difficulty: 'Intermediate', status: 'completed', progress: 100, estimatedHours: 20, rating: 4.5 },
  { id: 'p3', title: 'Task Manager CLI', description: 'Command-line task management with persistence.', techStack: ['Python', 'SQLite'], difficulty: 'Beginner', status: 'completed', progress: 100, estimatedHours: 8, rating: 4.0 },
  { id: 'p4', title: 'AI Image Classifier', description: 'CNN-based image classification with transfer learning.', techStack: ['Python', 'TensorFlow', 'Flask'], difficulty: 'Advanced', status: 'not-started', progress: 0, estimatedHours: 30, rating: 0 },
  { id: 'p5', title: 'Weather Dashboard', description: 'Real-time weather with forecasts and location search.', techStack: ['React', 'OpenWeather API', 'Tailwind'], difficulty: 'Beginner', status: 'completed', progress: 100, estimatedHours: 6, rating: 4.2 },
  { id: 'p6', title: 'Blog Platform', description: 'Markdown blog with auth, comments, and SEO.', techStack: ['Next.js', 'Prisma', 'PostgreSQL'], difficulty: 'Intermediate', status: 'not-started', progress: 0, estimatedHours: 25, rating: 0 },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { id: 'l1', rank: 1, name: 'Priya Patel', avatar: 'PP', college: 'IIT Delhi', xp: 28400, level: 22, streak: 87, trend: 'same' },
  { id: 'l2', rank: 2, name: 'Rohan Verma', avatar: 'RV', college: 'BITS Pilani', xp: 26100, level: 21, streak: 64, trend: 'up' },
  { id: 'l3', rank: 3, name: 'Sneha Reddy', avatar: 'SR', college: 'IIT Bombay', xp: 24800, level: 20, streak: 52, trend: 'up' },
  { id: 'l4', rank: 4, name: 'Arjun Nair', avatar: 'AN', college: 'NIT Trichy', xp: 22100, level: 19, streak: 41, trend: 'down' },
  { id: 'l5', rank: 5, name: 'Ishita Gupta', avatar: 'IG', college: 'IIIT Hyderabad', xp: 20500, level: 18, streak: 38, trend: 'up' },
  { id: 'l6', rank: 6, name: 'Karan Mehta', avatar: 'KM', college: 'VIT Vellore', xp: 18900, level: 17, streak: 29, trend: 'down' },
  { id: 'l7', rank: 8, name: 'Aditya Joshi', avatar: 'AJ', college: 'IIT Madras', xp: 16800, level: 16, streak: 31, trend: 'up' },
  { id: 'l8', rank: 12, name: 'Neha Singh', avatar: 'NS', college: 'DTU', xp: 14500, level: 15, streak: 26, trend: 'same' },
  { id: 'l9', rank: 47, name: 'Aarav Sharma', avatar: 'AS', college: 'IIT Bombay', xp: 12450, level: 14, streak: 23, trend: 'up' },
  { id: 'l10', rank: 58, name: 'Vikram Rao', avatar: 'VR', college: 'NIT Surathkal', xp: 11200, level: 13, streak: 18, trend: 'down' },
];

export const mockPlacements: PlacementDrive[] = [
  { id: 'd1', company: 'Google', logo: 'G', role: 'SWE Intern', package: '₹80,000/mo', location: 'Bangalore', deadline: '3 days left', status: 'applied', eligibility: 'CGPA 8+', type: 'Internship' },
  { id: 'd2', company: 'Amazon', logo: 'A', role: 'SDE-1', package: '₹18 LPA', location: 'Hyderabad', deadline: '7 days left', status: 'shortlisted', eligibility: 'CGPA 7.5+', type: 'Full-time' },
  { id: 'd3', company: 'Microsoft', logo: 'M', role: 'Software Engineer', package: '₹22 LPA', location: 'Bangalore', deadline: '5 days left', status: 'upcoming', eligibility: 'CGPA 8+', type: 'Full-time' },
  { id: 'd4', company: 'Meta', logo: 'M', role: 'Production Engineer', package: '₹25 LPA', location: 'Remote', deadline: '10 days left', status: 'upcoming', eligibility: 'CGPA 8.5+', type: 'Full-time' },
  { id: 'd5', company: 'Goldman Sachs', logo: 'GS', role: 'Technology Analyst', package: '₹16 LPA', location: 'Mumbai', deadline: 'Closed', status: 'rejected', eligibility: 'CGPA 7+', type: 'Full-time' },
  { id: 'd6', company: 'Atlassian', logo: 'A', role: 'Backend Intern', package: '₹60,000/mo', location: 'Bangalore', deadline: '4 days left', status: 'in-review', eligibility: 'CGPA 7.5+', type: 'Internship' },
  { id: 'd7', company: 'Zomato', logo: 'Z', role: 'Full Stack Developer', package: '₹14 LPA', location: 'Gurgaon', deadline: '8 days left', status: 'upcoming', eligibility: 'CGPA 7+', type: 'PPO' },
  { id: 'd8', company: 'Swiggy', logo: 'S', role: 'Frontend Engineer', package: '₹13 LPA', location: 'Bangalore', deadline: '6 days left', status: 'upcoming', eligibility: 'CGPA 7+', type: 'Full-time' },
];

export const mockCommunity: CommunityPost[] = [
  { id: 'c1', author: 'Priya Patel', avatar: 'PP', title: 'Google SWE Intern Interview Experience', content: 'Had my Google interview last week. 3 rounds — 2 DSA and 1 Googlyness. The DSA questions were medium-hard...', tags: ['Interview', 'Google', 'Internship'], upvotes: 342, comments: 28, timeAgo: '2h ago', category: 'Interview Exp' },
  { id: 'c2', author: 'Rohan Verma', avatar: 'RV', title: 'Best resources for System Design prep?', content: 'I have Amazon interviews coming up. What are the best free resources for system design? I already read Grokking...', tags: ['System Design', 'Interview', 'Resources'], upvotes: 189, comments: 15, timeAgo: '5h ago', category: 'Question' },
  { id: 'c3', author: 'Sneha Reddy', avatar: 'SR', title: 'My DP cheat sheet (200 problems solved)', content: 'After solving 200+ DP problems, I created a categorized cheat sheet. Here are the patterns I found...', tags: ['DSA', 'DP', 'Resources'], upvotes: 521, comments: 42, timeAgo: '8h ago', category: 'Resource' },
  { id: 'c4', author: 'Arjun Nair', avatar: 'AN', title: 'How to maintain consistency while prepping?', content: 'I keep starting and stopping my prep. How do you all stay consistent? Any tips for building a streak?', tags: ['Motivation', 'Tips'], upvotes: 98, comments: 11, timeAgo: '1d ago', category: 'Discussion' },
  { id: 'c5', author: 'Ishita Gupta', avatar: 'IG', title: 'Amazon OA questions shared', content: 'Just completed my Amazon OA. Two problems — one on arrays and one on trees. Sharing my approach...', tags: ['Amazon', 'OA', 'Interview'], upvotes: 267, comments: 19, timeAgo: '1d ago', category: 'Interview Exp' },
  { id: 'c6', author: 'Karan Mehta', avatar: 'KM', title: 'Free React + Node.js project course', content: 'Found a great free course that walks through building a full-stack app from scratch. Sharing the link...', tags: ['Web Dev', 'React', 'Free'], upvotes: 145, comments: 8, timeAgo: '2d ago', category: 'Resource' },
];

export const mockActivity: ActivityItem[] = [
  { id: 'a1', type: 'skill-up', title: 'React proficiency increased', description: 'Reached Level 4 in React', xp: 200, timeAgo: '2 hours ago' },
  { id: 'a2', type: 'project', title: 'Project milestone reached', description: 'E-commerce Platform — 70% complete', xp: 150, timeAgo: '5 hours ago' },
  { id: 'a3', type: 'quiz', title: 'Quiz completed', description: 'DSA: Trees & Graphs — scored 85%', xp: 100, timeAgo: '1 day ago' },
  { id: 'a4', type: 'badge', title: 'New badge unlocked', description: '23-Day Streak — Consistency Champion', xp: 300, timeAgo: '1 day ago' },
  { id: 'a5', type: 'milestone', title: 'Roadmap milestone completed', description: 'Linked Lists & Stacks (30 problems)', xp: 250, timeAgo: '2 days ago' },
  { id: 'a6', type: 'skill-up', title: 'SQL proficiency increased', description: 'Reached Level 3 in SQL', xp: 200, timeAgo: '3 days ago' },
];

export const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Skills', href: '/dashboard/skills', icon: 'Swords' },
  { label: 'Roadmap', href: '/dashboard/roadmap', icon: 'Map' },
  { label: 'Projects', href: '/dashboard/projects', icon: 'FolderKanban' },
  { label: 'Resume', href: '/dashboard/resume', icon: 'FileText' },
  { label: 'Interview', href: '/dashboard/interview', icon: 'Mic' },
  { label: 'Community', href: '/dashboard/community', icon: 'Users' },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: 'Trophy' },
  { label: 'Placements', href: '/dashboard/placements', icon: 'Briefcase' },
] as const;
