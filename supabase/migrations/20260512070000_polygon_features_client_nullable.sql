-- Migration: make polygon_features.client column nullable
-- Reason: SurveySync plugin broadcasts may not always have client info at broadcast time;
--         the webmap save panel now collects it, but this relaxes the DB constraint as a safety net.
-- Date: 2026-05-12

ALTER TABLE public.polygon_features
  ALTER COLUMN client DROP NOT NULL;

-- Set a sensible default so old inserts without client still work
ALTER TABLE public.polygon_features
  ALTER COLUMN client SET DEFAULT 'Unknown';
