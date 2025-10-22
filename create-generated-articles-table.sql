-- Create table for generated articles
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS generated_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keyword TEXT,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    word_count INTEGER DEFAULT 0,
    model_tier TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_articles_user_id
ON generated_articles(user_id);

CREATE INDEX IF NOT EXISTS idx_generated_articles_keyword
ON generated_articles(keyword);

CREATE INDEX IF NOT EXISTS idx_generated_articles_created_at
ON generated_articles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE generated_articles ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own generated articles
CREATE POLICY "Users can view their own articles"
ON generated_articles FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own articles
CREATE POLICY "Users can create their own articles"
ON generated_articles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own articles
CREATE POLICY "Users can update their own articles"
ON generated_articles FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own articles
CREATE POLICY "Users can delete their own articles"
ON generated_articles FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON generated_articles TO authenticated;
GRANT SELECT ON generated_articles TO anon;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_articles'
ORDER BY ordinal_position;
