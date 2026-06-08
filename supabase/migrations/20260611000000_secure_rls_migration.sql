-- ==========================================
-- 1. FIX SECURITY DEFINER VIEW
-- ==========================================
ALTER VIEW public.profile_contribution_stats SET (security_invoker = true);

-- ==========================================
-- 2. FIX MISSING RLS IN PUBLIC TABLES
-- ==========================================

-- Enable RLS on property_listings
ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view property listings" ON public.property_listings FOR SELECT USING (true);
CREATE POLICY "Users can insert their own property listings" ON public.property_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own property listings" ON public.property_listings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own property listings" ON public.property_listings FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. FIX VULNERABLE RLS (USER_METADATA)
-- ==========================================

-- A. Create secure user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_roles (Users can read their own role, but cannot update it)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
-- No insert/update/delete policies for users! Only the trigger or service_role can write to it.

-- B. Backfill existing users' roles from their vulnerable metadata into the secure table
INSERT INTO public.user_roles (user_id, role)
SELECT id, raw_user_meta_data->>'role'
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- C. Create trigger to automatically insert new users into user_roles upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger AS $$
BEGIN
    IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (new.id, new.raw_user_meta_data->>'role')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- D. Recreate all flagged RLS policies to use the secure user_roles table

-- --------------------------
-- land_documents
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can insert documents" 
ON public.land_documents FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can view all documents" 
ON public.land_documents FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

-- --------------------------
-- land_owners
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can insert owners" 
ON public.land_owners FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can view all owners" 
ON public.land_owners FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

-- --------------------------
-- polygon_features
-- --------------------------
DROP POLICY IF EXISTS "Enable delete for creators and admins" ON public.polygon_features;
CREATE POLICY "Enable delete for creators and admins" 
ON public.polygon_features FOR DELETE 
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- --------------------------
-- land_registrations
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can insert registrations" 
ON public.land_registrations FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can update registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can update registrations" 
ON public.land_registrations FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can view all registrations" 
ON public.land_registrations FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

-- --------------------------
-- land_transfers
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can insert transfers" 
ON public.land_transfers FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view all transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can view all transfers" 
ON public.land_transfers FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

-- --------------------------
-- registration_audit_log
-- --------------------------
DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can insert audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can insert audit log" 
ON public.registration_audit_log FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

DROP POLICY IF EXISTS "Land clerks, RSUs, and Admins can view audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can view audit log" 
ON public.registration_audit_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN')));

-- --------------------------
-- map_features
-- --------------------------
DROP POLICY IF EXISTS "Enable delete for creators and admins" ON public.map_features;
CREATE POLICY "Enable delete for creators and admins" 
ON public.map_features FOR DELETE 
USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- --------------------------
-- live_transactions
-- --------------------------
DROP POLICY IF EXISTS "Authorized users can insert live transactions" ON public.live_transactions;
CREATE POLICY "Authorized users can insert live transactions" 
ON public.live_transactions FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);

DROP POLICY IF EXISTS "Authorized users can update live transactions" ON public.live_transactions;
CREATE POLICY "Authorized users can update live transactions" 
ON public.live_transactions FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
)
WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);
