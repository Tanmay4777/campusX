/*
# CampusX — Community, Mentorship, and Leaderboard Module

## New Tables
1. community_posts    — Forum posts with categories, tags, likes
2. post_replies       — Replies to posts
3. post_likes         — Like tracking (user + post unique)
4. mentor_profiles    — Mentor bios, skills, company, role, slots
5. mentorship_requests — Student requests to mentors (accept/reject/active)

## RLS
All tables have RLS enabled with authenticated access.
Posts/replies/likes: users can see all, create/edit/delete only their own.
Mentor profiles: all authenticated can view; mentors can update their own.
Mentorship requests: students see their sent requests; mentors see received requests.
*/

-- ============ community_posts ============
CREATE TABLE IF NOT EXISTS community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  like_count int NOT NULL DEFAULT 0,
  reply_count int NOT NULL DEFAULT 0,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_community_posts" ON community_posts;
CREATE POLICY "select_community_posts"
  ON community_posts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_community_posts" ON community_posts;
CREATE POLICY "insert_own_community_posts"
  ON community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_community_posts" ON community_posts;
CREATE POLICY "update_own_community_posts"
  ON community_posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_community_posts" ON community_posts;
CREATE POLICY "delete_own_community_posts"
  ON community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);

-- ============ post_replies ============
CREATE TABLE IF NOT EXISTS post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_replies" ON post_replies;
CREATE POLICY "select_post_replies"
  ON post_replies FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_post_replies" ON post_replies;
CREATE POLICY "insert_own_post_replies"
  ON post_replies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_post_replies" ON post_replies;
CREATE POLICY "update_own_post_replies"
  ON post_replies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_post_replies" ON post_replies;
CREATE POLICY "delete_own_post_replies"
  ON post_replies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_replies_post_id ON post_replies(post_id);

-- ============ post_likes ============
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_post_likes" ON post_likes;
CREATE POLICY "select_post_likes"
  ON post_likes FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_post_likes" ON post_likes;
CREATE POLICY "insert_own_post_likes"
  ON post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_post_likes" ON post_likes;
CREATE POLICY "delete_own_post_likes"
  ON post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ============ mentor_profiles ============
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  specializations text[] NOT NULL DEFAULT '{}',
  experience_years int NOT NULL DEFAULT 0,
  linkedin_url text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  max_mentees int NOT NULL DEFAULT 5,
  current_mentees int NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  total_reviews int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentor_profiles" ON mentor_profiles;
CREATE POLICY "select_mentor_profiles"
  ON mentor_profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_mentor_profile" ON mentor_profiles;
CREATE POLICY "insert_own_mentor_profile"
  ON mentor_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mentor_profile" ON mentor_profiles;
CREATE POLICY "update_own_mentor_profile"
  ON mentor_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mentor_profile" ON mentor_profiles;
CREATE POLICY "delete_own_mentor_profile"
  ON mentor_profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ mentorship_requests ============
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES mentor_profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text NOT NULL DEFAULT '',
  goals text NOT NULL DEFAULT '',
  rejected_reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(mentor_id, student_id)
);

ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_mentorship_requests" ON mentorship_requests;
CREATE POLICY "select_mentorship_requests"
  ON mentorship_requests FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() IN (
    SELECT user_id FROM mentor_profiles WHERE id = mentor_id
  ));

DROP POLICY IF EXISTS "insert_own_mentorship_request" ON mentorship_requests;
CREATE POLICY "insert_own_mentorship_request"
  ON mentorship_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_mentorship_request" ON mentorship_requests;
CREATE POLICY "update_mentorship_request"
  ON mentorship_requests FOR UPDATE TO authenticated
  USING (
    (auth.uid() = student_id AND status IN ('pending', 'cancelled')) OR
    (auth.uid() IN (SELECT user_id FROM mentor_profiles WHERE id = mentor_id) AND status IN ('pending', 'accepted', 'rejected'))
  ) WITH CHECK (
    (auth.uid() = student_id AND status IN ('pending', 'cancelled')) OR
    (auth.uid() IN (SELECT user_id FROM mentor_profiles WHERE id = mentor_id) AND status IN ('pending', 'accepted', 'rejected', 'completed'))
  );

