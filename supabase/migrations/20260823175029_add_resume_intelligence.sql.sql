/*
# CampusX — Resume Intelligence Module

## Overview
Adds tables to persist resume analysis results and a target-role skill
expectation matrix. Students upload a PDF resume, select a target role,
and the system extracts text, identifies skills, compares against the
role's expected skills, and produces a match score with improvement
suggestions.

## New Tables

1. `target_role_skills`
   - Catalog of expected skills per target role.
   - Fields: id, role, required_skills (text[]), preferred_skills (text[]),
     min_projects (int), created_at.
   - Seeded with 8 common roles.

2. `resume_analyses`
   - One row per analysis run (user can have multiple over time).
   - Fields: id, user_id, file_name, target_role, extracted_text (text),
     extracted_skills (text[]), missing_skills (text[]),
     project_quality_score (int 0-100), completeness_score (int 0-100),
     match_score (int 0-100), suggestions (jsonb), analyzed_at.
   - RLS: owner-scoped to authenticated user via auth.uid().

## Security — RLS
- `target_role_skills`: public read for authenticated (catalog).
- `resume_analyses`: owner-scoped CRUD via auth.uid() = user_id.
*/

CREATE TABLE IF NOT EXISTS target_role_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  min_projects integer NOT NULL DEFAULT 2,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE target_role_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_target_role_skills" ON target_role_skills;
CREATE POLICY "select_target_role_skills"
  ON target_role_skills FOR SELECT TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS resume_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  target_role text NOT NULL DEFAULT '',
  extracted_text text NOT NULL DEFAULT '',
  extracted_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  project_quality_score integer NOT NULL DEFAULT 0,
  completeness_score integer NOT NULL DEFAULT 0,
  match_score integer NOT NULL DEFAULT 0,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_resume_analyses" ON resume_analyses;
CREATE POLICY "select_own_resume_analyses"
  ON resume_analyses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_resume_analyses" ON resume_analyses;
CREATE POLICY "insert_own_resume_analyses"
  ON resume_analyses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_resume_analyses" ON resume_analyses;
CREATE POLICY "update_own_resume_analyses"
  ON resume_analyses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_resume_analyses" ON resume_analyses;
CREATE POLICY "delete_own_resume_analyses"
  ON resume_analyses FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_target_role ON resume_analyses(target_role);

INSERT INTO target_role_skills (role, required_skills, preferred_skills, min_projects) VALUES
  ('Frontend Developer', ARRAY['JavaScript','React','HTML','CSS','Git','REST API'], ARRAY['TypeScript','Next.js','Tailwind','Redux','Testing','Webpack'], 2),
  ('Backend Developer', ARRAY['Java','SQL','REST API','Git','Node.js','PostgreSQL'], ARRAY['Docker','Redis','Microservices','Spring Boot','Authentication','AWS'], 2),
  ('Full Stack Developer', ARRAY['JavaScript','React','Node.js','SQL','Git','REST API'], ARRAY['TypeScript','Docker','PostgreSQL','AWS','Testing','Authentication'], 3),
  ('Data Scientist', ARRAY['Python','SQL','Pandas','Machine Learning','Statistics','Git'], ARRAY['TensorFlow','PyTorch','NLP','Data Visualization','Spark','Deep Learning'], 2),
  ('DevOps Engineer', ARRAY['Docker','AWS','Git','Linux','CI/CD','Jenkins'], ARRAY['Kubernetes','Terraform','Ansible','Prometheus','Grafana','Shell Scripting'], 2),
  ('Mobile Developer', ARRAY['Java','Kotlin','Android','Git','REST API','UI Design'], ARRAY['Swift','iOS','React Native','Flutter','Firebase','SQLite'], 2),
  ('QA Engineer', ARRAY['Testing','Java','Python','Selenium','Git','SQL'], ARRAY['Cypress','JUnit','TestNG','Postman','Jenkins','API Testing'], 2),
  ('Software Engineer', ARRAY['Java','Data Structures','Algorithms','SQL','Git','OOP'], ARRAY['Python','C++','System Design','Docker','Testing','Linux'], 2)
ON CONFLICT (role) DO NOTHING;
