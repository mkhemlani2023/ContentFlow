-- Create website_metrics table for tracking website analytics
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS website_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_website_metrics_user_id ON website_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_website_metrics_url ON website_metrics(url);
CREATE INDEX IF NOT EXISTS idx_website_metrics_created_at ON website_metrics(created_at DESC);

-- Enable Row Level Security
ALTER TABLE website_metrics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own website metrics" ON website_metrics;
DROP POLICY IF EXISTS "Users can create their own website metrics" ON website_metrics;
DROP POLICY IF EXISTS "Users can update their own website metrics" ON website_metrics;
DROP POLICY IF EXISTS "Users can delete their own website metrics" ON website_metrics;

-- RLS Policies
CREATE POLICY "Users can view their own website metrics"
ON website_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own website metrics"
ON website_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own website metrics"
ON website_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own website metrics"
ON website_metrics FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON website_metrics TO authenticated;
GRANT SELECT ON website_metrics TO anon;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'website_metrics'
ORDER BY ordinal_position;
