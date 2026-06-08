-- Migration to broaden Land Clerk RLS policies to include RSU and ADMIN roles

-- 1. land_documents
DROP POLICY IF EXISTS "Land clerks can insert documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can insert documents" ON public.land_documents
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can view all documents" ON public.land_documents;
CREATE POLICY "Land clerks, RSUs, and Admins can view all documents" ON public.land_documents
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);


-- 2. land_owners
DROP POLICY IF EXISTS "Land clerks can insert owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can insert owners" ON public.land_owners
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can view all owners" ON public.land_owners;
CREATE POLICY "Land clerks, RSUs, and Admins can view all owners" ON public.land_owners
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);


-- 3. land_registrations
DROP POLICY IF EXISTS "Land clerks can insert registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can insert registrations" ON public.land_registrations
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can update registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can update registrations" ON public.land_registrations
FOR UPDATE TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can view all registrations" ON public.land_registrations;
CREATE POLICY "Land clerks, RSUs, and Admins can view all registrations" ON public.land_registrations
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);


-- 4. land_transfers
DROP POLICY IF EXISTS "Land clerks can insert transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can insert transfers" ON public.land_transfers
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can view all transfers" ON public.land_transfers;
CREATE POLICY "Land clerks, RSUs, and Admins can view all transfers" ON public.land_transfers
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);


-- 5. registration_audit_log
DROP POLICY IF EXISTS "Land clerks can insert audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can insert audit log" ON public.registration_audit_log
FOR INSERT TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);

DROP POLICY IF EXISTS "Land clerks can view audit log" ON public.registration_audit_log;
CREATE POLICY "Land clerks, RSUs, and Admins can view audit log" ON public.registration_audit_log
FOR SELECT TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN')) OR 
  (auth.jwt() ->> 'email' = 'kiggundumuhamad@gmail.com')
);
