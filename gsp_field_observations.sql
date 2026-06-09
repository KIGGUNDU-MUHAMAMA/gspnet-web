-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE public.gsp_field_observations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    lat NUMERIC NOT NULL,
    lon NUMERIC NOT NULL,
    height NUMERIC NOT NULL,
    accuracy NUMERIC,
    mode TEXT CHECK (mode IN ('gps', 'gnss')),
    cors_provider TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.gsp_field_observations ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (Allow everyone to read, but only authenticated to insert)
-- For a collaborative survey tool, you might want to adjust these to your exact org structure
CREATE POLICY "Allow authenticated inserts" 
ON public.gsp_field_observations FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public read access" 
ON public.gsp_field_observations FOR SELECT 
USING (true);

-- 4. Enable Supabase Realtime for this table
-- This allows the web app to listen to INSERTs in real-time
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gsp_field_observations;
