-- ============================================================
-- Micro-Task RLS FIX — Run this in Supabase SQL Editor
-- Run this AFTER the original microtask_migration.sql
-- ============================================================

-- Drop old restrictive policies and replace with permissive ones
-- that work correctly with authenticated sessions

DO $$
BEGIN
  -- microtasks
  DROP POLICY IF EXISTS "Public read microtasks" ON microtasks;
  DROP POLICY IF EXISTS "Admin insert microtasks" ON microtasks;
  DROP POLICY IF EXISTS "Admin update microtasks" ON microtasks;
  DROP POLICY IF EXISTS "Admin delete microtasks" ON microtasks;

  -- microtask_responses
  DROP POLICY IF EXISTS "Public read responses" ON microtask_responses;
  DROP POLICY IF EXISTS "Citizen insert responses" ON microtask_responses;
  DROP POLICY IF EXISTS "Admin update responses" ON microtask_responses;

  -- civic_points
  DROP POLICY IF EXISTS "Public read civic_points" ON civic_points;
  DROP POLICY IF EXISTS "System upsert civic_points" ON civic_points;
  DROP POLICY IF EXISTS "System update civic_points" ON civic_points;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if policies don't exist
END $$;

-- ── microtasks: full open access (adjust per your auth requirements)
CREATE POLICY "microtasks_select" ON microtasks
  FOR SELECT USING (true);

CREATE POLICY "microtasks_insert" ON microtasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "microtasks_update" ON microtasks
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "microtasks_delete" ON microtasks
  FOR DELETE USING (true);

-- ── microtask_responses
CREATE POLICY "responses_select" ON microtask_responses
  FOR SELECT USING (true);

CREATE POLICY "responses_insert" ON microtask_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "responses_update" ON microtask_responses
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── civic_points
CREATE POLICY "civic_points_select" ON civic_points
  FOR SELECT USING (true);

CREATE POLICY "civic_points_insert" ON civic_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "civic_points_update" ON civic_points
  FOR UPDATE USING (true) WITH CHECK (true);

-- ── Verify tables exist (will error if migration was never run)
SELECT 
  'microtasks' as table_name, count(*) as rows FROM microtasks
UNION ALL
SELECT 'microtask_responses', count(*) FROM microtask_responses
UNION ALL  
SELECT 'civic_points', count(*) FROM civic_points;
