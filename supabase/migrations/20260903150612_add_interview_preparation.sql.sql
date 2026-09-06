/*
# CampusX — Interview Preparation Module

## Overview
Adds a question bank for 9 interview categories and extends the existing
interviews table to store per-session evaluation breakdowns and chat
transcripts. An edge function generates role-targeted questions, evaluates
answers, and produces a final score across 4 dimensions.

## New Tables
1. `interview_questions`
   - Question bank: category, difficulty, question text, tags, role hints.
   - Seeded with questions across DSA, OOP, DBMS, OS, CN, Development,
     System Design, HR, and Resume/Project.

## Altered Tables
2. `interviews` (existing) — add columns:
   - category text (which of the 9 categories)
   - evaluation jsonb (4-dimension scores + per-answer feedback)
   - transcript jsonb (full Q&A chat history)
*/

-- ============ interview_questions ============
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  question text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  role_hints text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_interview_questions" ON interview_questions;
CREATE POLICY "select_interview_questions"
  ON interview_questions FOR SELECT TO authenticated
  USING (true);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON interview_questions(category);

-- ============ Extend interviews table ============
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS category text DEFAULT '',
  ADD COLUMN IF NOT EXISTS evaluation jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS transcript jsonb DEFAULT '[]'::jsonb;

-- ============ Seed questions across 9 categories ============
INSERT INTO interview_questions (category, difficulty, question, tags, role_hints) VALUES
-- DSA
('DSA', 'easy', 'What is the difference between an array and a linked list? When would you use each?', ARRAY['arrays','linked-list','data-structures'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer']),
('DSA', 'easy', 'Explain time complexity and Big O notation. What is the time complexity of binary search?', ARRAY['time-complexity','big-o','binary-search'], ARRAY['Software Engineer','Data Scientist']),
('DSA', 'medium', 'How would you detect a cycle in a linked list? Explain Floyd''s cycle detection algorithm.', ARRAY['linked-list','cycle-detection','floyd'], ARRAY['Software Engineer','Backend Developer']),
('DSA', 'medium', 'Explain the difference between BFS and DFS. When would you prefer one over the other?', ARRAY['bfs','dfs','graphs','traversal'], ARRAY['Software Engineer','Data Scientist']),
('DSA', 'medium', 'How does a hash table work? Explain collision resolution strategies.', ARRAY['hash-table','collision','hashing'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer']),
('DSA', 'hard', 'Explain dynamic programming. How would you solve the 0/1 knapsack problem?', ARRAY['dynamic-programming','knapsack','optimization'], ARRAY['Software Engineer','Data Scientist']),
('DSA', 'hard', 'How would you find the k-th smallest element in an unsorted array? Compare min-heap vs quickselect approaches.', ARRAY['heap','quickselect','selection'], ARRAY['Software Engineer']),
('DSA', 'medium', 'What is a balanced BST? Compare AVL trees and Red-Black trees.', ARRAY['bst','avl-tree','red-black-tree'], ARRAY['Software Engineer']),

-- OOP
('OOP', 'easy', 'What are the four pillars of OOP? Explain each with an example.', ARRAY['oop','encapsulation','inheritance','polymorphism','abstraction'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer','Mobile Developer']),
('OOP', 'easy', 'What is the difference between abstract classes and interfaces? When would you use each?', ARRAY['abstract-class','interface','oop'], ARRAY['Software Engineer','Backend Developer','Mobile Developer']),
('OOP', 'medium', 'Explain the SOLID principles. Give an example of a principle being violated and how to fix it.', ARRAY['solid','design-principles','oop'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer']),
('OOP', 'medium', 'What is the difference between composition and inheritance? Which is preferred and why?', ARRAY['composition','inheritance','design'], ARRAY['Software Engineer','Backend Developer','Mobile Developer']),
('OOP', 'medium', 'Explain method overloading vs method overriding with examples.', ARRAY['overloading','overriding','polymorphism'], ARRAY['Software Engineer','Backend Developer','Mobile Developer']),
('OOP', 'hard', 'Design a parking lot system using OOP principles. What classes and relationships would you define?', ARRAY['design-pattern','system-design','oop'], ARRAY['Software Engineer','Full Stack Developer']),

-- DBMS
('DBMS', 'easy', 'What is normalization? Explain 1NF, 2NF, and 3NF with examples.', ARRAY['normalization','1nf','2nf','3nf','database'], ARRAY['Backend Developer','Full Stack Developer','Data Scientist','Software Engineer']),
('DBMS', 'easy', 'What is the difference between SQL and NoSQL databases? When would you choose each?', ARRAY['sql','nosql','database'], ARRAY['Backend Developer','Full Stack Developer','DevOps Engineer']),
('DBMS', 'medium', 'Explain ACID properties in database transactions. Why are they important?', ARRAY['acid','transactions','database'], ARRAY['Backend Developer','Full Stack Developer','Software Engineer']),
('DBMS', 'medium', 'What is an index in a database? Compare B-tree and hash indexes.', ARRAY['index','b-tree','hash-index','database'], ARRAY['Backend Developer','Full Stack Developer','Data Scientist']),
('DBMS', 'medium', 'Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.', ARRAY['joins','sql','database'], ARRAY['Backend Developer','Full Stack Developer','Data Scientist','Software Engineer']),
('DBMS', 'hard', 'How would you optimize a slow query? Explain query execution plans and indexing strategies.', ARRAY['query-optimization','indexing','performance','database'], ARRAY['Backend Developer','Full Stack Developer']),

-- OS
('OS', 'easy', 'What is the difference between a process and a thread?', ARRAY['process','thread','os'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('OS', 'easy', 'Explain virtual memory and paging. How does it work?', ARRAY['virtual-memory','paging','os'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('OS', 'medium', 'What are semaphores and mutexes? How do they differ?', ARRAY['semaphore','mutex','synchronization','os'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('OS', 'medium', 'Explain process scheduling algorithms: FCFS, SJF, Round Robin. Compare them.', ARRAY['scheduling','fcfs','sjf','round-robin','os'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('OS', 'medium', 'What is a deadlock? Explain the four necessary conditions for deadlock.', ARRAY['deadlock','os','synchronization'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('OS', 'hard', 'Explain how memory management works in modern operating systems. Compare segmentation and paging.', ARRAY['memory-management','segmentation','paging','os'], ARRAY['Software Engineer','DevOps Engineer']),

-- CN
('CN', 'easy', 'What is the OSI model? Explain each layer briefly.', ARRAY['osi-model','networking','cn'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('CN', 'easy', 'What is the difference between TCP and UDP? When would you use each?', ARRAY['tcp','udp','networking','cn'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer','Mobile Developer']),
('CN', 'medium', 'Explain the TCP three-way handshake. Why is it necessary?', ARRAY['tcp','handshake','networking','cn'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer']),
('CN', 'medium', 'What is DNS? Explain how DNS resolution works step by step.', ARRAY['dns','networking','cn'], ARRAY['Software Engineer','Backend Developer','DevOps Engineer','Full Stack Developer']),
('CN', 'medium', 'What is the difference between HTTP and HTTPS? Explain SSL/TLS handshake.', ARRAY['http','https','ssl','tls','networking'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer','DevOps Engineer']),
('CN', 'hard', 'Explain how load balancing works. Compare Layer 4 and Layer 7 load balancers.', ARRAY['load-balancing','networking','cn'], ARRAY['Backend Developer','DevOps Engineer','Software Engineer']),

-- Development
('Development', 'easy', 'What is the difference between frontend and backend development?', ARRAY['frontend','backend','development'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer']),
('Development', 'easy', 'Explain REST API principles. What are HTTP methods and their uses?', ARRAY['rest','api','http','development'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Mobile Developer']),
('Development', 'medium', 'What is CORS and why does it matter? How do you handle it?', ARRAY['cors','security','web','development'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer']),
('Development', 'medium', 'Explain the difference between JWT and session-based authentication.', ARRAY['jwt','authentication','session','security'], ARRAY['Backend Developer','Full Stack Developer','Mobile Developer']),
('Development', 'medium', 'What is Docker? How does containerization differ from virtualization?', ARRAY['docker','containerization','devops','development'], ARRAY['DevOps Engineer','Backend Developer','Full Stack Developer']),
('Development', 'hard', 'Explain microservices architecture. What are its advantages and challenges vs a monolith?', ARRAY['microservices','architecture','development'], ARRAY['Backend Developer','DevOps Engineer','Full Stack Developer']),

-- System Design
('System Design', 'easy', 'What is horizontal vs vertical scaling? Give examples of each.', ARRAY['scaling','system-design'], ARRAY['Backend Developer','DevOps Engineer','Software Engineer','Full Stack Developer']),
('System Design', 'medium', 'Design a URL shortener like bit.ly. What components would you use?', ARRAY['url-shortener','system-design','architecture'], ARRAY['Backend Developer','Software Engineer','Full Stack Developer']),
('System Design', 'medium', 'How would you design a rate limiter? Explain token bucket and sliding window algorithms.', ARRAY['rate-limiter','system-design','algorithms'], ARRAY['Backend Developer','DevOps Engineer','Software Engineer']),
('System Design', 'medium', 'Design a chat application like WhatsApp. What architectural decisions would you make?', ARRAY['chat-app','system-design','websocket','realtime'], ARRAY['Backend Developer','Full Stack Developer','Mobile Developer']),
('System Design', 'hard', 'Design a distributed cache system. How would you handle cache invalidation and consistency?', ARRAY['cache','distributed','redis','system-design'], ARRAY['Backend Developer','DevOps Engineer']),
('System Design', 'hard', 'How would you design a system that handles 1 million concurrent users? Discuss load balancing, caching, and database strategies.', ARRAY['scalability','load-balancing','caching','system-design'], ARRAY['Backend Developer','DevOps Engineer','Software Engineer']),

-- HR
('HR', 'easy', 'Tell me about yourself. Why do you want to work in this role?', ARRAY['introduction','motivation','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('HR', 'easy', 'What are your greatest strengths and weaknesses?', ARRAY['strengths','weaknesses','self-awareness','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('HR', 'medium', 'Describe a challenging project you worked on. What was your role and how did you overcome obstacles?', ARRAY['challenge','project','problem-solving','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('HR', 'medium', 'How do you handle conflicts within a team? Give an example.', ARRAY['conflict','teamwork','communication','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('HR', 'medium', 'Where do you see yourself in 5 years? How does this role align with your career goals?', ARRAY['career-goals','future','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('HR', 'medium', 'Why should we hire you? What makes you different from other candidates?', ARRAY['unique-value','hiring','hr'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),

-- Resume/Project
('Resume/Project', 'easy', 'Walk me through your resume. Highlight the most relevant experience for this role.', ARRAY['resume','experience','overview'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('Resume/Project', 'medium', 'Tell me about a project you are proud of. What technologies did you use and what was your specific contribution?', ARRAY['project','technologies','contribution','resume'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('Resume/Project', 'medium', 'Describe a bug or technical challenge you solved. What was your debugging process?', ARRAY['debugging','problem-solving','project'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('Resume/Project', 'medium', 'If you could redo one of your projects, what would you change and why?', ARRAY['reflection','improvement','project'], ARRAY['Frontend Developer','Backend Developer','Full Stack Developer','Software Engineer','Data Scientist','DevOps Engineer','Mobile Developer','QA Engineer']),
('Resume/Project', 'hard', 'How do you ensure code quality in your projects? Describe your testing strategy and code review process.', ARRAY['code-quality','testing','code-review','project'], ARRAY['Software Engineer','Backend Developer','Full Stack Developer','QA Engineer'])
ON CONFLICT DO NOTHING;
