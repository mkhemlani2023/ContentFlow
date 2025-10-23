-- Complete blogs table setup
-- Run this in Supabase SQL Editor
-- This script is safe to run multiple times

-- Step 1: Ensure table exists with all columns
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

-- Step 2: Create indexes (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_platform ON blogs(platform);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);

-- Step 3: Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Step 4: Handle policies with DO block to avoid conflicts
DO $$
BEGIN
    -- Drop and recreate SELECT policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Users can view their own blogs') THEN
        DROP POLICY "Users can view their own blogs" ON blogs;
    END IF;
    CREATE POLICY "Users can view their own blogs" ON blogs FOR SELECT USING (auth.uid() = user_id);

    -- Drop and recreate INSERT policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Users can create their own blogs') THEN
        DROP POLICY "Users can create their own blogs" ON blogs;
    END IF;
    CREATE POLICY "Users can create their own blogs" ON blogs FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Drop and recreate UPDATE policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Users can update their own blogs') THEN
        DROP POLICY "Users can update their own blogs" ON blogs;
    END IF;
    CREATE POLICY "Users can update their own blogs" ON blogs FOR UPDATE USING (auth.uid() = user_id);

    -- Drop and recreate DELETE policy
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blogs' AND policyname = 'Users can delete their own blogs') THEN
        DROP POLICY "Users can delete their own blogs" ON blogs;
    END IF;
    CREATE POLICY "Users can delete their own blogs" ON blogs FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Step 5: Grant permissions
GRANT ALL ON blogs TO authenticated;
GRANT SELECT ON blogs TO anon;

-- Step 6: Verify setup
SELECT
    'Table exists' as status,
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'blogs';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'blogs'
ORDER BY ordinal_position;
