-- Migration: Add category_id to publish_logs table
-- Run this in your Supabase SQL Editor

-- Add category_id column to track which WordPress category was used
ALTER TABLE publish_logs
ADD COLUMN IF NOT EXISTS category_id TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN publish_logs.category_id IS 'WordPress category ID used when publishing the article';
