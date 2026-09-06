/*
# CampusX — Career Roadmap Module

## Overview
Replaces the mock roadmap system with a structured, role-based career roadmap
that adapts to the student's target role. Each role has multiple phases
(beginner / intermediate / advanced), each with ordered milestones that
track skills, topics, and completion status.

## New Tables

1. `career_roadmaps`
   - One row per career role (Software Developer, Full Stack Developer, etc.)
   - Fields: id, role (unique), title, description, icon_name,
     estimated_weeks, created_at.

2. `roadmap_milestones`
   - Ordered milestones within a roadmap, grouped into difficulty phases.
   - Fields: id, roadmap_id, phase (beginner/intermediate/advanced),
     order_index, title, description, skill, topics (text[]),
     estimated_hours, created_at.

3. `user_roadmap_milestones`
   - Per-user completion tracking for individual milestones.
   - Fields: id, user_id, milestone_id, status (pending/active/completed),
     completed_at.
   - Unique (user_id, milestone_id).

## Security — RLS
All tables have RLS enabled. career_roadmaps and roadmap_milestones are
readable by all authenticated users (catalog data). user_roadmap_milestones
is user-scoped with full CRUD on own rows.

## Seed Data
Seeds 4 career roadmaps:
- Software Developer (18 milestones across 3 phases)
- Full Stack Developer (18 milestones)
- AI/ML Engineer (18 milestones)
- Data Analyst (18 milestones)
*/

-- ============ career_roadmaps (catalog) ============
CREATE TABLE IF NOT EXISTS career_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Map',
  estimated_weeks integer NOT NULL DEFAULT 12,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_career_roadmaps" ON career_roadmaps;
CREATE POLICY "read_career_roadmaps"
  ON career_roadmaps FOR SELECT TO authenticated
  USING (true);

