-- 1. Enable UPDATE for authenticated users on polygon_features
-- This allows users to archive parcels (set is_archived = true, update archive_reason)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.polygon_features;

CREATE POLICY "Enable update for authenticated users" 
ON public.polygon_features 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
