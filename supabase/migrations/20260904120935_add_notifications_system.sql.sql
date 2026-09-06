/*
# CampusX — Notifications System + Real-time Updates

## Changes
1. Create `notifications` table — user-specific notifications
2. Create `notification_preferences` table — user notification settings
3. Add indexes for performance
4. RLS: users see their own notifications only
*/

-- ============ notifications ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications"
  ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============ notification_preferences ============
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  job_alerts boolean NOT NULL DEFAULT true,
  announcement_alerts boolean NOT NULL DEFAULT true,
  interview_reminders boolean NOT NULL DEFAULT true,
  achievement_notifications boolean NOT NULL DEFAULT true,
  mentorship_updates boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notification_prefs" ON notification_preferences;
CREATE POLICY "select_own_notification_prefs"
  ON notification_preferences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notification_prefs" ON notification_preferences;
CREATE POLICY "insert_own_notification_prefs"
  ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notification_prefs" ON notification_preferences;
CREATE POLICY "update_own_notification_prefs"
  ON notification_preferences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);

-- ============ Seed some sample notifications ============
INSERT INTO notifications (user_id, type, title, message, link, is_read)
SELECT id, 'achievement', 'Welcome to CampusX!', 'Complete your profile and start your learning journey today.', '/dashboard', false
FROM profiles
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = profiles.id LIMIT 1);

INSERT INTO notifications (user_id, type, title, message, link, is_read)
SELECT id, 'job', 'New placement drive available!', 'Google is hiring Software Engineer I. Check your match score now.', '/dashboard/placements', false
FROM profiles
WHERE role = 'student'
AND NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = profiles.id AND type = 'job' LIMIT 1);
