/*
# CampusX — Learning Module

## Overview
Adds a topic-based learning system connected to the student's career roadmap.
Each topic belongs to a skill area (Java, DSA, SQL, React, Spring Boot, Git,
Docker, AWS) and contains curated resource cards (video, article, document).
Students mark topics complete, earn XP, and their roadmap/gamification progress
updates automatically.

## New Tables

1. `learning_topics`
   - Catalog of learnable topics grouped by skill/track.
   - Fields: id, slug (unique), title, description, skill, track,
     difficulty (beginner/intermediate/advanced), order_index,
     estimated_minutes, tags (text[]), created_at.

2. `learning_resources`
   - Curated resource cards attached to a topic.
   - Fields: id, topic_id (FK → learning_topics), title, description,
     resource_type (video/article/document), url, duration_minutes,
     source, order_index, created_at.

3. `user_learning_progress`
   - Per-user completion tracking for topics.
   - Fields: id, user_id (DEFAULT auth.uid()), topic_id (FK),
     status (in_progress/completed), completed_at, xp_earned.
   - UNIQUE(user_id, topic_id).

## Security — RLS
- `learning_topics` and `learning_resources`: readable by all authenticated
  users (catalog data, no user-scoped writes from frontend).
- `user_learning_progress`: full CRUD scoped to the owning user via
  auth.uid() = user_id.

## Seed Data
Seeds 8 skill tracks with multiple topics each:
Java (4 topics), DSA (4), SQL (4), React (4), Spring Boot (3),
Git (3), Docker (3), AWS (3) — 28 topics total.
Each topic has 2–3 resource cards (video, article, and/or document).

## Important Notes
1. Topics are standalone but tagged by skill so the roadmap page can
   recommend relevant learning topics next to milestones.
2. Completion XP uses LEARNING_VIDEO (20) / LEARNING_ARTICLE (15) /
   LEARNING_ROADMAP_PHASE (100) constants already defined in xp-rules.ts.
   The frontend awards XP via awardXp() on topic completion.
*/
-- ============ learning_topics (catalog) ============
CREATE TABLE IF NOT EXISTS learning_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  skill text NOT NULL,
  track text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'beginner',
  order_index integer NOT NULL DEFAULT 0,
  estimated_minutes integer NOT NULL DEFAULT 30,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_learning_topics" ON learning_topics;
CREATE POLICY "read_learning_topics"
  ON learning_topics FOR SELECT TO authenticated
  USING (true);

-- ============ learning_resources (catalog) ============
CREATE TABLE IF NOT EXISTS learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  resource_type text NOT NULL DEFAULT 'article',
  url text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_learning_resources" ON learning_resources;
CREATE POLICY "read_learning_resources"
  ON learning_resources FOR SELECT TO authenticated
  USING (true);

-- ============ user_learning_progress ============
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES learning_topics(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress',
  completed_at timestamptz,
  xp_earned integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, topic_id)
);

ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_learning_progress" ON user_learning_progress;
CREATE POLICY "select_own_learning_progress"
  ON user_learning_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_learning_progress" ON user_learning_progress;
CREATE POLICY "insert_own_learning_progress"
  ON user_learning_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_learning_progress" ON user_learning_progress;
CREATE POLICY "update_own_learning_progress"
  ON user_learning_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_learning_progress" ON user_learning_progress;
CREATE POLICY "delete_own_learning_progress"
  ON user_learning_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_learning_topics_skill ON learning_topics(skill);
CREATE INDEX IF NOT EXISTS idx_learning_topics_track ON learning_topics(track);
CREATE INDEX IF NOT EXISTS idx_learning_resources_topic_id ON learning_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_progress_user_id ON user_learning_progress(user_id);

