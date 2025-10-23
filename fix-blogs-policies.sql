-- Fix blogs table policies
-- Run this FIRST if you get "policy already exists" error

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can create their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can update their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can delete their own blogs" ON blogs;

-- Recreate policies
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

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'blogs';
