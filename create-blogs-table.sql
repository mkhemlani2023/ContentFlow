-- Create blogs table for website/blog management
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'wordpress',
    url TEXT NOT NULL,
    signin_url TEXT,
    username TEXT,
    password TEXT,
    api_key TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_platform ON blogs(platform);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own blogs"
ON blogs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blogs"
ON blogs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blogs"
ON blogs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blogs"
ON blogs FOR DELETE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON blogs TO authenticated;
GRANT SELECT ON blogs TO anon;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blogs'
ORDER BY ordinal_position;
