-- ==========================================
-- 1. FIX SECURITY DEFINER VIEW
-- ==========================================
ALTER VIEW public.profile_contribution_stats SET (security_invoker = true);

-- ==========================================
-- 2. FIX MISSING RLS IN PUBLIC TABLES
-- ==========================================

-- Enable RLS on property_listings
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view property listings" ON public.property_listings;
CREATE POLICY "Anyone can view property listings" ON public.property_listings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own property listings" ON public.property_listings;
CREATE POLICY "Users can insert their own property listings" ON public.property_listings FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update their own property listings" ON public.property_listings;
CREATE POLICY "Users can update their own property listings" ON public.property_listings FOR UPDATE USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete their own property listings" ON public.property_listings;
CREATE POLICY "Users can delete their own property listings" ON public.property_listings FOR DELETE USING (auth.uid()::text = user_id::text);

-- ==========================================
-- 3. FIX VULNERABLE RLS (USER_METADATA)
-- ==========================================
-- We previously attempted to use a user_roles table, but the application already maintains
-- a secure public.profiles table that handles roles. We will use public.profiles for all policies.

-- Clean up the temporary user_roles table and trigger if they were created
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- D. Recreate all flagged RLS policies to use the secure public.profiles table

-- --------------------------
-- land_documents
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can insert documents" 
ON public.land_documents FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can view all documents" 
ON public.land_documents FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- land_owners
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can insert owners" 
ON public.land_owners FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can view all owners" 
ON public.land_owners FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- polygon_features
-- --------------------------
DROP POLICY IF EXISTS "Enable delete for creators and admins" ON public.polygon_features;
CREATE POLICY "Enable delete for creators and admins" 
ON public.polygon_features FOR DELETE 
USING (auth.uid()::text = created_by::text OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- land_registrations
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can insert registrations" 
ON public.land_registrations FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can update registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can update registrations" 
ON public.land_registrations FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com')
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can view all registrations" 
ON public.land_registrations FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- land_transfers
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can insert transfers" 
ON public.land_transfers FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can view all transfers" 
ON public.land_transfers FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- registration_audit_log
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can insert audit log" 
ON public.registration_audit_log FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can view audit log" 
ON public.registration_audit_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- map_features
-- --------------------------
DROP POLICY IF EXISTS "Enable delete for creators and admins" ON public.map_features;
CREATE POLICY "Enable delete for creators and admins" 
ON public.map_features FOR DELETE 
USING (auth.uid()::text = user_id::text OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN') OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com');

-- --------------------------
-- live_transactions
-- --------------------------
DROP POLICY IF EXISTS "Authorized users can insert live transactions" ON public.live_transactions;
CREATE POLICY "Authorized users can insert live transactions" 
ON public.live_transactions FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);

DROP POLICY IF EXISTS "Authorized users can update live transactions" ON public.live_transactions;
CREATE POLICY "Authorized users can update live transactions" 
ON public.live_transactions FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);
