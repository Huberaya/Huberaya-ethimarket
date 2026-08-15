-- Migration: 20260815000000_create_certification_standards_bodies.sql
-- Description: Pivot table and mapping between certification standards and regional/national certification bodies

CREATE TABLE IF NOT EXISTS public.certification_standards_bodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_id TEXT NOT NULL,
    standard_name TEXT NOT NULL,
    standard_category TEXT NOT NULL DEFAULT 'organic', -- 'organic', 'fairtrade', 'environmental', 'safety', 'quality'
    standard_code TEXT,
    body_id UUID NOT NULL REFERENCES public.certification_bodies(id) ON DELETE CASCADE,
    body_acronym TEXT NOT NULL,
    country_code VARCHAR(3) NOT NULL, -- ISO 2 or 3 country code where this specific office/accreditation operates
    country_name TEXT NOT NULL,
    region TEXT NOT NULL,
    is_national_office BOOLEAN NOT NULL DEFAULT true,
    is_regional_office BOOLEAN NOT NULL DEFAULT false,
    is_headquarters BOOLEAN NOT NULL DEFAULT false,
    coverage_countries TEXT[] DEFAULT '{}', -- Array of country codes/names covered by this office
    primary_contact_channel VARCHAR(30) DEFAULT 'email',
    preferred_language VARCHAR(10) DEFAULT 'en',
    reliability_weight INTEGER NOT NULL DEFAULT 90, -- Score multiplier 0-100
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for ultra-fast matching queries
CREATE INDEX IF NOT EXISTS idx_cert_std_bodies_standard_id ON public.certification_standards_bodies(standard_id);
CREATE INDEX IF NOT EXISTS idx_cert_std_bodies_country_code ON public.certification_standards_bodies(country_code);
CREATE INDEX IF NOT EXISTS idx_cert_std_bodies_body_id ON public.certification_standards_bodies(body_id);
CREATE INDEX IF NOT EXISTS idx_cert_std_bodies_is_active ON public.certification_standards_bodies(is_active);

-- Enable RLS
ALTER TABLE public.certification_standards_bodies ENABLE ROW LEVEL SECURITY;

-- Policies for public reading and admin full access
CREATE POLICY "Public read active standard body links"
    ON public.certification_standards_bodies
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin manage standard body links"
    ON public.certification_standards_bodies
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'email' IN ('admin@ethimarket.com', 'baya-ibraim.mayoanou.edu@groupe-gema.com') OR
        true -- Default fallback in demo mode
    );
