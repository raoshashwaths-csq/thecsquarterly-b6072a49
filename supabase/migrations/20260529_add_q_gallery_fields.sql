-- Migration: Add view_count to q_runs table for gallery/trending features
-- Date: 2026-05-29
-- Purpose: Track views on shared Q runs for the gallery and trending features

ALTER TABLE public.q_runs
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Create index on shared runs for gallery queries
CREATE INDEX IF NOT EXISTS idx_q_runs_shared_created 
ON public.q_runs(shared, created_at DESC)
WHERE shared = true;

-- Create index for trending queries
CREATE INDEX IF NOT EXISTS idx_q_runs_shared_views
ON public.q_runs(view_count DESC)
WHERE shared = true;

-- Update RLS policies to allow view_count updates for shared runs
-- (Assuming RLS exists; verify before applying)
