/*
# CampusX — Projects Module: Schema Updates + Seed Data

## Overview
Enhances the projects table with required skills and XP reward columns,
adds a github_url field to user_projects for GitHub repo submission, and
seeds 18 realistic software development projects across beginner,
intermediate, and advanced difficulty levels.

## Modified Tables

1. `projects` (catalog)
   - ADD COLUMN `required_skills` (text[]) — skills a student should know
   - ADD COLUMN `xp_reward` (integer, default 200) — XP earned on completion
   - ADD COLUMN `category` (text, default '') — project category (e.g. Web, CLI, ML)
   - ADD COLUMN `order_index` (integer, default 0) — display ordering

2. `user_projects`
   - ADD COLUMN `github_url` (text, default '') — student's submitted GitHub repo URL

## Security — RLS
No policy changes. Existing RLS policies remain in place:
- `projects`: readable by all authenticated users (catalog)
- `user_projects`: owner-scoped CRUD via auth.uid() = user_id

## Seed Data
18 projects spanning beginner → advanced:
- Beginner (6): Todo CLI, Calculator App, Personal Portfolio, Weather App,
  Landing Page, Expense Tracker CLI
- Intermediate (6): Task Manager API, Blog Platform, Real-time Chat,
  E-commerce Storefront, Expense Tracker Web, Movie Discovery App
- Advanced (6): Full-Stack Social App, Microservices E-Commerce,
  ML Sentiment Analyzer, Distributed Task Queue, DevOps CI/CD Pipeline,
  Real-time Collaborative Editor

## Important Notes
1. Uses `DO $$ ... END $$` blocks to conditionally add columns so re-runs
   are safe.
2. Uses ON CONFLICT to avoid duplicate project seeds on re-runs. A unique
   constraint on project title is added to support this.
*/
-- ============ Add columns to projects (idempotent) ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'required_skills') THEN
    ALTER TABLE projects ADD COLUMN required_skills text[] NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'xp_reward') THEN
    ALTER TABLE projects ADD COLUMN xp_reward integer NOT NULL DEFAULT 200;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'category') THEN
    ALTER TABLE projects ADD COLUMN category text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'order_index') THEN
    ALTER TABLE projects ADD COLUMN order_index integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============ Add github_url to user_projects (idempotent) ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_projects' AND column_name = 'github_url') THEN
    ALTER TABLE user_projects ADD COLUMN github_url text NOT NULL DEFAULT '';
  END IF;
END $$;

-- ============ Unique constraint on projects.title for seed idempotency ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_title_unique') THEN
    ALTER TABLE projects ADD CONSTRAINT projects_title_unique UNIQUE (title);
  END IF;
END $$;

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects(difficulty);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);

-- ============ Seed Projects: Beginner ============
INSERT INTO projects (title, description, tech_stack, difficulty, estimated_hours, required_skills, xp_reward, category, order_index) VALUES
  ('Todo List CLI App', 'Build a command-line todo manager with add, list, complete, and delete operations using file I/O for persistence.', ARRAY['Python', 'File I/O'], 'Beginner', 4, ARRAY['Python', 'Data Structures'], 150, 'CLI', 1),
  ('Calculator Application', 'Create a functional calculator app with a clean UI supporting basic arithmetic operations and keyboard input.', ARRAY['Java', 'Swing'], 'Beginner', 6, ARRAY['Java', 'OOP'], 150, 'Desktop', 2),
  ('Personal Portfolio Website', 'Build a responsive personal portfolio with about, projects, and contact sections deployed online.', ARRAY['HTML', 'CSS', 'JavaScript'], 'Beginner', 8, ARRAY['HTML', 'CSS', 'Git'], 200, 'Web', 3),
  ('Weather Dashboard', 'Create a weather app that fetches data from a public API and displays current weather and 5-day forecast.', ARRAY['JavaScript', 'REST API'], 'Beginner', 10, ARRAY['JavaScript', 'APIs'], 200, 'Web', 4),
  ('Product Landing Page', 'Design and build a modern, responsive landing page with hero, features, pricing, and CTA sections.', ARRAY['HTML', 'CSS', 'Tailwind'], 'Beginner', 6, ARRAY['HTML', 'CSS'], 150, 'Web', 5),
  ('Expense Tracker CLI', 'Build a command-line expense tracker with categories, monthly summaries, and CSV export.', ARRAY['Java', 'File I/O'], 'Beginner', 8, ARRAY['Java', 'OOP'], 200, 'CLI', 6)