-- ============ Seed: Java ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('java-fundamentals', 'Java Fundamentals', 'Master Java syntax, variables, data types, operators, and control flow statements.', 'Java', 'Programming', 'beginner', 1, 45, ARRAY['Syntax', 'Variables', 'Control Flow']),
  ('java-oop', 'Object-Oriented Programming in Java', 'Learn classes, objects, inheritance, polymorphism, encapsulation, and abstraction in Java.', 'Java', 'Programming', 'beginner', 2, 60, ARRAY['OOP', 'Classes', 'Inheritance']),
  ('java-collections', 'Java Collections Framework', 'Master List, Set, Map, Queue interfaces and their implementations like ArrayList, HashMap, HashSet.', 'Java', 'Programming', 'intermediate', 3, 75, ARRAY['Collections', 'Generics', 'HashMap']),
  ('java-concurrency', 'Java Concurrency & Multithreading', 'Learn threads, Runnable, synchronization, executors, and concurrent collections.', 'Java', 'Programming', 'advanced', 4, 90, ARRAY['Threads', 'Concurrency', 'Synchronization'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Tutorial for Beginners', 'Complete Java basics walkthrough by Programming with Mosh.', 'video', 'https://www.youtube.com/watch?v=eIrMbAQSU34', 106, 'YouTube', 1 FROM learning_topics WHERE slug = 'java-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Variables and Data Types', 'Official Oracle documentation covering primitive types and variables.', 'document', 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html', 20, 'Oracle Docs', 2 FROM learning_topics WHERE slug = 'java-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Basics in 10 Minutes', 'Quick article covering syntax, variables, and control flow.', 'article', 'https://www.javatpoint.com/java-basics', 10, 'Javatpoint', 3 FROM learning_topics WHERE slug = 'java-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java OOP Concepts in 1 Hour', 'Full OOP crash course with code examples.', 'video', 'https://www.youtube.com/watch?v=6T_6rOvs56o', 60, 'YouTube', 1 FROM learning_topics WHERE slug = 'java-oop';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Inheritance in Java', 'Deep dive article on inheritance with examples.', 'article', 'https://www.geeksforgeeks.org/inheritance-in-java/', 15, 'GeeksforGeeks', 2 FROM learning_topics WHERE slug = 'java-oop';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java OOP Cheat Sheet', 'One-page reference for all OOP concepts.', 'document', 'https://introcs.cs.princeton.edu/java/11cheatsheet/', 10, 'Princeton', 3 FROM learning_topics WHERE slug = 'java-oop';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Collections Framework', 'Comprehensive collections tutorial with examples.', 'video', 'https://www.youtube.com/watch?v=o2Q34kD9SR8', 75, 'YouTube', 1 FROM learning_topics WHERE slug = 'java-collections';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'ArrayList vs LinkedList in Java', 'Comparison article with performance analysis.', 'article', 'https://www.baeldung.com/java-arraylist-vs-linkedlist', 12, 'Baeldung', 2 FROM learning_topics WHERE slug = 'java-collections';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Multithreading Crash Course', 'Learn threads, synchronization, and executors.', 'video', 'https://www.youtube.com/watch?v=uQxsN0OlCxA', 90, 'YouTube', 1 FROM learning_topics WHERE slug = 'java-concurrency';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Java Concurrency in Practice', 'Article covering best practices for thread safety.', 'article', 'https://www.baeldung.com/java-concurrency', 20, 'Baeldung', 2 FROM learning_topics WHERE slug = 'java-concurrency';

-- ============ Seed: DSA ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('dsa-arrays-strings', 'Arrays & Strings', 'Master array traversal, two pointers, sliding window, and string manipulation patterns.', 'DSA', 'Problem Solving', 'beginner', 1, 60, ARRAY['Arrays', 'Two Pointers', 'Sliding Window']),
  ('dsa-trees-graphs', 'Trees & Graphs', 'Learn binary trees, BSTs, tree traversals, graph representations, BFS, and DFS.', 'DSA', 'Problem Solving', 'intermediate', 2, 90, ARRAY['Trees', 'Graphs', 'BFS', 'DFS']),
  ('dsa-dynamic-programming', 'Dynamic Programming', 'Master memoization, tabulation, and common DP patterns like knapsack and LIS.', 'DSA', 'Problem Solving', 'advanced', 3, 120, ARRAY['DP', 'Memoization', 'Tabulation']),
  ('dsa-graph-algorithms', 'Graph Algorithms', 'Learn Dijkstra, Bellman-Ford, MST, topological sort, and union-find.', 'DSA', 'Problem Solving', 'advanced', 4, 100, ARRAY['Dijkstra', 'MST', 'Topological Sort'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Arrays and Strings — Cracking the Coding Interview', 'Detailed walkthrough of array and string problems.', 'video', 'https://www.youtube.com/watch?v=kekkcuajpZU', 45, 'YouTube', 1 FROM learning_topics WHERE slug = 'dsa-arrays-strings';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Sliding Window Technique', 'Article explaining the sliding window pattern with 5 examples.', 'article', 'https://www.geeksforgeeks.org/window-sliding-technique/', 15, 'GeeksforGeeks', 2 FROM learning_topics WHERE slug = 'dsa-arrays-strings';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Trees and Graphs — Data Structures', 'Complete tree and graph tutorial with visualizations.', 'video', 'https://www.youtube.com/watch?v=RBSGKlAvoiM', 90, 'YouTube', 1 FROM learning_topics WHERE slug = 'dsa-trees-graphs';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Binary Tree Traversals', 'Article covering inorder, preorder, postorder, and level-order traversal.', 'article', 'https://www.programiz.com/dsa/tree-traversal', 12, 'Programiz', 2 FROM learning_topics WHERE slug = 'dsa-trees-graphs';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Graph BFS and DFS Cheat Sheet', 'Quick reference for BFS and DFS implementations.', 'document', 'https://www.techinterviewhandbook.org/algorithms/graph/', 10, 'Tech Interview Handbook', 3 FROM learning_topics WHERE slug = 'dsa-trees-graphs';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Dynamic Programming — Free Code Camp', 'Full DP course from basics to advanced patterns.', 'video', 'https://www.youtube.com/watch?v=oBt53YbRB9c', 120, 'YouTube', 1 FROM learning_topics WHERE slug = 'dsa-dynamic-programming';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'DP Patterns Summary', 'Article listing 6 common DP patterns with template code.', 'article', 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns', 20, 'LeetCode', 2 FROM learning_topics WHERE slug = 'dsa-dynamic-programming';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Graph Algorithms Full Course', 'Dijkstra, MST, topological sort, and more.', 'video', 'https://www.youtube.com/watch?v=09_LlWm5KnM', 100, 'YouTube', 1 FROM learning_topics WHERE slug = 'dsa-graph-algorithms';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Dijkstra Algorithm Explained', 'Step-by-step article with code.', 'article', 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/', 15, 'GeeksforGeeks', 2 FROM learning_topics WHERE slug = 'dsa-graph-algorithms';

-- ============ Seed: SQL ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('sql-fundamentals', 'SQL Fundamentals', 'Learn SELECT, WHERE, ORDER BY, LIMIT, and basic filtering in SQL.', 'SQL', 'Database', 'beginner', 1, 40, ARRAY['SELECT', 'WHERE', 'Filtering']),
  ('sql-joins', 'SQL Joins & Relationships', 'Master INNER, LEFT, RIGHT, and FULL JOINs with real-world examples.', 'SQL', 'Database', 'beginner', 2, 50, ARRAY['JOINs', 'INNER JOIN', 'LEFT JOIN']),
  ('sql-aggregation', 'Aggregation & Grouping', 'Learn GROUP BY, HAVING, COUNT, SUM, AVG, and aggregate functions.', 'SQL', 'Database', 'intermediate', 3, 55, ARRAY['GROUP BY', 'HAVING', 'Aggregation']),
  ('sql-advanced', 'Advanced SQL & Optimization', 'Master subqueries, window functions, CTEs, indexes, and query optimization.', 'SQL', 'Database', 'advanced', 4, 80, ARRAY['Window Functions', 'CTEs', 'Indexes'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL Tutorial for Beginners', 'Full SQL basics course in one video.', 'video', 'https://www.youtube.com/watch?v=HXV3zeQKqGY', 60, 'YouTube', 1 FROM learning_topics WHERE slug = 'sql-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL SELECT Statement', 'W3Schools reference for SELECT with examples.', 'document', 'https://www.w3schools.com/sql/sql_select.asp', 10, 'W3Schools', 2 FROM learning_topics WHERE slug = 'sql-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL Joins Explained Visually', 'Visual guide to all join types.', 'video', 'https://www.youtube.com/watch?v=9yeKJ_q3t4o', 50, 'YouTube', 1 FROM learning_topics WHERE slug = 'sql-joins';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL Joins Cheat Sheet', 'One-page reference for all join types.', 'document', 'https://www.codecademy.com/learn/learn-sql/modules/learn-sql-manipulation/cheatsheet', 8, 'Codecademy', 2 FROM learning_topics WHERE slug = 'sql-joins';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL GROUP BY and HAVING', 'Article with 10 practice queries.', 'article', 'https://www.sqltutorial.org/sql-group-by/', 15, 'SQL Tutorial', 1 FROM learning_topics WHERE slug = 'sql-aggregation';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Aggregate Functions in SQL', 'Video covering COUNT, SUM, AVG, MIN, MAX.', 'video', 'https://www.youtube.com/watch?v=j5j3VkX6BlE', 55, 'YouTube', 2 FROM learning_topics WHERE slug = 'sql-aggregation';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL Window Functions Tutorial', 'Complete guide to ROW_NUMBER, RANK, LAG, LEAD.', 'video', 'https://www.youtube.com/watch?v=H6OKxUSjQMo', 80, 'YouTube', 1 FROM learning_topics WHERE slug = 'sql-advanced';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL CTEs Explained', 'Article on Common Table Expressions with examples.', 'article', 'https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-cte/', 18, 'PostgreSQL Tutorial', 2 FROM learning_topics WHERE slug = 'sql-advanced';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'SQL Indexing and Optimization Guide', 'Deep article on index strategies and query plans.', 'document', 'https://use-the-index-luke.com/', 25, 'Use The Index Luke', 3 FROM learning_topics WHERE slug = 'sql-advanced';

-- ============ Seed: React ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('react-fundamentals', 'React Fundamentals', 'Learn JSX, components, props, state, and event handling in React.', 'React', 'Web Dev', 'beginner', 1, 60, ARRAY['JSX', 'Components', 'Props', 'State']),
  ('react-hooks', 'React Hooks Deep Dive', 'Master useState, useEffect, useContext, useReducer, and custom hooks.', 'React', 'Web Dev', 'intermediate', 2, 75, ARRAY['Hooks', 'useState', 'useEffect', 'useContext']),
  ('react-routing', 'React Router & Navigation', 'Learn client-side routing, dynamic routes, nested routes, and navigation.', 'React', 'Web Dev', 'intermediate', 3, 45, ARRAY['Router', 'Navigation', 'Routes']),
  ('react-state-management', 'State Management with Zustand', 'Learn global state management with Zustand and Context API patterns.', 'React', 'Web Dev', 'advanced', 4, 70, ARRAY['Zustand', 'Context API', 'Global State'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'React Tutorial for Beginners', 'Full React crash course by Programming with Mosh.', 'video', 'https://www.youtube.com/watch?v=SqcY0GlET1k', 60, 'YouTube', 1 FROM learning_topics WHERE slug = 'react-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'React Quick Start Guide', 'Official React docs quick start for building your first component.', 'document', 'https://react.dev/learn', 30, 'React Docs', 2 FROM learning_topics WHERE slug = 'react-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'React Hooks Full Course', 'Complete hooks tutorial with real projects.', 'video', 'https://www.youtube.com/watch?v=O6P6uwWn9Bw', 75, 'YouTube', 1 FROM learning_topics WHERE slug = 'react-hooks';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'useEffect Complete Guide', 'Article on useEffect dependencies, cleanup, and common pitfalls.', 'article', 'https://overreacted.io/a-complete-guide-to-useeffect/', 20, 'Overreacted', 2 FROM learning_topics WHERE slug = 'react-hooks';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'React Router v6 Tutorial', 'Learn routing with React Router v6.', 'video', 'https://www.youtube.com/watch?v=k2ZJ3K9NlGE', 45, 'YouTube', 1 FROM learning_topics WHERE slug = 'react-routing';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'React Router Documentation', 'Official router docs with examples.', 'document', 'https://reactrouter.com/en/main/start/tutorial', 15, 'React Router Docs', 2 FROM learning_topics WHERE slug = 'react-routing';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Zustand State Management', 'Complete Zustand tutorial for React.', 'video', 'https://www.youtube.com/watch?v=5tof7vZq7mA', 70, 'YouTube', 1 FROM learning_topics WHERE slug = 'react-state-management';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Zustand vs Context API', 'Comparison article on when to use each approach.', 'article', 'https://tkdodo.eu/blog/zustand-and-react-context', 12, 'TkDodo Blog', 2 FROM learning_topics WHERE slug = 'react-state-management';

-- ============ Seed: Spring Boot ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('spring-boot-fundamentals', 'Spring Boot Fundamentals', 'Learn Spring Boot setup, auto-configuration, REST controllers, and project structure.', 'Spring Boot', 'Backend', 'beginner', 1, 60, ARRAY['Spring Boot', 'REST', 'Auto-Config']),
  ('spring-boot-jpa', 'Spring Data JPA & Database', 'Master entities, repositories, relationships, and database operations with JPA.', 'Spring Boot', 'Backend', 'intermediate', 2, 80, ARRAY['JPA', 'Entities', 'Repositories', 'Hibernate']),
  ('spring-boot-security', 'Spring Security & Authentication', 'Learn JWT authentication, Spring Security filters, and role-based access control.', 'Spring Boot', 'Backend', 'advanced', 3, 90, ARRAY['Security', 'JWT', 'Authentication', 'RBAC'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Boot Tutorial for Beginners', 'Full Spring Boot crash course.', 'video', 'https://www.youtube.com/watch?v=vtPkZvP1jBE', 60, 'YouTube', 1 FROM learning_topics WHERE slug = 'spring-boot-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Boot Reference Documentation', 'Official Spring Boot reference guide.', 'document', 'https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/', 30, 'Spring Docs', 2 FROM learning_topics WHERE slug = 'spring-boot-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Data JPA Full Course', 'Learn JPA entities, repositories, and queries.', 'video', 'https://www.youtube.com/watch?v=8fHqLD5Jp5w', 80, 'YouTube', 1 FROM learning_topics WHERE slug = 'spring-boot-jpa';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Data JPA Guide', 'Article on entities, relationships, and custom queries.', 'article', 'https://spring.io/guides/gs/accessing-data-jpa/', 20, 'Spring Guides', 2 FROM learning_topics WHERE slug = 'spring-boot-jpa';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Security + JWT Tutorial', 'Implement JWT auth with Spring Security.', 'video', 'https://www.youtube.com/watch?v=K7nu0QRPpZk', 90, 'YouTube', 1 FROM learning_topics WHERE slug = 'spring-boot-security';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Spring Security Architecture', 'Article on filter chains and security context.', 'article', 'https://spring.io/guides/topicals/spring-security-architecture/', 25, 'Spring Guides', 2 FROM learning_topics WHERE slug = 'spring-boot-security';

-- ============ Seed: Git ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('git-fundamentals', 'Git Fundamentals', 'Learn init, add, commit, log, status, and basic Git workflows.', 'Git', 'Tools', 'beginner', 1, 30, ARRAY['Git', 'Commit', 'Repository']),
  ('git-branching', 'Git Branching & Merging', 'Master branch, checkout, merge, rebase, and conflict resolution.', 'Git', 'Tools', 'intermediate', 2, 40, ARRAY['Branching', 'Merge', 'Rebase', 'Conflicts']),
  ('git-collaboration', 'Git Collaboration & Workflows', 'Learn pull requests, code reviews, GitFlow, and team collaboration patterns.', 'Git', 'Tools', 'advanced', 3, 45, ARRAY['Pull Requests', 'GitFlow', 'Code Review'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Git Tutorial for Beginners', 'Learn Git basics in 30 minutes.', 'video', 'https://www.youtube.com/watch?v=8JJ101D3bnE', 30, 'YouTube', 1 FROM learning_topics WHERE slug = 'git-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Git Handbook', 'GitHub guide covering essential Git commands.', 'document', 'https://docs.github.com/en/get-started/using-git/about-git', 15, 'GitHub Docs', 2 FROM learning_topics WHERE slug = 'git-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Git Branching and Merging', 'Visual Git branching tutorial.', 'video', 'https://www.youtube.com/watch?v=PPQ8myk-Pzk', 40, 'YouTube', 1 FROM learning_topics WHERE slug = 'git-branching';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Learn Git Branching', 'Interactive visual Git branching playground.', 'document', 'https://learngitbranching.js.org/', 20, 'LearnGitBranching', 2 FROM learning_topics WHERE slug = 'git-branching';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Git Pull Requests Explained', 'How PRs work and best practices for code review.', 'video', 'https://www.youtube.com/watch?v=ForFVDDWXg0', 45, 'YouTube', 1 FROM learning_topics WHERE slug = 'git-collaboration';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'GitFlow Workflow Guide', 'Article on the GitFlow branching model.', 'article', 'https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow', 12, 'Atlassian', 2 FROM learning_topics WHERE slug = 'git-collaboration';

-- ============ Seed: Docker ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('docker-fundamentals', 'Docker Fundamentals', 'Learn containers vs VMs, Docker installation, and basic commands.', 'Docker', 'DevOps', 'beginner', 1, 40, ARRAY['Docker', 'Containers', 'Images']),
  ('docker-dockerfile', 'Dockerfile & Image Building', 'Master Dockerfile syntax, multi-stage builds, and image optimization.', 'Docker', 'DevOps', 'intermediate', 2, 55, ARRAY['Dockerfile', 'Multi-stage', 'Build']),
  ('docker-compose', 'Docker Compose & Multi-Container Apps', 'Learn docker-compose to orchestrate multi-container applications.', 'Docker', 'DevOps', 'advanced', 3, 50, ARRAY['Compose', 'Orchestration', 'Services'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Docker Tutorial for Beginners', 'Full Docker crash course.', 'video', 'https://www.youtube.com/watch?v=8gCh7RVNA5E', 40, 'YouTube', 1 FROM learning_topics WHERE slug = 'docker-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Docker Getting Started Guide', 'Official Docker documentation for beginners.', 'document', 'https://docs.docker.com/get-started/', 20, 'Docker Docs', 2 FROM learning_topics WHERE slug = 'docker-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Dockerfile Tutorial', 'Learn how to write and optimize Dockerfiles.', 'video', 'https://www.youtube.com/watch?v=8gCh7RVNA5E', 55, 'YouTube', 1 FROM learning_topics WHERE slug = 'docker-dockerfile';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Dockerfile Reference', 'Official Dockerfile instruction reference.', 'document', 'https://docs.docker.com/engine/reference/builder/', 15, 'Docker Docs', 2 FROM learning_topics WHERE slug = 'docker-dockerfile';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Docker Compose Tutorial', 'Learn to orchestrate multi-container apps.', 'video', 'https://www.youtube.com/watch?v=DM65fMj9z4o', 50, 'YouTube', 1 FROM learning_topics WHERE slug = 'docker-compose';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'Docker Compose Documentation', 'Official compose file reference and guide.', 'document', 'https://docs.docker.com/compose/', 15, 'Docker Docs', 2 FROM learning_topics WHERE slug = 'docker-compose';

-- ============ Seed: AWS ============
INSERT INTO learning_topics (slug, title, description, skill, track, difficulty, order_index, estimated_minutes, tags) VALUES
  ('aws-fundamentals', 'AWS Fundamentals', 'Learn core AWS services: EC2, S3, IAM, and the AWS console.', 'AWS', 'Cloud', 'beginner', 1, 50, ARRAY['AWS', 'EC2', 'S3', 'IAM']),
  ('aws-ec2-vpc', 'EC2 & VPC Networking', 'Master EC2 instances, VPCs, subnets, security groups, and networking.', 'AWS', 'Cloud', 'intermediate', 2, 65, ARRAY['EC2', 'VPC', 'Subnets', 'Security Groups']),
  ('aws-deployment', 'AWS Deployment & CI/CD', 'Learn CodePipeline, CodeDeploy, Elastic Beanstalk, and deployment strategies.', 'AWS', 'Cloud', 'advanced', 3, 75, ARRAY['CodePipeline', 'Elastic Beanstalk', 'CI/CD'])
ON CONFLICT (slug) DO NOTHING;

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS Course for Beginners', 'Full AWS fundamentals crash course.', 'video', 'https://www.youtube.com/watch?v=k1TI7GqWnJ8', 50, 'YouTube', 1 FROM learning_topics WHERE slug = 'aws-fundamentals';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS Getting Started Guide', 'Official AWS documentation for core services.', 'document', 'https://docs.aws.amazon.com/gettingstarted/latest/awsgsg-intro/gsg-aws-intro.html', 20, 'AWS Docs', 2 FROM learning_topics WHERE slug = 'aws-fundamentals';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS VPC and EC2 Tutorial', 'Learn VPC setup and EC2 instance management.', 'video', 'https://www.youtube.com/watch?v=jZr3aMqVZAE', 65, 'YouTube', 1 FROM learning_topics WHERE slug = 'aws-ec2-vpc';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS VPC User Guide', 'Official VPC documentation with networking concepts.', 'document', 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html', 25, 'AWS Docs', 2 FROM learning_topics WHERE slug = 'aws-ec2-vpc';

INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS CI/CD Pipeline Tutorial', 'Build a full CI/CD pipeline with AWS CodePipeline.', 'video', 'https://www.youtube.com/watch?v=NkR-cQOjS2Q', 75, 'YouTube', 1 FROM learning_topics WHERE slug = 'aws-deployment';
INSERT INTO learning_resources (topic_id, title, description, resource_type, url, duration_minutes, source, order_index)
  SELECT id, 'AWS Elastic Beanstalk Guide', 'Article on deploying apps with Elastic Beanstalk.', 'article', 'https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html', 20, 'AWS Docs', 2 FROM learning_topics WHERE slug = 'aws-deployment';
