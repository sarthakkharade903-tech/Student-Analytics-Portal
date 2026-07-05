-- ====================================================================================
-- PHASE 2: MAIN SAAS DATABASE SCHEMA (Run in cvoihmiwpuitpwujpxzd.supabase.co)
-- ====================================================================================

-- 1. Onboarding Codes Table
CREATE TABLE public.onboarding_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    services TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['exam_engine', 'coaching_management']
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Only admins can manage, but anyone can read for validation if using service role, or public if we want)
ALTER TABLE public.onboarding_codes ENABLE ROW LEVEL SECURITY;
-- We will query this table using the Service Role Key from our Next.js API routes, so no public policies needed.
