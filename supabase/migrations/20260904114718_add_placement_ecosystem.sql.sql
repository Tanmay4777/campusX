/*
# CampusX — Placement Ecosystem + Role-Based Access Control

## Changes
1. Add `role` column to profiles (student/mentor/admin) default 'student'
2. Create `jobs` table — company, role, requirements, eligibility, deadlines
3. Create `saved_jobs` table — student bookmarks
4. Create `job_applications` table — track application status
5. Create `placement_announcements` table — admin announcements
6. Create `placement_assessments` table — placement-specific assessments
*/

-- ============ Add role to profiles ============
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- Update mentor_profiles users to 'mentor' role
UPDATE profiles SET role = 'mentor'
WHERE id IN (SELECT user_id FROM mentor_profiles);

-- ============ jobs ============
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  job_type text NOT NULL DEFAULT 'full-time',
  role text NOT NULL DEFAULT '',
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  min_cgpa numeric(3,2) NOT NULL DEFAULT 0,
  eligible_years text[] NOT NULL DEFAULT '{}',
  eligible_branches text[] NOT NULL DEFAULT '{}',
  package_lpa numeric(6,2) NOT NULL DEFAULT 0,
  deadline timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_active boolean NOT NULL DEFAULT true,
  application_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_jobs" ON jobs;
CREATE POLICY "select_jobs"
  ON jobs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_jobs_admin" ON jobs;
CREATE POLICY "insert_jobs_admin"
  ON jobs FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = posted_by AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_jobs_admin" ON jobs;
CREATE POLICY "update_jobs_admin"
  ON jobs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_jobs_admin" ON jobs;
CREATE POLICY "delete_jobs_admin"
  ON jobs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);

-- ============ saved_jobs ============
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_saved_jobs" ON saved_jobs;
CREATE POLICY "select_own_saved_jobs" ON saved_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_saved_jobs" ON saved_jobs;
CREATE POLICY "insert_own_saved_jobs" ON saved_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_saved_jobs" ON saved_jobs;
CREATE POLICY "delete_own_saved_jobs" ON saved_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);

-- ============ job_applications ============
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'applied',
  cover_letter text NOT NULL DEFAULT '',
  resume_url text NOT NULL DEFAULT '',
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_job_applications" ON job_applications;
CREATE POLICY "select_job_applications" ON job_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "insert_own_job_applications" ON job_applications;
CREATE POLICY "insert_own_job_applications" ON job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_job_applications" ON job_applications;
CREATE POLICY "update_job_applications" ON job_applications FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id AND status IN ('applied', 'withdrawn')) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK ((auth.uid() = user_id AND status IN ('applied', 'withdrawn')) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "delete_own_job_applications" ON job_applications;
CREATE POLICY "delete_own_job_applications" ON job_applications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);

-- ============ placement_announcements ============
CREATE TABLE IF NOT EXISTS placement_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  priority text NOT NULL DEFAULT 'normal',
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE placement_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_announcements" ON placement_announcements;
CREATE POLICY "select_announcements" ON placement_announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_announcements_admin" ON placement_announcements;
CREATE POLICY "insert_announcements_admin" ON placement_announcements FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "update_announcements_admin" ON placement_announcements;
CREATE POLICY "update_announcements_admin" ON placement_announcements FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "delete_announcements_admin" ON placement_announcements;
CREATE POLICY "delete_announcements_admin" ON placement_announcements FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============ placement_assessments ============
CREATE TABLE IF NOT EXISTS placement_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  posted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  test_type text NOT NULL DEFAULT 'aptitude',
  duration_minutes int NOT NULL DEFAULT 60,
  deadline timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE placement_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_placement_assessments" ON placement_assessments;
CREATE POLICY "select_placement_assessments" ON placement_assessments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_placement_assessments_admin" ON placement_assessments;
CREATE POLICY "insert_placement_assessments_admin" ON placement_assessments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "update_placement_assessments_admin" ON placement_assessments;
CREATE POLICY "update_placement_assessments_admin" ON placement_assessments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "delete_placement_assessments_admin" ON placement_assessments;
CREATE POLICY "delete_placement_assessments_admin" ON placement_assessments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============ Seed jobs ============
INSERT INTO jobs (posted_by, company, title, description, location, job_type, role, required_skills, preferred_skills, min_cgpa, eligible_years, eligible_branches, package_lpa, deadline)
SELECT
  (SELECT id FROM profiles LIMIT 1),
  d.company, d.title, d.description, d.location, d.job_type, d.role,
  d.required_skills, d.preferred_skills, d.min_cgpa, d.eligible_years, d.eligible_branches,
  d.package_lpa, d.deadline
