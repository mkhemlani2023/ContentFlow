-- Content Strategies Table
-- Stores comprehensive content planning with automated publishing capabilities
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS content_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,

  -- Core Strategy
  niche_keyword VARCHAR(255),
  keywords JSONB DEFAULT '[]',
  affiliate_programs JSONB DEFAULT '[]',
  content_pillars JSONB DEFAULT '[]',

  -- Posting Schedule
  posting_frequency VARCHAR(50) DEFAULT '3x_week',
  posting_days JSONB DEFAULT '["Monday", "Wednesday", "Friday"]',
  posting_time TIME DEFAULT '09:00',
  target_articles_per_month INTEGER DEFAULT 12,
  auto_publish_enabled BOOLEAN DEFAULT false,

  -- Article Queue (maintains 20 articles ready to publish)
  article_queue JSONB DEFAULT '[]',
  queue_size INTEGER DEFAULT 20,

  -- Affiliate Round Robin
  affiliate_rotation_index INTEGER DEFAULT 0,
  affiliate_rotation_mode VARCHAR(50) DEFAULT 'round_robin',

  -- Image Settings
  image_source VARCHAR(50) DEFAULT 'pexels',
  image_style VARCHAR(50) DEFAULT 'professional',

  -- Traffic Learning & Analytics
  top_performing_keywords JSONB DEFAULT '[]',
  traffic_insights JSONB DEFAULT '{}',
  monetization_strategies JSONB DEFAULT '[]',
  learning_enabled BOOLEAN DEFAULT true,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  last_generated_at TIMESTAMPTZ,
  last_published_at TIMESTAMPTZ,
  next_publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_strategies_user_id ON content_strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_blog_id ON content_strategies(blog_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_status ON content_strategies(status);
CREATE INDEX IF NOT EXISTS idx_content_strategies_next_publish ON content_strategies(next_publish_at);

-- Enable Row Level Security
ALTER TABLE content_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own strategies
CREATE POLICY "Users manage own strategies" ON content_strategies
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_strategies_updated_at
  BEFORE UPDATE ON content_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_content_strategies_updated_at();

-- Grant permissions
GRANT ALL ON content_strategies TO authenticated;
GRANT ALL ON content_strategies TO service_role;
