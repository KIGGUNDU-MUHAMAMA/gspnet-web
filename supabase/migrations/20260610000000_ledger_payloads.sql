-- Add columns to live_transactions to store pending transfer payloads
ALTER TABLE public.live_transactions ADD COLUMN initiator_role TEXT;
ALTER TABLE public.live_transactions ADD COLUMN initiator_id UUID;
ALTER TABLE public.live_transactions ADD COLUMN payload JSONB;
ALTER TABLE public.live_transactions ADD COLUMN registration_id UUID; -- Added for easy lookup during approval

-- Ensure RLS allows updating status from PENDING_APPROVAL to COMMITTED
-- Only users with role ADMIN, RSU, or LAND_CLERK can update
CREATE POLICY "Authorized users can update live transactions" 
ON public.live_transactions FOR UPDATE 
TO authenticated 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('LAND_CLERK', 'RSU', 'ADMIN'))
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);
