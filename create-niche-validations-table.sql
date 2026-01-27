-- Create niche_validations table for storing past validation results
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS niche_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    niche_keyword TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    recommendation TEXT,
    priority TEXT,
    action TEXT,
    estimated_monthly_traffic INTEGER DEFAULT 0,
    avg_competition_da INTEGER DEFAULT 0,
    unique_competitors INTEGER DEFAULT 0,
    competitor_domains JSONB DEFAULT '[]'::jsonb,
    breakdown JSONB DEFAULT '{}'::jsonb,
    competition_analysis JSONB DEFAULT '{}'::jsonb,
    keyword_opportunities JSONB DEFAULT '[]'::jsonb,
    content_strategy JSONB DEFAULT '{}'::jsonb,
    affiliate_programs JSONB DEFAULT '{}'::jsonb,
    revenue_projection JSONB DEFAULT '{}'::jsonb,
    strategic_insights TEXT,
    success_probability TEXT,
    keywords JSONB DEFAULT '[]'::jsonb,
    serp_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_niche_validations_user_id ON niche_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_niche_validations_created_at ON niche_validations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE niche_validations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own validations
CREATE POLICY "Users can view own validations"
    ON niche_validations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own validations
CREATE POLICY "Users can insert own validations"
    ON niche_validations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own validations
CREATE POLICY "Users can update own validations"
    ON niche_validations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own validations
CREATE POLICY "Users can delete own validations"
    ON niche_validations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON niche_validations TO authenticated;
GRANT ALL ON niche_validations TO service_role;
