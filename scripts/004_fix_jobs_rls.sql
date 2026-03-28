-- Fix jobs table RLS policies
-- The table has RLS enabled but only INSERT policy exists, causing "Job not found" errors

-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Allow inserts" ON jobs;
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
DROP POLICY IF EXISTS "jobs_update_all" ON jobs;
DROP POLICY IF EXISTS "jobs_delete_all" ON jobs;

-- Create permissive policies for all operations
-- TODO: Add user_id column to jobs table and restrict to user's own jobs

CREATE POLICY "jobs_select_all" ON jobs
  FOR SELECT
  USING (true);

CREATE POLICY "jobs_insert_all" ON jobs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "jobs_update_all" ON jobs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "jobs_delete_all" ON jobs
  FOR DELETE
  USING (true);

-- Also fix evidence_library (RLS is disabled but let's ensure it stays accessible)
-- and other tables used by the app

-- Verify: job_analyses has no RLS, so it's fine
-- Verify: generation_quality_checks has no RLS, so it's fine
-- Verify: user_profile has no RLS, so it's fine
