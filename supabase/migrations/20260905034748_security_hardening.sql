-- Security hardening migration
-- 1. Revoke EXECUTE on handle_new_user from anon and authenticated (only the auth trigger should call it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- 2. Fix mutable search_path on handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3. Revoke ALL privileges from anon on all tables - this is a fully authenticated app
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.tablename);
  END LOOP;
END $$;

-- 4. For read-only reference tables, revoke INSERT/UPDATE/DELETE from authenticated
-- These tables are managed via admin/migrations, not client-side writes
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'assessment_questions','assessments','badges','career_roadmaps',
    'interview_questions','learning_resources','learning_topics',
    'projects','roadmap_milestones','roadmap_phases','roadmaps',
    'skills','target_role_skills'
  ] LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM authenticated', t);
  END LOOP;
END $$;
