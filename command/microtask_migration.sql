-- ============================================================
-- FixIt Micro-Task System — Full Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Microtasks table
CREATE TABLE IF NOT EXISTS microtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT CHECK(task_type IN ('image','poll','report_review','future_inspection')) DEFAULT 'image',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    address TEXT,
    related_report_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ DEFAULT now(),
    end_time TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
    points INTEGER DEFAULT 10,
    status TEXT CHECK(status IN ('open','closed','overdue')) DEFAULT 'open',
    poll_options JSONB, -- for poll tasks: ["Option A","Option B","Option C"]
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    image_url TEXT
);

-- 2. Microtask Responses
CREATE TABLE IF NOT EXISTS microtask_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    microtask_id UUID REFERENCES microtasks(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    response_type TEXT CHECK(response_type IN ('image','text','poll_choice')) DEFAULT 'text',
    content TEXT,
    image_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    approved BOOLEAN DEFAULT FALSE,
    rejected BOOLEAN DEFAULT FALSE,
    admin_note TEXT,
    points_awarded INTEGER DEFAULT 0,
    UNIQUE(microtask_id, citizen_id)
);

-- 3. Civic Points / Leaderboard
CREATE TABLE IF NOT EXISTS civic_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Civic Hero Level 1',
    badge TEXT DEFAULT 'Rookie',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS + Open Policies (adjust as needed for your setup)
ALTER TABLE microtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE microtask_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read microtasks" ON microtasks FOR SELECT USING (true);
CREATE POLICY "Admin insert microtasks" ON microtasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update microtasks" ON microtasks FOR UPDATE USING (true);
CREATE POLICY "Admin delete microtasks" ON microtasks FOR DELETE USING (true);

CREATE POLICY "Public read responses" ON microtask_responses FOR SELECT USING (true);
CREATE POLICY "Citizen insert responses" ON microtask_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin update responses" ON microtask_responses FOR UPDATE USING (true);

CREATE POLICY "Public read civic_points" ON civic_points FOR SELECT USING (true);
CREATE POLICY "System upsert civic_points" ON civic_points FOR INSERT WITH CHECK (true);
CREATE POLICY "System update civic_points" ON civic_points FOR UPDATE USING (true);

-- 5. Function: Auto-update civic_points when a response is approved
CREATE OR REPLACE FUNCTION update_civic_points_on_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_points INTEGER;
  v_citizen UUID;
  v_total INTEGER;
  v_level TEXT;
  v_badge TEXT;
BEGIN
  -- Only run when approved changes from false to true
  IF NEW.approved = TRUE AND (OLD.approved IS DISTINCT FROM TRUE) THEN
    v_citizen := NEW.citizen_id;
    v_points := NEW.points_awarded;

    -- Upsert into civic_points
    INSERT INTO civic_points (citizen_id, total_points, tasks_completed, updated_at)
    VALUES (v_citizen, v_points, 1, now())
    ON CONFLICT (citizen_id) DO UPDATE
      SET total_points = civic_points.total_points + v_points,
          tasks_completed = civic_points.tasks_completed + 1,
          updated_at = now();

    -- Get new total
    SELECT total_points INTO v_total FROM civic_points WHERE citizen_id = v_citizen;

    -- Calculate level + badge
    IF v_total >= 501 THEN
      v_level := 'Civic Hero Level 4'; v_badge := 'City Guardian';
    ELSIF v_total >= 251 THEN
      v_level := 'Civic Hero Level 3'; v_badge := 'Urban Champion';
    ELSIF v_total >= 101 THEN
      v_level := 'Civic Hero Level 2'; v_badge := 'Street Sentinel';
    ELSE
      v_level := 'Civic Hero Level 1'; v_badge := 'Rookie';
    END IF;

    UPDATE civic_points SET level = v_level, badge = v_badge WHERE citizen_id = v_citizen;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_response_approved ON microtask_responses;
CREATE TRIGGER on_response_approved
  AFTER UPDATE ON microtask_responses
  FOR EACH ROW EXECUTE FUNCTION update_civic_points_on_approval();

-- 6. Function: auto-close overdue tasks
CREATE OR REPLACE FUNCTION auto_close_overdue_microtasks()
RETURNS void AS $$
BEGIN
  UPDATE microtasks
  SET status = 'overdue'
  WHERE status = 'open'
    AND end_time IS NOT NULL
    AND end_time < now();
END;
$$ LANGUAGE plpgsql;

-- Note: Call auto_close_overdue_microtasks() via a cron job or Edge Function periodically.
-- You can also call it client-side before fetching tasks for a lightweight approach.