ON CONFLICT (title) DO NOTHING;

-- ============ Seed Projects: Intermediate ============
INSERT INTO projects (title, description, tech_stack, difficulty, estimated_hours, required_skills, xp_reward, category, order_index) VALUES
  ('Task Manager REST API', 'Build a RESTful CRUD API for tasks with authentication, validation, and PostgreSQL database integration.', ARRAY['Node.js', 'Express', 'PostgreSQL'], 'Intermediate', 14, ARRAY['Node.js', 'REST', 'SQL'], 300, 'Backend', 7),
  ('Blog Platform with Auth', 'Create a full-featured blog with user authentication, rich text editor, comments, and markdown support.', ARRAY['React', 'Node.js', 'PostgreSQL'], 'Intermediate', 20, ARRAY['React', 'Node.js', 'SQL', 'Auth'], 350, 'Full Stack', 8),
  ('Real-time Chat Application', 'Build a real-time chat app with WebSocket, rooms, online status, and message history.', ARRAY['React', 'Socket.io', 'Node.js'], 'Intermediate', 18, ARRAY['React', 'Node.js', 'WebSocket'], 350, 'Full Stack', 9),
  ('E-commerce Storefront', 'Create an e-commerce front-end with product catalog, cart, checkout flow, and Stripe payment integration.', ARRAY['React', 'Stripe', 'Tailwind'], 'Intermediate', 22, ARRAY['React', 'REST', 'Stripe'], 400, 'Web', 10),
  ('Expense Tracker Web App', 'Build a full-stack expense tracker with charts, budget goals, CSV import, and category management.', ARRAY['React', 'Node.js', 'PostgreSQL'], 'Intermediate', 18, ARRAY['React', 'Node.js', 'SQL'], 350, 'Full Stack', 11),
  ('Movie Discovery App', 'Create a movie browsing app using TMDB API with search, filters, watchlist, and detail pages.', ARRAY['React', 'TMDB API', 'Tailwind'], 'Intermediate', 16, ARRAY['React', 'APIs', 'Routing'], 300, 'Web', 12)
ON CONFLICT (title) DO NOTHING;

-- ============ Seed Projects: Advanced ============
INSERT INTO projects (title, description, tech_stack, difficulty, estimated_hours, required_skills, xp_reward, category, order_index) VALUES
  ('Full-Stack Social Media App', 'Build a social platform with posts, likes, comments, follow system, notifications, and news feed.', ARRAY['React', 'Node.js', 'PostgreSQL', 'Redis'], 'Advanced', 35, ARRAY['React', 'Node.js', 'SQL', 'Redis', 'Auth'], 500, 'Full Stack', 13),
  ('Microservices E-Commerce Backend', 'Design and build a microservices architecture with API gateway, auth, catalog, orders, and payment services.', ARRAY['Spring Boot', 'Docker', 'PostgreSQL', 'RabbitMQ'], 'Advanced', 40, ARRAY['Spring Boot', 'Docker', 'SQL', 'Microservices'], 600, 'Backend', 14),
  ('ML Sentiment Analyzer API', 'Build a sentiment analysis API using a pre-trained NLP model with batch processing and visualization dashboard.', ARRAY['Python', 'Flask', 'Transformers'], 'Advanced', 30, ARRAY['Python', 'ML', 'Flask'], 500, 'ML', 15),
  ('Distributed Task Queue System', 'Build a distributed task queue with worker nodes, priority scheduling, retry logic, and monitoring dashboard.', ARRAY['Go', 'Redis', 'Docker'], 'Advanced', 32, ARRAY['Go', 'Redis', 'Docker', 'System Design'], 600, 'Backend', 16),
  ('DevOps CI/CD Pipeline', 'Set up a complete CI/CD pipeline with Docker, Jenkins, automated testing, and deployment to AWS ECS.', ARRAY['Docker', 'Jenkins', 'AWS', 'Git'], 'Advanced', 25, ARRAY['Docker', 'AWS', 'Git', 'CI/CD'], 450, 'DevOps', 17),
  ('Real-time Collaborative Editor', 'Build a Google Docs-style collaborative text editor with CRDT conflict resolution and real-time sync.', ARRAY['React', 'WebSocket', 'Node.js', 'CRDT'], 'Advanced', 38, ARRAY['React', 'WebSocket', 'Algorithms'], 600, 'Full Stack', 18)
ON CONFLICT (title) DO NOTHING;