FROM (VALUES
  ('Google', 'Software Engineer I', 'Join Google as an entry-level Software Engineer. You will work on building scalable systems and solve complex algorithmic problems.', 'Bangalore / Hybrid', 'full-time', 'Backend Engineer',
   ARRAY['Java','Python','Algorithms','System Design'], ARRAY['Go','Docker','Kubernetes'], 7.5, ARRAY['2026','2027'], ARRAY['CSE','ECE','IT'], 28.0, now() + interval '20 days'),
  ('Microsoft', 'Frontend Engineer', 'Build delightful user experiences for Microsoft 365 products. Strong React and TypeScript skills required.', 'Hyderabad / Remote', 'full-time', 'Frontend Engineer',
   ARRAY['React','TypeScript','JavaScript','CSS'], ARRAY['Next.js','Accessibility','Testing'], 7.0, ARRAY['2026','2027'], ARRAY['CSE','IT'], 24.0, now() + interval '15 days'),
  ('Amazon', 'SDE-1', 'Amazon is hiring Software Development Engineers. You will design and develop large-scale distributed systems.', 'Bangalore', 'full-time', 'Backend Engineer',
   ARRAY['Java','Data Structures','Algorithms','OOPS'], ARRAY['AWS','Docker','Microservices'], 7.0, ARRAY['2026','2027'], ARRAY['CSE','ECE','IT'], 22.0, now() + interval '12 days'),
  ('Adobe', 'Data Scientist', 'Join Adobe''s data science team to build ML models for personalization and recommendations.', 'Noida / Hybrid', 'full-time', 'Data Scientist',
   ARRAY['Python','SQL','Machine Learning','Statistics'], ARRAY['TensorFlow','Pandas','NLP'], 7.5, ARRAY['2026','2027'], ARRAY['CSE','AI','Data Science'], 20.0, now() + interval '25 days'),
  ('Flipkart', 'Full Stack Developer', 'Build end-to-end features for Flipkart''s e-commerce platform using React and Node.js.', 'Bangalore', 'full-time', 'Full Stack Engineer',
   ARRAY['JavaScript','React','Node.js','PostgreSQL'], ARRAY['MongoDB','Redis','GraphQL'], 6.5, ARRAY['2026'], ARRAY['CSE','IT'], 18.0, now() + interval '18 days'),
  ('Netflix', 'DevOps Engineer', 'Manage and scale Netflix''s infrastructure. Strong cloud and containerization experience needed.', 'Mumbai / Remote', 'full-time', 'DevOps Engineer',
   ARRAY['AWS','Docker','Kubernetes','Linux'], ARRAY['Terraform','CI/CD','Jenkins'], 7.0, ARRAY['2026','2027'], ARRAY['CSE','IT'], 30.0, now() + interval '30 days'),
  ('Spotify', 'Mobile Engineer', 'Build mobile features for Spotify using React Native. Work on audio streaming and offline mode.', 'Remote', 'full-time', 'Mobile Engineer',
   ARRAY['React Native','JavaScript','TypeScript'], ARRAY['Flutter','Swift','Firebase'], 6.5, ARRAY['2026'], ARRAY['CSE','IT'], 25.0, now() + interval '22 days'),
  ('Zoho', 'QA Engineer', 'Automate test suites and ensure quality across Zoho''s product suite.', 'Chennai', 'full-time', 'QA Engineer',
   ARRAY['Selenium','Java','Testing'], ARRAY['Cypress','API Testing','JUnit'], 6.0, ARRAY['2026','2027'], ARRAY['CSE','IT'], 12.0, now() + interval '14 days')
) AS d(company, title, description, location, job_type, role, required_skills, preferred_skills, min_cgpa, eligible_years, eligible_branches, package_lpa, deadline)
WHERE NOT EXISTS (SELECT 1 FROM jobs LIMIT 1)
AND EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- ============ Seed announcements ============
INSERT INTO placement_announcements (posted_by, title, content, type, priority, is_pinned)
SELECT (SELECT id FROM profiles LIMIT 1),
  'Placement Season 2026-27 Kickoff!',
  'Welcome to the placement season! Make sure your profile is complete, resume is updated, and skills are assessed. The first round of company drives starts next week.',
  'info', 'high', true
WHERE NOT EXISTS (SELECT 1 FROM placement_announcements LIMIT 1);

INSERT INTO placement_announcements (posted_by, title, content, type, priority, is_pinned)
SELECT (SELECT id FROM profiles LIMIT 1),
  'Resume Workshop on Friday',
  'A resume review workshop will be held this Friday at 3 PM in the seminar hall. Bring a printed copy of your resume. Industry mentors will provide 1-on-1 feedback.',
  'event', 'normal', false
WHERE NOT EXISTS (SELECT 1 FROM placement_announcements WHERE title = 'Resume Workshop on Friday');
