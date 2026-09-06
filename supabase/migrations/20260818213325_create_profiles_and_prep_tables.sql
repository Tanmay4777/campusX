/*
# CampusX — Initial Schema: Profiles and Learning/Placement Tables

## Overview
Creates the core database schema for CampusX, a gamified placement and learning
platform. The `profiles` table extends Supabase's built-in `auth.users` with
student-specific fields. Additional tables prepare for skills tracking,
assessments, roadmaps, projects, and user progress.

## New Tables

1. `profiles`
   - One row per authenticated user, linked to `auth.users(id)`.
   - Fields: `id` (PK, FK to auth.users), `full_name`, `college`, `branch`,
     `year`, `target_role`, `avatar_url`, `level`, `xp`, `streak`, `created_at`, `updated_at`.
   - Auto-created on signup via a trigger.

2. `skills`
   - Catalog of trackable skills (e.g. React, DSA, Python).
   - Fields: `id`, `name`, `category`, `icon_name`, `max_level`, `created_at`.

3. `user_skills`
   - Per-user skill progress. Links a user to a skill with proficiency + XP.
   - Fields: `id`, `user_id`, `skill_id`, `proficiency`, `xp`, `updated_at`.
   - Unique constraint on (user_id, skill_id).

4. `assessments`
   - Quiz/test definitions tied to a skill.
   - Fields: `id`, `skill_id`, `title`, `description`, `max_score`, `created_at`.

5. `user_assessments`
   - A user's attempt at an assessment with score and XP earned.
   - Fields: `id`, `user_id`, `assessment_id`, `score`, `xp_earned`, `taken_at`.

6. `roadmaps`
   - Learning path templates (e.g. "DSA Foundations").
   - Fields: `id`, `title`, `description`, `estimated_weeks`, `created_at`.

7. `roadmap_phases`
   - Ordered phases within a roadmap.
   - Fields: `id`, `roadmap_id`, `phase_order`, `title`, `description`, `duration`.

8. `user_roadmap_progress`
   - Tracks which phase a user is on within a roadmap.
   - Fields: `id`, `user_id`, `roadmap_id`, `current_phase_id`, `progress_pct`, `updated_at`.

9. `projects`
   - Catalog of guided projects students can build.
   - Fields: `id`, `title`, `description`, `tech_stack` (text[]), `difficulty`,
     `estimated_hours`, `created_at`.

10. `user_projects`
    - Per-user project status and progress.
    - Fields: `id`, `user_id`, `project_id`, `status`, `progress_pct`, `rating`, `updated_at`.

11. `user_activity`
    - Feed of XP-earning actions (skill-up, quiz, project, milestone, badge).
    - Fields: `id`, `user_id`, `activity_type`, `title`, `description`, `xp`, `created_at`.

## Security — RLS Policies

All tables have RLS enabled. Because CampusX has a sign-in screen, all policies
are scoped to `TO authenticated` with `auth.uid()` ownership checks. Owner
columns default to `auth.uid()` so client-side inserts that omit `user_id` still
satisfy the WITH CHECK constraint.

- `profiles`: users can SELECT/UPDATE only their own profile row. INSERT is
  handled by a trigger (no direct user INSERT policy needed), but an INSERT
  policy is included for completeness.
- `skills`, `assessments`, `roadmaps`, `roadmap_phases`, `projects`: these are
  catalog tables — all authenticated users can read them (SELECT). No user-side
  INSERT/UPDATE/DELETE.
- `user_skills`, `user_assessments`, `user_roadmap_progress`, `user_projects`,
  `user_activity`: owner-scoped CRUD — each user can only see and modify their
  own rows.

## Trigger

A `handle_new_user` trigger fires AFTER INSERT on `auth.users` to auto-create a
`profiles` row with defaults, so every new signup has a profile immediately.

## Important Notes

1. Email confirmation is OFF — signups are immediately usable.
2. The `profiles.id` column is both PK and FK to `auth.users(id)` with
   `ON DELETE CASCADE`, so deleting a user cleans up the profile.
3. All `user_*` tables cascade-delete with the user via FK constraints.
*/

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  college text NOT NULL DEFAULT '',
  branch text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '1st',
  target_role text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============ skills (catalog) ============
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Code',
  max_level integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_skills" ON skills;
