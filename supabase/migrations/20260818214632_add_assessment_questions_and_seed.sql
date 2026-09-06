/*
# CampusX — Assessment Questions Table + Skill Catalog Seed

## Overview
Adds an `assessment_questions` table to store multiple-choice questions for
each assessment, and seeds the `skills` catalog with 6 core skill categories
plus their assessments and questions. This powers the Skill Assessment module.

## New Table

1. `assessment_questions`
   - MCQ questions tied to an assessment.
   - Fields: `id`, `assessment_id` (FK), `question_text`, `option_a`,
     `option_b`, `option_c`, `option_d`, `correct_option` ('a'|'b'|'c'|'d'),
     `explanation`, `order_index`.
   - RLS: authenticated users can read (SELECT) all questions — needed to
     display them during an assessment. No user-side writes.

## Seed Data

### Skills catalog (6 categories)
1. Programming — Python
2. DSA — Data Structures & Algorithms
3. Database — DBMS
4. Web Dev — Full-Stack Development
5. Cloud — Cloud Computing
6. CS Fundamentals — Operating Systems & Networks

### Assessments
One assessment per skill, each with 5 MCQ questions (30 total).

### Security
- RLS enabled on `assessment_questions`.
- SELECT policy for authenticated users (catalog data, shared read).
*/

-- ============ assessment_questions ============
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option char(1) NOT NULL CHECK (correct_option IN ('a','b','c','d')),
  explanation text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0
);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_assessment_questions" ON assessment_questions;
CREATE POLICY "read_assessment_questions"
  ON assessment_questions FOR SELECT TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);

-- ============ Seed skills catalog ============
-- Using a DO block with ON CONFLICT to make it idempotent.
DO $$
DECLARE
  prog_skill uuid;
  dsa_skill uuid;
  db_skill uuid;
  web_skill uuid;
  cloud_skill uuid;
  cs_skill uuid;
  prog_assess uuid;
  dsa_assess uuid;
  db_assess uuid;
  web_assess uuid;
  cloud_assess uuid;
  cs_assess uuid;
