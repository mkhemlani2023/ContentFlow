-- Migration: Enhance banner support in affiliate_programs table
-- Run this in your Supabase SQL Editor

-- Note: banner_images column already exists, so we're just adding rotation tracking

-- Add banner_rotation_index to track which banner was last used for rotation
ALTER TABLE affiliate_programs
ADD COLUMN IF NOT EXISTS banner_rotation_index INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN affiliate_programs.banner_rotation_index IS 'Index tracking last used banner for rotation across articles';

-- Enhanced banner structure (stored in existing banner_images column):
-- [
--   {
--     "url": "https://example.com/viome-banner-728x90.jpg",
--     "size": "728x90",
--     "width": 728,
--     "height": 90,
--     "alt_text": "Viome Gut Health Test - Personalized Nutrition",
--     "affiliate_link": "https://viomehq.sjv.io/qz5WQy",
--     "placement_preference": "after-intro",  // Options: after-intro, mid-article, before-conclusion
--     "is_active": true,
--     "created_at": "2026-01-11T00:00:00Z"
--   }
-- ]

-- Placement preference options:
-- - "after-intro": Banner appears after introduction (above fold on desktop)
-- - "mid-article": Banner appears in middle of content (after section 2-3)
-- - "before-conclusion": Banner appears before conclusion
-- - "any": Let rotation algorithm decide best placement