CREATE POLICY "read_skills"
  ON skills FOR SELECT TO authenticated
  USING (true);

-- ============ user_skills ============
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_skills" ON user_skills;
CREATE POLICY "select_own_user_skills"
  ON user_skills FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_skills" ON user_skills;
CREATE POLICY "insert_own_user_skills"
  ON user_skills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_skills" ON user_skills;
CREATE POLICY "update_own_user_skills"
  ON user_skills FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_skills" ON user_skills;
CREATE POLICY "delete_own_user_skills"
  ON user_skills FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ assessments (catalog) ============
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  max_score integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_assessments" ON assessments;
CREATE POLICY "read_assessments"
  ON assessments FOR SELECT TO authenticated
  USING (true);

-- ============ user_assessments ============
CREATE TABLE IF NOT EXISTS user_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  taken_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_assessments" ON user_assessments;
CREATE POLICY "select_own_user_assessments"
  ON user_assessments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_assessments" ON user_assessments;
CREATE POLICY "insert_own_user_assessments"
  ON user_assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_assessments" ON user_assessments;
CREATE POLICY "update_own_user_assessments"
  ON user_assessments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_assessments" ON user_assessments;
CREATE POLICY "delete_own_user_assessments"
  ON user_assessments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ roadmaps (catalog) ============
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  estimated_weeks integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_roadmaps" ON roadmaps;
CREATE POLICY "read_roadmaps"
  ON roadmaps FOR SELECT TO authenticated
  USING (true);

-- ============ roadmap_phases ============
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  phase_order integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT ''
);

ALTER TABLE roadmap_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_roadmap_phases" ON roadmap_phases;
CREATE POLICY "read_roadmap_phases"
  ON roadmap_phases FOR SELECT TO authenticated
  USING (true);

-- ============ user_roadmap_progress ============
CREATE TABLE IF NOT EXISTS user_roadmap_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id uuid NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  current_phase_id uuid REFERENCES roadmap_phases(id) ON DELETE SET NULL,
  progress_pct integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, roadmap_id)
);

ALTER TABLE user_roadmap_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_roadmap_progress" ON user_roadmap_progress;
CREATE POLICY "select_own_roadmap_progress"
  ON user_roadmap_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_roadmap_progress" ON user_roadmap_progress;
CREATE POLICY "insert_own_roadmap_progress"
  ON user_roadmap_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_roadmap_progress" ON user_roadmap_progress;
CREATE POLICY "update_own_roadmap_progress"
  ON user_roadmap_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_roadmap_progress" ON user_roadmap_progress;
CREATE POLICY "delete_own_roadmap_progress"
  ON user_roadmap_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ projects (catalog) ============
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tech_stack text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'Beginner',
  estimated_hours integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_projects" ON projects;
CREATE POLICY "read_projects"
  ON projects FOR SELECT TO authenticated
  USING (true);

-- ============ user_projects ============
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not-started',
  progress_pct integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_projects" ON user_projects;
CREATE POLICY "select_own_user_projects"
  ON user_projects FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_projects" ON user_projects;
CREATE POLICY "insert_own_user_projects"
  ON user_projects FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_projects" ON user_projects;
CREATE POLICY "update_own_user_projects"
  ON user_projects FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_projects" ON user_projects;
CREATE POLICY "delete_own_user_projects"
  ON user_projects FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ user_activity ============
CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_activity" ON user_activity;
CREATE POLICY "select_own_user_activity"
  ON user_activity FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_activity" ON user_activity;
CREATE POLICY "insert_own_user_activity"
  ON user_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_activity" ON user_activity;
CREATE POLICY "update_own_user_activity"
  ON user_activity FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_activity" ON user_activity;
CREATE POLICY "delete_own_user_activity"
  ON user_activity FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ Auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ updated_at trigger for profiles ============
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_progress_user_id ON user_roadmap_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
