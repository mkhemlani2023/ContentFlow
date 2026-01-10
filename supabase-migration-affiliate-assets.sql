-- Migration: Add affiliate assets columns to affiliate_programs table
-- Run this in your Supabase SQL Editor

-- Add new columns for affiliate asset management
ALTER TABLE affiliate_programs
ADD COLUMN IF NOT EXISTS banner_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS promotional_text TEXT,
ADD COLUMN IF NOT EXISTS disclosure_text TEXT DEFAULT 'This article contains affiliate links. If you make a purchase through these links, we may earn a commission at no additional cost to you.';

-- Update the comment for banner_images structure
COMMENT ON COLUMN affiliate_programs.banner_images IS 'Array of banner objects: [{"url": "https://cdn.example.com/banner.jpg", "size": "728x90"}]';
COMMENT ON COLUMN affiliate_programs.promotional_text IS 'Special offers, discount codes, or promotional text/CTAs';
COMMENT ON COLUMN affiliate_programs.disclosure_text IS 'FTC-compliant affiliate disclosure text for articles';

-- Refresh the schema cache (this happens automatically after ALTER TABLE)
