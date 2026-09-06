export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  iconName: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { slug: 'first_assessment', name: 'First Steps', description: 'Complete your first skill assessment', iconName: 'Target', category: 'assessment', rarity: 'common', xpReward: 100 },
  { slug: 'assessment_master', name: 'Assessment Master', description: 'Score 80%+ on any assessment', iconName: 'Award', category: 'assessment', rarity: 'rare', xpReward: 200 },
  { slug: 'all_assessments', name: 'Scholar', description: 'Complete all 6 skill assessments', iconName: 'GraduationCap', category: 'assessment', rarity: 'epic', xpReward: 500 },
  { slug: 'perfect_score', name: 'Perfectionist', description: 'Score 100% on any assessment', iconName: 'Star', category: 'assessment', rarity: 'rare', xpReward: 300 },

  { slug: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', iconName: 'Flame', category: 'streak', rarity: 'common', xpReward: 100 },
  { slug: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', iconName: 'Flame', category: 'streak', rarity: 'rare', xpReward: 200 },
  { slug: 'streak_30', name: 'Unstoppable', description: 'Maintain a 30-day streak', iconName: 'Flame', category: 'streak', rarity: 'legendary', xpReward: 1000 },

  { slug: 'dsa_10', name: 'Problem Solver', description: 'Solve 10 DSA problems', iconName: 'Code', category: 'dsa', rarity: 'common', xpReward: 150 },
  { slug: 'dsa_50', name: 'Algorithm Wizard', description: 'Solve 50 DSA problems', iconName: 'Boxes', category: 'dsa', rarity: 'epic', xpReward: 500 },
  { slug: 'dsa_hard_5', name: 'Hard Crusher', description: 'Solve 5 Hard difficulty problems', iconName: 'Swords', category: 'dsa', rarity: 'rare', xpReward: 300 },

  { slug: 'first_project', name: 'Builder', description: 'Complete your first project', iconName: 'FolderKanban', category: 'project', rarity: 'common', xpReward: 150 },
  { slug: 'project_5', name: 'Project Pro', description: 'Complete 5 projects', iconName: 'Briefcase', category: 'project', rarity: 'rare', xpReward: 400 },

  { slug: 'skill_master', name: 'Skill Master', description: 'Reach max proficiency in any skill', iconName: 'Zap', category: 'skill', rarity: 'rare', xpReward: 300 },
  { slug: 'polymath', name: 'Polymath', description: 'Reach proficiency 3+ in 4 different skills', iconName: 'Sparkles', category: 'skill', rarity: 'epic', xpReward: 500 },

  { slug: 'first_interview', name: 'Breaking the Ice', description: 'Complete your first mock interview', iconName: 'Mic', category: 'interview', rarity: 'common', xpReward: 100 },
  { slug: 'interview_pro', name: 'Interview Pro', description: 'Score 80+ in a mock interview', iconName: 'Trophy', category: 'interview', rarity: 'rare', xpReward: 300 },
];

export const RARITY_COLORS: Record<string, { border: string; bg: string; text: string; label: string }> = {
  common: { border: 'border-muted-foreground/30', bg: 'bg-muted/20', text: 'text-muted-foreground', label: 'Common' },
  rare: { border: 'border-primary/40', bg: 'bg-primary/10', text: 'text-primary', label: 'Rare' },
  epic: { border: 'border-accent/40', bg: 'bg-accent/10', text: 'text-accent', label: 'Epic' },
  legendary: { border: 'border-warning/50', bg: 'bg-warning/10', text: 'text-warning', label: 'Legendary' },
};

export function getBadgeBySlug(slug: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.slug === slug);
}
