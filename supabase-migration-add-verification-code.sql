-- Migration: Add verification_code column to blogs table
-- Run this in your Supabase SQL Editor

-- Add verification_code column to store site verification meta tags
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN blogs.verification_code IS 'Site verification code/meta tag for affiliate networks, search engines, etc. (e.g., Impact Marketplace, Google Search Console)';

-- Example usage:
-- UPDATE blogs
-- SET verification_code = '<meta name="impact-site-verification" value="22720da9-91b8-4304-8433-d2618a524e2a">'
-- WHERE id = 'your-blog-id';