BEGIN
  -- Insert skills (idempotent by name)
  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('Python', 'Programming', 'Code', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO prog_skill;

  IF prog_skill IS NULL THEN
    SELECT id INTO prog_skill FROM skills WHERE name = 'Python';
  END IF;

  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('Data Structures & Algorithms', 'DSA', 'Boxes', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO dsa_skill;

  IF dsa_skill IS NULL THEN
    SELECT id INTO dsa_skill FROM skills WHERE name = 'Data Structures & Algorithms';
  END IF;

  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('DBMS', 'Database', 'Database', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO db_skill;

  IF db_skill IS NULL THEN
    SELECT id INTO db_skill FROM skills WHERE name = 'DBMS';
  END IF;

  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('Full-Stack Development', 'Web Dev', 'Atom', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO web_skill;

  IF web_skill IS NULL THEN
    SELECT id INTO web_skill FROM skills WHERE name = 'Full-Stack Development';
  END IF;

  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('Cloud Computing', 'Cloud', 'Cloud', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO cloud_skill;

  IF cloud_skill IS NULL THEN
    SELECT id INTO cloud_skill FROM skills WHERE name = 'Cloud Computing';
  END IF;

  INSERT INTO skills (name, category, icon_name, max_level) VALUES
    ('CS Fundamentals', 'CS Fundamentals', 'Network', 5)
  ON CONFLICT DO NOTHING
  RETURNING id INTO cs_skill;

  IF cs_skill IS NULL THEN
    SELECT id INTO cs_skill FROM skills WHERE name = 'CS Fundamentals';
  END IF;

  -- Insert assessments (idempotent by skill_id + title)
  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (prog_skill, 'Python Programming Assessment', 'Test your Python fundamentals: syntax, data types, OOP, and best practices.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO prog_assess;

  IF prog_assess IS NULL THEN
    SELECT id INTO prog_assess FROM assessments WHERE skill_id = prog_skill AND title = 'Python Programming Assessment';
  END IF;

  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (dsa_skill, 'DSA Assessment', 'Test your knowledge of data structures, algorithms, and complexity analysis.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO dsa_assess;

  IF dsa_assess IS NULL THEN
    SELECT id INTO dsa_assess FROM assessments WHERE skill_id = dsa_skill AND title = 'DSA Assessment';
  END IF;

  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (db_skill, 'DBMS Assessment', 'Test your understanding of relational databases, normalization, and SQL.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO db_assess;

  IF db_assess IS NULL THEN
    SELECT id INTO db_assess FROM assessments WHERE skill_id = db_skill AND title = 'DBMS Assessment';
  END IF;

  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (web_skill, 'Full-Stack Development Assessment', 'Test your knowledge of frontend, backend, APIs, and web architecture.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO web_assess;

  IF web_assess IS NULL THEN
    SELECT id INTO web_assess FROM assessments WHERE skill_id = web_skill AND title = 'Full-Stack Development Assessment';
  END IF;

  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (cloud_skill, 'Cloud Computing Assessment', 'Test your understanding of cloud services, deployment models, and DevOps.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO cloud_assess;

  IF cloud_assess IS NULL THEN
    SELECT id INTO cloud_assess FROM assessments WHERE skill_id = cloud_skill AND title = 'Cloud Computing Assessment';
  END IF;

  INSERT INTO assessments (skill_id, title, description, max_score) VALUES
    (cs_skill, 'CS Fundamentals Assessment', 'Test your knowledge of operating systems, computer networks, and system concepts.', 100)
  ON CONFLICT DO NOTHING
  RETURNING id INTO cs_assess;

  IF cs_assess IS NULL THEN
    SELECT id INTO cs_assess FROM assessments WHERE skill_id = cs_skill AND title = 'CS Fundamentals Assessment';
  END IF;

  -- ============ Python Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (prog_assess, 'Which of the following is the correct way to create a variable in Python that stores an integer?', 'x = 10', 'int x = 10', 'x := 10', 'var x = 10', 'a', 'In Python, variables are created by direct assignment using the = operator. No type declaration is needed.', 0),
    (prog_assess, 'What is the time complexity of accessing an element in a Python list by index?', 'O(n)', 'O(1)', 'O(log n)', 'O(n²)', 'b', 'Python lists are implemented as dynamic arrays, so index-based access is O(1) constant time.', 1),
    (prog_assess, 'Which of the following data types in Python is immutable?', 'list', 'dict', 'tuple', 'set', 'c', 'Tuples are immutable in Python — once created, their contents cannot be changed. Lists, dicts, and sets are all mutable.', 2),
    (prog_assess, 'What does the len() function return for the string "hello"?', '4', '5', '6', 'Error', 'b', 'The len() function returns the number of characters in a string. "hello" has 5 characters.', 3),
    (prog_assess, 'Which keyword is used to define a function in Python?', 'function', 'def', 'func', 'lambda', 'b', 'The def keyword is used to define named functions in Python. lambda creates anonymous functions.', 4);

  -- ============ DSA Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (dsa_assess, 'What is the time complexity of binary search on a sorted array of n elements?', 'O(n)', 'O(log n)', 'O(n log n)', 'O(1)', 'b', 'Binary search halves the search space at each step, giving O(log n) time complexity.', 0),
    (dsa_assess, 'Which data structure uses FIFO (First In First Out) ordering?', 'Stack', 'Queue', 'Tree', 'Heap', 'b', 'A queue follows FIFO ordering — the first element inserted is the first one removed. Stacks use LIFO.', 1),
    (dsa_assess, 'What is the worst-case time complexity of inserting an element into a binary search tree?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'c', 'In the worst case (a skewed tree), insertion requires traversing all n nodes, giving O(n). A balanced BST gives O(log n).', 2),
    (dsa_assess, 'Which sorting algorithm has an average time complexity of O(n log n)?', 'Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort', 'c', 'Merge Sort consistently achieves O(n log n) in all cases. Bubble, Insertion, and Selection Sort are O(n²) on average.', 3),
    (dsa_assess, 'In a hash table using separate chaining for collision resolution, what is the worst-case lookup time?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'c', 'If all keys hash to the same bucket, separate chaining degrades to a linked list, giving O(n) lookup in the worst case.', 4);

  -- ============ DBMS Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (db_assess, 'Which normal form eliminates transitive functional dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'c', 'Third Normal Form (3NF) eliminates transitive dependencies — non-key attributes must not depend on other non-key attributes.', 0),
    (db_assess, 'What does the ACID property "Isolation" guarantee in database transactions?', 'Transactions are permanent once committed', 'Concurrent transactions do not interfere with each other', 'All operations in a transaction succeed or fail together', 'Data is consistent before and after a transaction', 'b', 'Isolation ensures that concurrent transaction execution produces the same result as if they were executed sequentially.', 1),
    (db_assess, 'Which SQL clause is used to filter rows after grouping?', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'b', 'HAVING filters rows after GROUP BY aggregation. WHERE filters individual rows before grouping.', 2),
    (db_assess, 'What type of JOIN returns all rows from both tables, matching where possible?', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'd', 'FULL OUTER JOIN returns all rows from both tables. Unmatched rows get NULLs for the missing side.', 3),
    (db_assess, 'Which of the following is a valid candidate key?', 'A column that can contain NULL values', 'A column that uniquely identifies each row', 'A column that references another table', 'A column used for indexing', 'b', 'A candidate key is a minimal set of columns that uniquely identifies each row and cannot contain NULLs.', 4);

  -- ============ Full-Stack Development Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (web_assess, 'What does REST stand for in web development?', 'Remote Execution Standard Protocol', 'Representational State Transfer', 'Rapid Event Stream Transfer', 'Resource Endpoint Service Technology', 'b', 'REST stands for Representational State Transfer — an architectural style for designing networked applications.', 0),
    (web_assess, 'Which HTTP method is idempotent and used to update an existing resource?', 'POST', 'GET', 'PUT', 'CONNECT', 'c', 'PUT is idempotent — making the same PUT request multiple times produces the same result. It is used to update/replace a resource.', 1),
    (web_assess, 'What is the purpose of CORS in web applications?', 'To compress HTTP responses', 'To control which origins can access resources', 'To cache API responses', 'To encrypt data in transit', 'b', 'CORS (Cross-Origin Resource Sharing) controls which external origins are allowed to access resources on a server.', 2),
    (web_assess, 'In React, what does the useState hook return?', 'A single state value', 'An array with the current state and a setter function', 'A promise that resolves to the state', 'A component reference', 'b', 'useState returns a two-element array: [currentState, setStateFunction]. Array destructuring is used to capture both.', 3),
    (web_assess, 'Which of the following is NOT a valid HTTP status code category?', '1xx — Informational', '2xx — Success', '3xx — Redirection', '9xx — Server Error', 'd', 'HTTP status code categories are 1xx-5xx. 9xx is not a valid category. 5xx covers server errors.', 4);

  -- ============ Cloud Computing Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (cloud_assess, 'Which cloud service model provides virtual machines, storage, and networking as the primary resources?', 'SaaS', 'PaaS', 'IaaS', 'FaaS', 'c', 'IaaS (Infrastructure as a Service) provides fundamental computing resources like VMs, storage, and networking. Examples: AWS EC2, Azure VMs.', 0),
    (cloud_assess, 'What is the main benefit of auto-scaling in cloud computing?', 'Reduced code complexity', 'Automatically adjusting resources based on demand', 'Faster database queries', 'Better code compilation', 'b', 'Auto-scaling automatically increases or decreases the number of compute instances based on current traffic/demand, optimizing cost and performance.', 1),
    (cloud_assess, 'Which AWS service is used for object storage?', 'EC2', 'S3', 'RDS', 'Lambda', 'b', 'Amazon S3 (Simple Storage Service) is an object storage service for storing and retrieving any amount of data.', 2),
    (cloud_assess, 'What does a container orchestration tool like Kubernetes primarily manage?', 'Database schemas', 'Network routing', 'Deployment, scaling, and management of containerized applications', 'Source code versioning', 'c', 'Kubernetes orchestrates containers — handling deployment, scaling, load balancing, and fault tolerance for containerized apps.', 3),
    (cloud_assess, 'Which of the following is a characteristic of serverless computing?', 'You must manage the server infrastructure', 'You pay for idle server time', 'The cloud provider manages server allocation dynamically', 'You cannot use custom code', 'c', 'In serverless computing, the cloud provider dynamically manages server allocation. You only pay for actual execution time, not idle time.', 4);

  -- ============ CS Fundamentals Questions ============
  INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, order_index) VALUES
    (cs_assess, 'What is the purpose of virtual memory in an operating system?', 'To speed up the CPU clock', 'To extend available memory using disk space', 'To compress files', 'To encrypt data', 'b', 'Virtual memory uses disk space (swap/page file) to extend the available RAM, allowing processes to use more memory than physically available.', 0),
    (cs_assess, 'Which scheduling algorithm gives the shortest average waiting time but can cause starvation?', 'Round Robin', 'First-Come First-Served', 'Shortest Job First', 'Priority Scheduling', 'c', 'Shortest Job First (SJF) minimizes average waiting time, but long processes can starve if shorter ones keep arriving.', 1),
    (cs_assess, 'What is the default subnet mask for a Class C IP address?', '255.0.0.0', '255.255.0.0', '255.255.255.0', '255.255.255.255', 'c', 'Class C addresses use a 24-bit network mask, which is 255.255.255.0, leaving 8 bits for host addresses.', 2),
    (cs_assess, 'Which OSI layer is responsible for end-to-end communication and reliability?', 'Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer', 'b', 'The Transport Layer (Layer 4) handles end-to-end communication, reliability, and flow control. TCP and UDP operate at this layer.', 3),
    (cs_assess, 'What is a deadlock in operating systems?', 'A process that runs forever without stopping', 'Two or more processes waiting indefinitely for each other to release resources', 'A process that crashes due to insufficient memory', 'A process that cannot be terminated', 'b', 'A deadlock occurs when two or more processes are each waiting for resources held by the other, causing all of them to block indefinitely.', 4);

END $$;