-- ============ roadmap_milestones (catalog) ============
CREATE TABLE IF NOT EXISTS roadmap_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid NOT NULL REFERENCES career_roadmaps(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'beginner',
  order_index integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  skill text NOT NULL DEFAULT '',
  topics text[] NOT NULL DEFAULT '{}',
  estimated_hours integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE roadmap_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_roadmap_milestones" ON roadmap_milestones;
CREATE POLICY "read_roadmap_milestones"
  ON roadmap_milestones FOR SELECT TO authenticated
  USING (true);

-- ============ user_roadmap_milestones ============
CREATE TABLE IF NOT EXISTS user_roadmap_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id uuid NOT NULL REFERENCES roadmap_milestones(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  UNIQUE(user_id, milestone_id)
);

ALTER TABLE user_roadmap_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_roadmap_milestones" ON user_roadmap_milestones;
CREATE POLICY "select_own_user_roadmap_milestones"
  ON user_roadmap_milestones FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_roadmap_milestones" ON user_roadmap_milestones;
CREATE POLICY "insert_own_user_roadmap_milestones"
  ON user_roadmap_milestones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_roadmap_milestones" ON user_roadmap_milestones;
CREATE POLICY "update_own_user_roadmap_milestones"
  ON user_roadmap_milestones FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_roadmap_milestones" ON user_roadmap_milestones;
CREATE POLICY "delete_own_user_roadmap_milestones"
  ON user_roadmap_milestones FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_roadmap_id ON roadmap_milestones(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_milestones_phase ON roadmap_milestones(phase);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_milestones_user_id ON user_roadmap_milestones(user_id);

-- ============ Seed Career Roadmaps ============
INSERT INTO career_roadmaps (role, title, description, icon_name, estimated_weeks) VALUES
  ('software_developer', 'Software Developer', 'Master programming, DSA, and CS fundamentals to crack SDE roles at top tech companies.', 'Code', 16),
  ('full_stack_developer', 'Full Stack Developer', 'Build end-to-end web applications with frontend, backend, database, and deployment skills.', 'Layers', 14),
  ('ai_ml_engineer', 'AI/ML Engineer', 'Dive into machine learning, deep learning, and NLP to build intelligent systems.', 'BrainCircuit', 18),
  ('data_analyst', 'Data Analyst', 'Analyze data with SQL, Python, statistics, and visualization to drive business decisions.', 'BarChart3', 12)
ON CONFLICT (role) DO NOTHING;

-- ============ Seed Milestones: Software Developer ============
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 1, 'Programming Language Fundamentals', 'Pick one language (C++/Java/Python) and master syntax, variables, loops, conditionals, and functions.', 'Programming', ARRAY['Variables', 'Loops', 'Conditionals', 'Functions'], 8 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 2, 'Object-Oriented Programming', 'Learn classes, objects, inheritance, polymorphism, encapsulation, and abstraction.', 'Programming', ARRAY['Classes', 'Inheritance', 'Polymorphism', 'OOP Design'], 6 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 3, 'Basic Data Structures', 'Understand arrays, strings, linked lists, stacks, and queues with implementation.', 'DSA', ARRAY['Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues'], 10 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 4, 'Basic Algorithms & Complexity', 'Learn Big-O notation, sorting algorithms, binary search, and recursion.', 'DSA', ARRAY['Big-O', 'Sorting', 'Binary Search', 'Recursion'], 8 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 5, 'DBMS Fundamentals', 'Understand relational models, normalization, ER diagrams, and basic SQL queries.', 'Database', ARRAY['ER Diagrams', 'Normalization', 'SQL Basics'], 6 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 6, 'Build a CLI Project', 'Apply OOP and data structures in a command-line application (e.g., task manager, calculator).', 'Projects', ARRAY['OOP', 'File I/O', 'Data Structures'], 8 FROM career_roadmaps WHERE role = 'software_developer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 7, 'Advanced Data Structures', 'Master trees, graphs, hash maps, heaps, and trie with 50+ practice problems.', 'DSA', ARRAY['Trees', 'Graphs', 'Hash Maps', 'Heaps', 'Trie'], 15 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 8, 'Dynamic Programming & Greedy', 'Learn DP patterns, memoization, tabulation, and greedy algorithms with 30+ problems.', 'DSA', ARRAY['DP', 'Memoization', 'Greedy'], 12 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 9, 'Operating Systems Concepts', 'Study processes, threads, scheduling, memory management, and synchronization.', 'CS Fundamentals', ARRAY['Processes', 'Threads', 'Scheduling', 'Memory Management'], 8 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 10, 'Computer Networks', 'Learn OSI/TCP-IP models, protocols, routing, and subnetting.', 'CS Fundamentals', ARRAY['OSI Model', 'TCP/IP', 'Routing', 'Subnetting'], 6 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 11, 'Advanced SQL & Database Design', 'Master joins, subqueries, indexes, transactions, and write optimized queries.', 'Database', ARRAY['Joins', 'Subqueries', 'Indexes', 'Transactions'], 8 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 12, 'Build a Full Project', 'Create a web or backend project applying databases, APIs, and clean architecture.', 'Projects', ARRAY['APIs', 'Database', 'Architecture'], 16 FROM career_roadmaps WHERE role = 'software_developer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 13, 'System Design Basics', 'Learn scalability, load balancing, caching, and design simple distributed systems.', 'System Design', ARRAY['Scalability', 'Load Balancing', 'Caching'], 10 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 14, 'DSA Interview Mastery', 'Solve 100+ LeetCode medium/hard problems across all patterns.', 'DSA', ARRAY['Two Pointers', 'Sliding Window', 'Graphs', 'DP'], 20 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 15, 'Mock Technical Interviews', 'Practice 10+ mock interviews covering DSA, system design, and behavioral.', 'Interview Prep', ARRAY['Mock Interviews', 'Behavioral', 'Whiteboarding'], 10 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 16, 'Resume & Portfolio Polish', 'Build an ATS-friendly resume and showcase 2-3 strong projects on GitHub.', 'Career', ARRAY['Resume', 'GitHub', 'Portfolio'], 4 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 17, 'Aptitude & Reasoning', 'Master quantitative, logical reasoning, and verbal ability for placement tests.', 'Aptitude', ARRAY['Quantitative', 'Logical Reasoning', 'Verbal'], 6 FROM career_roadmaps WHERE role = 'software_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 18, 'Apply & Interview', 'Apply to 20+ companies, attend interviews, and negotiate offers.', 'Career', ARRAY['Job Search', 'Interviews', 'Negotiation'], 8 FROM career_roadmaps WHERE role = 'software_developer';

-- ============ Seed Milestones: Full Stack Developer ============
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 1, 'HTML, CSS & JavaScript Basics', 'Master the web fundamentals: semantic HTML, CSS layout, flexbox, grid, and JS ES6+.', 'Web Dev', ARRAY['HTML', 'CSS', 'Flexbox', 'Grid', 'ES6'], 10 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 2, 'Responsive Design & Tailwind', 'Learn mobile-first design, Tailwind CSS, and build responsive layouts.', 'Web Dev', ARRAY['Responsive', 'Tailwind', 'Mobile-First'], 6 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 3, 'React Fundamentals', 'Learn components, props, state, hooks, and event handling in React.', 'Web Dev', ARRAY['Components', 'Hooks', 'State', 'Props'], 10 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 4, 'Git & Version Control', 'Master git workflows, branching, merging, and collaborative development.', 'Tools', ARRAY['Git', 'Branching', 'Pull Requests'], 4 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 5, 'REST API Concepts', 'Understand HTTP methods, status codes, REST principles, and API design.', 'Web Dev', ARRAY['HTTP', 'REST', 'API Design'], 6 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 6, 'Build a Frontend Project', 'Create a responsive React app (e.g., weather dashboard, todo app) deployed online.', 'Projects', ARRAY['React', 'APIs', 'Deployment'], 10 FROM career_roadmaps WHERE role = 'full_stack_developer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 7, 'Backend with Node.js & Express', 'Build REST APIs with Express, middleware, routing, and error handling.', 'Web Dev', ARRAY['Node.js', 'Express', 'Middleware', 'Routing'], 12 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 8, 'Database Integration', 'Connect PostgreSQL/MongoDB, write queries, use ORMs (Prisma/Mongoose), and model data.', 'Database', ARRAY['PostgreSQL', 'Prisma', 'Data Modeling'], 10 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 9, 'Authentication & Authorization', 'Implement JWT auth, OAuth, session management, and role-based access control.', 'Web Dev', ARRAY['JWT', 'OAuth', 'Sessions', 'RBAC'], 8 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 10, 'State Management & Advanced React', 'Learn Context, Redux/Zustand, React Query, and performance optimization.', 'Web Dev', ARRAY['Redux', 'Zustand', 'React Query', 'Optimization'], 8 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 11, 'Testing & Debugging', 'Write unit tests with Jest/Vitest, integration tests, and debug effectively.', 'Web Dev', ARRAY['Jest', 'Vitest', 'Integration Tests'], 6 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 12, 'Build a Full-Stack App', 'Create a complete app with auth, CRUD, database, and API (e.g., blog, e-commerce).', 'Projects', ARRAY['React', 'Node.js', 'Database', 'Auth'], 20 FROM career_roadmaps WHERE role = 'full_stack_developer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 13, 'Deployment & DevOps', 'Deploy with Vercel/Netlify/Docker, set up CI/CD, and manage environments.', 'Cloud', ARRAY['Docker', 'CI/CD', 'Vercel', 'Netlify'], 8 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 14, 'System Design for Web Apps', 'Learn caching, CDNs, scaling strategies, and microservices basics.', 'System Design', ARRAY['Caching', 'CDN', 'Microservices', 'Scaling'], 8 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 15, 'DSA for Interviews', 'Practice 80+ problems focusing on arrays, strings, trees, and graphs.', 'DSA', ARRAY['Arrays', 'Strings', 'Trees', 'Graphs'], 15 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 16, 'Mock Interviews', 'Practice 10+ full-stack and frontend mock interviews.', 'Interview Prep', ARRAY['Mock Interviews', 'System Design', 'Frontend'], 8 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 17, 'Portfolio & Resume', 'Polish your GitHub, build a personal site, and create an ATS-friendly resume.', 'Career', ARRAY['Portfolio', 'Resume', 'GitHub'], 4 FROM career_roadmaps WHERE role = 'full_stack_developer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 18, 'Apply & Interview', 'Apply to 20+ companies and attend full-stack developer interviews.', 'Career', ARRAY['Job Search', 'Interviews'], 6 FROM career_roadmaps WHERE role = 'full_stack_developer';

-- ============ Seed Milestones: AI/ML Engineer ============
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 1, 'Python for Data Science', 'Master Python with NumPy, Pandas, and Matplotlib for data manipulation.', 'Programming', ARRAY['Python', 'NumPy', 'Pandas', 'Matplotlib'], 12 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 2, 'Statistics & Probability', 'Learn descriptive/inferential statistics, distributions, and hypothesis testing.', 'Math', ARRAY['Statistics', 'Probability', 'Hypothesis Testing'], 10 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 3, 'Linear Algebra & Calculus', 'Understand vectors, matrices, derivatives, and gradients for ML.', 'Math', ARRAY['Linear Algebra', 'Matrices', 'Calculus', 'Gradients'], 8 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 4, 'Data Visualization', 'Create insightful visualizations with Matplotlib, Seaborn, and Plotly.', 'Data', ARRAY['Matplotlib', 'Seaborn', 'Plotly', 'EDA'], 6 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 5, 'SQL for Data Engineering', 'Master SQL queries, joins, window functions, and data pipelines.', 'Database', ARRAY['SQL', 'Joins', 'Window Functions', 'Pipelines'], 8 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 6, 'EDA Project', 'Perform exploratory data analysis on a real dataset and present findings.', 'Projects', ARRAY['EDA', 'Pandas', 'Visualization'], 10 FROM career_roadmaps WHERE role = 'ai_ml_engineer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 7, 'Machine Learning Fundamentals', 'Learn supervised/unsupervised learning, train/test split, and model evaluation.', 'ML', ARRAY['Supervised', 'Unsupervised', 'Evaluation', 'Scikit-learn'], 12 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 8, 'Classical ML Algorithms', 'Implement linear/logistic regression, decision trees, random forests, and SVM.', 'ML', ARRAY['Regression', 'Decision Trees', 'Random Forest', 'SVM'], 10 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 9, 'Feature Engineering & Selection', 'Master feature extraction, encoding, scaling, and dimensionality reduction.', 'ML', ARRAY['Feature Engineering', 'PCA', 'Encoding', 'Scaling'], 6 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 10, 'Deep Learning Basics', 'Learn neural networks, backpropagation, and build with TensorFlow/PyTorch.', 'DL', ARRAY['Neural Networks', 'Backpropagation', 'TensorFlow', 'PyTorch'], 12 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 11, 'Computer Vision or NLP Track', 'Choose CV (CNNs, image processing) or NLP (text processing, embeddings).', 'DL', ARRAY['CNNs', 'NLP', 'Embeddings', 'Transformers'], 12 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 12, 'ML Project Portfolio', 'Build 2 end-to-end ML projects with model training, evaluation, and deployment.', 'Projects', ARRAY['Model Training', 'MLOps', 'Deployment'], 20 FROM career_roadmaps WHERE role = 'ai_ml_engineer';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 13, 'Advanced Deep Learning', 'Study transformers, attention mechanisms, GANs, and transfer learning.', 'DL', ARRAY['Transformers', 'Attention', 'GANs', 'Transfer Learning'], 15 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 14, 'MLOps & Model Deployment', 'Learn Docker, model serving, MLflow, monitoring, and CI/CD for ML.', 'MLOps', ARRAY['Docker', 'MLflow', 'Model Serving', 'CI/CD'], 10 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 15, 'DSA for ML Interviews', 'Practice coding problems relevant to ML engineering interviews.', 'DSA', ARRAY['Arrays', 'Dynamic Programming', 'Graphs'], 10 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 16, 'ML System Design', 'Design ML systems at scale: feature stores, model pipelines, and serving.', 'System Design', ARRAY['Feature Stores', 'Model Pipelines', 'Serving'], 8 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 17, 'Resume & Research Profile', 'Build a strong GitHub, publish a blog/paper, and create a targeted resume.', 'Career', ARRAY['Resume', 'GitHub', 'Research', 'Blog'], 4 FROM career_roadmaps WHERE role = 'ai_ml_engineer';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 18, 'Apply & Interview', 'Apply to ML engineer roles and attend technical + ML system design interviews.', 'Career', ARRAY['Job Search', 'Interviews', 'ML System Design'], 6 FROM career_roadmaps WHERE role = 'ai_ml_engineer';

-- ============ Seed Milestones: Data Analyst ============
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 1, 'Excel for Data Analysis', 'Master formulas, pivot tables, VLOOKUP, charts, and data cleaning in Excel.', 'Data', ARRAY['Excel', 'Pivot Tables', 'VLOOKUP', 'Charts'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 2, 'SQL Fundamentals', 'Learn SELECT, WHERE, GROUP BY, HAVING, JOINs, and subqueries.', 'Database', ARRAY['SELECT', 'JOINs', 'GROUP BY', 'Subqueries'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 3, 'Statistics for Analytics', 'Understand mean/median/mode, distributions, correlation, and A/B testing.', 'Math', ARRAY['Statistics', 'Distributions', 'Correlation', 'A/B Testing'], 6 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 4, 'Python for Data Analysis', 'Use Pandas and NumPy for data manipulation, cleaning, and aggregation.', 'Programming', ARRAY['Python', 'Pandas', 'NumPy', 'Data Cleaning'], 10 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 5, 'Data Visualization Basics', 'Create charts and dashboards with Matplotlib, Seaborn, or Tableau Public.', 'Data', ARRAY['Matplotlib', 'Seaborn', 'Tableau', 'Dashboards'], 6 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'beginner', 6, 'Data Cleaning Project', 'Clean and analyze a messy real-world dataset end-to-end.', 'Projects', ARRAY['Data Cleaning', 'EDA', 'Pandas'], 8 FROM career_roadmaps WHERE role = 'data_analyst';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 7, 'Advanced SQL', 'Master window functions, CTEs, performance optimization, and complex queries.', 'Database', ARRAY['Window Functions', 'CTEs', 'Optimization'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 8, 'BI Tools (Tableau / Power BI)', 'Build interactive dashboards, stories, and reports with BI tools.', 'Data', ARRAY['Tableau', 'Power BI', 'Dashboards', 'Reports'], 10 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 9, 'Exploratory Data Analysis', 'Perform deep EDA with statistical summaries, correlation analysis, and visual storytelling.', 'Data', ARRAY['EDA', 'Correlation', 'Storytelling', 'Statistics'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 10, 'Basic Machine Learning', 'Learn regression, classification, and clustering for predictive analytics.', 'ML', ARRAY['Regression', 'Classification', 'Clustering'], 10 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 11, 'Data Storytelling & Communication', 'Present data insights effectively to stakeholders using clear narratives.', 'Soft Skills', ARRAY['Storytelling', 'Presentations', 'Communication'], 4 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'intermediate', 12, 'Dashboard Project', 'Build a complete BI dashboard with real data, insights, and recommendations.', 'Projects', ARRAY['Dashboard', 'Tableau', 'SQL', 'Presentation'], 12 FROM career_roadmaps WHERE role = 'data_analyst';

INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 13, 'Advanced Analytics & Forecasting', 'Learn time series forecasting, cohort analysis, and predictive modeling.', 'Data', ARRAY['Time Series', 'Forecasting', 'Cohort Analysis'], 10 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 14, 'Data Pipeline & ETL', 'Build ETL pipelines with Python, SQL, and scheduling tools.', 'Data', ARRAY['ETL', 'Python', 'Scheduling', 'Airflow'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 15, 'Python Coding for Interviews', 'Practice coding problems and SQL challenges for data analyst interviews.', 'DSA', ARRAY['Python', 'SQL Challenges', 'Arrays'], 8 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 16, 'Case Study Interviews', 'Practice analytics case studies, metric design, and business problem-solving.', 'Interview Prep', ARRAY['Case Studies', 'Metrics', 'Business Problems'], 6 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 17, 'Portfolio & Resume', 'Showcase 3 analysis projects, dashboards, and a data-focused resume.', 'Career', ARRAY['Portfolio', 'Resume', 'GitHub'], 4 FROM career_roadmaps WHERE role = 'data_analyst';
INSERT INTO roadmap_milestones (roadmap_id, phase, order_index, title, description, skill, topics, estimated_hours) SELECT id, 'advanced', 18, 'Apply & Interview', 'Apply to data analyst roles and attend SQL + case study interviews.', 'Career', ARRAY['Job Search', 'Interviews', 'SQL'], 6 FROM career_roadmaps WHERE role = 'data_analyst';