DROP POLICY IF EXISTS "delete_own_mentorship_request" ON mentorship_requests;
CREATE POLICY "delete_own_mentorship_request"
  ON mentorship_requests FOR DELETE TO authenticated
  USING (auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_id ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student_id ON mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- ============ Seed mentor profiles ============
INSERT INTO mentor_profiles (user_id, full_name, bio, company, role, skills, specializations, experience_years, linkedin_url, is_available, max_mentees, current_mentees, rating, total_reviews)
SELECT id, full_name,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 'Frontend engineer with a passion for React, performance optimization, and design systems. I love helping students bridge the gap between tutorials and production-grade code.'
    WHEN target_role LIKE '%Backend%' THEN 'Backend architect specializing in distributed systems and API design. I have conducted 200+ technical interviews and can help you crack them.'
    WHEN target_role LIKE '%Data%' THEN 'Data scientist turned ML engineer. I mentor students on statistics, Python, and building real-world ML projects for their portfolio.'
    WHEN target_role LIKE '%DevOps%' THEN 'DevOps engineer who has scaled infrastructure for startups and enterprises. I can guide you through cloud, CI/CD, and infrastructure as code.'
    WHEN target_role LIKE '%Mobile%' THEN 'Mobile developer with experience in React Native and Flutter. I help students build and ship their first mobile apps.'
    WHEN target_role LIKE '%QA%' THEN 'QA lead focused on automation and quality engineering. I mentor on testing strategies and tools that employers actually look for.'
    ELSE 'Software engineer with experience across the stack. I enjoy mentoring students and helping them prepare for technical interviews.'
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 'Google'
    WHEN target_role LIKE '%Backend%' THEN 'Amazon'
    WHEN target_role LIKE '%Data%' THEN 'Microsoft'
    WHEN target_role LIKE '%DevOps%' THEN 'Netflix'
    WHEN target_role LIKE '%Mobile%' THEN 'Spotify'
    WHEN target_role LIKE '%QA%' THEN 'Adobe'
    ELSE 'Uber'
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 'Senior Frontend Engineer'
    WHEN target_role LIKE '%Backend%' THEN 'Staff Backend Engineer'
    WHEN target_role LIKE '%Data%' THEN 'Senior Data Scientist'
    WHEN target_role LIKE '%DevOps%' THEN 'DevOps Lead'
    WHEN target_role LIKE '%Mobile%' THEN 'Senior Mobile Engineer'
    WHEN target_role LIKE '%QA%' THEN 'QA Engineering Manager'
    ELSE 'Senior Software Engineer'
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN ARRAY['React','TypeScript','CSS','JavaScript','Next.js','Testing','Accessibility','Performance']
    WHEN target_role LIKE '%Backend%' THEN ARRAY['Java','Python','PostgreSQL','System Design','Microservices','Docker','Kubernetes','Redis']
    WHEN target_role LIKE '%Data%' THEN ARRAY['Python','SQL','Pandas','Machine Learning','Statistics','TensorFlow','Data Visualization']
    WHEN target_role LIKE '%DevOps%' THEN ARRAY['AWS','Docker','Kubernetes','Terraform','CI/CD','Linux','Monitoring','Jenkins']
    WHEN target_role LIKE '%Mobile%' THEN ARRAY['React Native','Flutter','Dart','Swift','Kotlin','Mobile UI','Firebase']
    WHEN target_role LIKE '%QA%' THEN ARRAY['Selenium','Cypress','JUnit','Test Automation','API Testing','Performance Testing']
    ELSE ARRAY['JavaScript','Python','React','Node.js','System Design','Algorithms','Git','SQL']
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN ARRAY['Frontend Interviews','Portfolio Review','Career Transition']
    WHEN target_role LIKE '%Backend%' THEN ARRAY['System Design Interviews','Backend Architecture','Career Growth']
    WHEN target_role LIKE '%Data%' THEN ARRAY['ML Projects','Data Science Interviews','Portfolio Building']
    WHEN target_role LIKE '%DevOps%' THEN ARRAY['DevOps Career Path','Cloud Certifications','Infrastructure Design']
    WHEN target_role LIKE '%Mobile%' THEN ARRAY['Mobile App Development','App Store Deployment','Mobile Interviews']
    WHEN target_role LIKE '%QA%' THEN ARRAY['QA Automation','Testing Strategies','QA Interviews']
    ELSE ARRAY['DSA Preparation','System Design','Career Guidance']
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 6
    WHEN target_role LIKE '%Backend%' THEN 8
    WHEN target_role LIKE '%Data%' THEN 5
    WHEN target_role LIKE '%DevOps%' THEN 7
    WHEN target_role LIKE '%Mobile%' THEN 4
    WHEN target_role LIKE '%QA%' THEN 6
    ELSE 7
  END,
  '',
  true,
  3,
  0,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 4.8
    WHEN target_role LIKE '%Backend%' THEN 4.9
    WHEN target_role LIKE '%Data%' THEN 4.7
    WHEN target_role LIKE '%DevOps%' THEN 4.8
    WHEN target_role LIKE '%Mobile%' THEN 4.6
    WHEN target_role LIKE '%QA%' THEN 4.5
    ELSE 4.7
  END,
  CASE
    WHEN target_role LIKE '%Frontend%' THEN 23
    WHEN target_role LIKE '%Backend%' THEN 31
    WHEN target_role LIKE '%Data%' THEN 18
    WHEN target_role LIKE '%DevOps%' THEN 15
    WHEN target_role LIKE '%Mobile%' THEN 12
    WHEN target_role LIKE '%QA%' THEN 9
    ELSE 20
  END
FROM profiles
WHERE full_name IN ('Aarav Sharma','Diya Patel','Vihaan Reddy','Ananya Singh','Arjun Nair','Saanvi Gupta','Kabir Malhotra','Riya Iyer')
ON CONFLICT (user_id) DO NOTHING;
