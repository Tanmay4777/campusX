/*
# CampusX — Gamification Engine Schema

## Overview
Extends the database with tables for badges, DSA practice, interviews,
learning activities, and streak tracking. Adds `last_activity_date` to
profiles for streak calculation.

## Profile Changes
- Adds `last_activity_date date` column to track the last day the user
  earned XP (for streak logic).

## New Tables

1. `badges` (catalog)
   - Predefined achievement badges with criteria metadata.
   - Fields: id, slug (unique), name, description, icon_name, category,
     xp_reward, rarity, created_at.

2. `user_badges`
   - Tracks which badges a user has earned and when.
   - Fields: id, user_id, badge_id, earned_at.
   - Unique (user_id, badge_id).

3. `dsa_practice`
   - Log of DSA problems solved by the user.
   - Fields: id, user_id, problem_title, difficulty, topic, xp_earned,
     solved_at.

4. `interviews`
   - Mock interview sessions.
   - Fields: id, user_id, type, topic, score, duration_minutes, xp_earned,
     conducted_at.

5. `learning_activities`
   - General learning activity log (videos watched, articles read, etc.).
   - Fields: id, user_id, activity_type, title, resource_url, duration_minutes,
     xp_earned, completed_at.

6. `streak_log`
   - Daily streak entries — one row per day the user was active.
   - Fields: id, user_id, activity_date (date, unique per user), xp_earned.

## Security — RLS
All tables have RLS enabled with `TO authenticated` and `auth.uid()` ownership
checks. Catalog tables (badges) are read-only for all authenticated users.

## Seed Data
Seeds 16 badges across 5 categories: assessment, streak, project, skill, and
interview badges.
*/

-- ============ Add last_activity_date to profiles ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date date;

-- ============ badges (catalog) ============
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Award',
  category text NOT NULL DEFAULT 'general',
  xp_reward integer NOT NULL DEFAULT 0,
  rarity text NOT NULL DEFAULT 'common',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_badges" ON badges;
CREATE POLICY "read_badges"
  ON badges FOR SELECT TO authenticated
  USING (true);

-- ============ user_badges ============
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_badges" ON user_badges;
CREATE POLICY "select_own_user_badges"
  ON user_badges FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_badges" ON user_badges;
CREATE POLICY "insert_own_user_badges"
  ON user_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_badges" ON user_badges;
CREATE POLICY "delete_own_user_badges"
  ON user_badges FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ dsa_practice ============
CREATE TABLE IF NOT EXISTS dsa_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Easy',
  topic text NOT NULL DEFAULT '',
  xp_earned integer NOT NULL DEFAULT 0,
  solved_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dsa_practice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_dsa_practice" ON dsa_practice;
CREATE POLICY "select_own_dsa_practice"
  ON dsa_practice FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_dsa_practice" ON dsa_practice;
CREATE POLICY "insert_own_dsa_practice"
  ON dsa_practice FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_dsa_practice" ON dsa_practice;
CREATE POLICY "update_own_dsa_practice"
  ON dsa_practice FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_dsa_practice" ON dsa_practice;
CREATE POLICY "delete_own_dsa_practice"
  ON dsa_practice FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ interviews ============
CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'technical',
  topic text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  conducted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interviews" ON interviews;
CREATE POLICY "select_own_interviews"
  ON interviews FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interviews" ON interviews;
CREATE POLICY "insert_own_interviews"
  ON interviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interviews" ON interviews;
CREATE POLICY "update_own_interviews"
  ON interviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interviews" ON interviews;
CREATE POLICY "delete_own_interviews"
  ON interviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ learning_activities ============
CREATE TABLE IF NOT EXISTS learning_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  resource_url text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_learning_activities" ON learning_activities;
CREATE POLICY "select_own_learning_activities"
  ON learning_activities FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_learning_activities" ON learning_activities;
CREATE POLICY "insert_own_learning_activities"
  ON learning_activities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_learning_activities" ON learning_activities;
CREATE POLICY "update_own_learning_activities"
  ON learning_activities FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_learning_activities" ON learning_activities;
CREATE POLICY "delete_own_learning_activities"
  ON learning_activities FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ streak_log ============
CREATE TABLE IF NOT EXISTS streak_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_earned integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, activity_date)
);

ALTER TABLE streak_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streak_log" ON streak_log;
CREATE POLICY "select_own_streak_log"
  ON streak_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streak_log" ON streak_log;
CREATE POLICY "insert_own_streak_log"
  ON streak_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streak_log" ON streak_log;
CREATE POLICY "update_own_streak_log"
  ON streak_log FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_streak_log" ON streak_log;
CREATE POLICY "delete_own_streak_log"
  ON streak_log FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_practice_user_id ON dsa_practice(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_practice_solved_at ON dsa_practice(solved_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_activities_user_id ON learning_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_log_user_id ON streak_log(user_id);
CREATE INDEX IF NOT EXISTS idx_streak_log_activity_date ON streak_log(activity_date DESC);

-- ============ Seed Badges ============
INSERT INTO badges (slug, name, description, icon_name, category, xp_reward, rarity) VALUES
  -- Assessment badges
  ('first_assessment', 'First Steps', 'Complete your first skill assessment', 'Target', 'assessment', 100, 'common'),
  ('assessment_master', 'Assessment Master', 'Score 80%+ on any assessment', 'Award', 'assessment', 200, 'rare'),
  ('all_assessments', 'Scholar', 'Complete all 6 skill assessments', 'GraduationCap', 'assessment', 500, 'epic'),
  ('perfect_score', 'Perfectionist', 'Score 100% on any assessment', 'Star', 'assessment', 300, 'rare'),

  -- Streak badges
  ('streak_3', 'On Fire', 'Maintain a 3-day streak', 'Flame', 'streak', 100, 'common'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak', 200, 'rare'),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', 'Flame', 'streak', 1000, 'legendary'),

  -- DSA badges
  ('dsa_10', 'Problem Solver', 'Solve 10 DSA problems', 'Code', 'dsa', 150, 'common'),
  ('dsa_50', 'Algorithm Wizard', 'Solve 50 DSA problems', 'Boxes', 'dsa', 500, 'epic'),
  ('dsa_hard_5', 'Hard Crusher', 'Solve 5 Hard difficulty problems', 'Swords', 'dsa', 300, 'rare'),

  -- Project badges
  ('first_project', 'Builder', 'Complete your first project', 'FolderKanban', 'project', 150, 'common'),
  ('project_5', 'Project Pro', 'Complete 5 projects', 'Briefcase', 'project', 400, 'rare'),

  -- Skill badges
  ('skill_master', 'Skill Master', 'Reach max proficiency in any skill', 'Zap', 'skill', 300, 'rare'),
  ('polymath', 'Polymath', 'Reach proficiency 3+ in 4 different skills', 'Sparkles', 'skill', 500, 'epic'),

  -- Interview badges
  ('first_interview', 'Breaking the Ice', 'Complete your first mock interview', 'Mic', 'interview', 100, 'common'),
  ('interview_pro', 'Interview Pro', 'Score 80+ in a mock interview', 'Trophy', 'interview', 300, 'rare')
ON CONFLICT (slug) DO NOTHING;
