/*
# CampusX — Project GitHub Verification Storage

## Overview
Adds a `project_verifications` table to persist the results of GitHub
repository analysis. When a student submits a GitHub URL, an edge function
analyzes the repo metadata and stores the analysis here so the student can
review their Project Quality Score and improvement suggestions across
sessions.

## New Table

1. `project_verifications`
   - One row per (user_id, project_id) — updated on each re-analysis.
   - Fields:
     - `id` (uuid PK)
     - `user_id` (uuid, FK to auth.users, CASCADE)
     - `project_id` (uuid, FK to projects, CASCADE)
     - `repo_url` (text) — the GitHub URL that was analyzed
     - `repo_name` (text) — repository name from GitHub API
     - `repo_full_name` (text) — owner/repo from GitHub API
     - `description` (text) — repo description from GitHub
     - `stars` (integer) — star count
     - `forks` (integer) — fork count
     - `open_issues` (integer) — open issue count
     - `languages` (jsonb) — { "JavaScript": 12345, "HTML": 5000, ... }
     - `has_readme` (boolean) — README file present
     - `has_tests` (boolean) — test files/directories detected
     - `has_docker` (boolean) — Dockerfile or docker-compose present
     - `has_ci` (boolean) — CI config detected (.github/workflows, etc.)
     - `source_file_count` (integer) — count of source files in the tree
     - `license` (text) — license name if detected, else ''
     - `quality_score` (integer) — 0-100 overall project quality score
     - `suggestions` (jsonb) — array of { category, message, severity }
     - `analyzed_at` (timestamptz) — when the analysis was run
   - UNIQUE(user_id, project_id) — one analysis per user+project, upserted

## Security — RLS

The app has a sign-in screen, so RLS is enabled and scoped to `authenticated`
with `auth.uid()` ownership checks. Four separate CRUD policies (SELECT,
INSERT, UPDATE, DELETE) following the same pattern as other user_* tables.

## Important Notes
1. `user_id` defaults to `auth.uid()` so client-side inserts that omit it
   still satisfy the WITH CHECK constraint.
2. The edge function will use the service role key to write verification
   results — but since the function runs server-side, RLS does not apply to
   its writes. However, the frontend reads/writes are still protected by RLS.
3. Idempotent — safe to re-run.
*/

CREATE TABLE IF NOT EXISTS project_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repo_url text NOT NULL DEFAULT '',
  repo_name text NOT NULL DEFAULT '',
  repo_full_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  stars integer NOT NULL DEFAULT 0,
  forks integer NOT NULL DEFAULT 0,
  open_issues integer NOT NULL DEFAULT 0,
  languages jsonb NOT NULL DEFAULT '{}'::jsonb,
  has_readme boolean NOT NULL DEFAULT false,
  has_tests boolean NOT NULL DEFAULT false,
  has_docker boolean NOT NULL DEFAULT false,
  has_ci boolean NOT NULL DEFAULT false,
  source_file_count integer NOT NULL DEFAULT 0,
  license text NOT NULL DEFAULT '',
  quality_score integer NOT NULL DEFAULT 0,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  analyzed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE project_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_project_verifications" ON project_verifications;
CREATE POLICY "select_own_project_verifications"
  ON project_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_project_verifications" ON project_verifications;
CREATE POLICY "insert_own_project_verifications"
  ON project_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_project_verifications" ON project_verifications;
CREATE POLICY "update_own_project_verifications"
  ON project_verifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_project_verifications" ON project_verifications;
CREATE POLICY "delete_own_project_verifications"
  ON project_verifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_verifications_user_id ON project_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_project_verifications_project_id ON project_verifications(project_id);
