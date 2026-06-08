-- Create the public ledger table
CREATE TABLE IF NOT EXISTS public.live_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT UNIQUE NOT NULL,
    action_type TEXT NOT NULL,
    parcel_id TEXT NOT NULL,
    location_summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.live_transactions ENABLE ROW LEVEL SECURITY;

-- Everyone logged in can view the ledger
CREATE POLICY "Anyone can view live transactions" 
ON public.live_transactions FOR SELECT 
TO authenticated 
USING (true);

-- Only authorized users can insert into the ledger
CREATE POLICY "Authorized users can insert live transactions" 
ON public.live_transactions FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.vsl_profiles WHERE role IN ('ADMIN', 'RSU', 'CLERK')
    )
    OR auth.jwt()->>'email' = 'kiggundumuhamad@gmail.com'
);
