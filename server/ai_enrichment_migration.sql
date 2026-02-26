-- ============================================================
-- GEMINI AI ENRICHMENT MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add AI enrichment columns to issues table
ALTER TABLE public.issues
    ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'Normal',
    ADD COLUMN IF NOT EXISTS impact VARCHAR(20) DEFAULT 'Low',
    ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS ai_confidence INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS auto_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS analysis_summary TEXT,
    ADD COLUMN IF NOT EXISTS is_auto_escalated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS severity_label VARCHAR(20) DEFAULT 'Medium',
    ADD COLUMN IF NOT EXISTS risk_score_int INTEGER DEFAULT 0;

-- 2. Create index on risk_score_int for fast priority sorting
CREATE INDEX IF NOT EXISTS idx_issues_risk_score ON public.issues (risk_score_int DESC);
CREATE INDEX IF NOT EXISTS idx_issues_is_escalated ON public.issues (is_escalated);

-- 3. Backfill risk_score_int from existing float risk_score (if populated)
UPDATE public.issues 
SET risk_score_int = LEAST(GREATEST(ROUND(COALESCE(risk_score, 0) * 100)::INTEGER, 0), 100)
WHERE risk_score IS NOT NULL AND risk_score_int = 0;

-- 4. Backfill severity_label from existing severity column
-- Cast to numeric safely; skip rows where severity is not a valid number
UPDATE public.issues SET severity_label =
    CASE
        WHEN severity::TEXT ~ '^\d+(\.\d+)?$' AND severity::TEXT::NUMERIC >= 9 THEN 'Critical'
        WHEN severity::TEXT ~ '^\d+(\.\d+)?$' AND severity::TEXT::NUMERIC >= 7 THEN 'High'
        WHEN severity::TEXT ~ '^\d+(\.\d+)?$' AND severity::TEXT::NUMERIC >= 4 THEN 'Medium'
        ELSE 'Low'
    END
WHERE severity IS NOT NULL;

-- 5. Remove old broken priority constraint if any, allow our new values
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_priority_check;

SELECT 'Migration complete. AI enrichment columns added to issues table.' AS status;
