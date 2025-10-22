-- Create table for saved content ideas
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_content_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    ideas JSONB NOT NULL,
    ideas_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_content_ideas_user_id
ON saved_content_ideas(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_content_ideas_keyword
ON saved_content_ideas(keyword);

CREATE INDEX IF NOT EXISTS idx_saved_content_ideas_created_at
ON saved_content_ideas(created_at DESC);

-- Enable Row Level Security
ALTER TABLE saved_content_ideas ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Users can only see their own saved content ideas
CREATE POLICY "Users can view their own content ideas"
ON saved_content_ideas FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own content ideas
CREATE POLICY "Users can create their own content ideas"
ON saved_content_ideas FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own content ideas
CREATE POLICY "Users can update their own content ideas"
ON saved_content_ideas FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own content ideas
CREATE POLICY "Users can delete their own content ideas"
ON saved_content_ideas FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON saved_content_ideas TO authenticated;
GRANT SELECT ON saved_content_ideas TO anon;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_content_ideas'
ORDER BY ordinal_position;
