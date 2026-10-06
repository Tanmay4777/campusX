/*
# Fix mentorship request unique constraint

## Problem
The `mentorship_requests` table has a `UNIQUE(mentor_id, student_id)` constraint
that prevents a student from ever re-requesting mentorship from the same mentor
after a request was rejected, cancelled, or completed. The old rejected row
stays in the table forever, blocking new inserts.

## Changes
1. Drop the unconditional `UNIQUE(mentor_id, student_id)` table constraint.
2. Add a partial unique index that only enforces uniqueness for *active*
   requests (status = 'pending' or 'accepted'). Rejected/cancelled/completed
   rows can coexist, and a new pending request can be inserted after the old
   one is no longer active (the application deletes stale rows before insert).

## Security
No RLS policy changes. Existing policies remain intact.
*/

-- Drop the table-level unique constraint
ALTER TABLE mentorship_requests
  DROP CONSTRAINT IF EXISTS mentorship_requests_mentor_id_student_id_key;

-- Add a partial unique index that only applies to active statuses
CREATE UNIQUE INDEX IF NOT EXISTS uq_mentorship_requests_active
  ON mentorship_requests (mentor_id, student_id)
  WHERE status IN ('pending', 'accepted');
