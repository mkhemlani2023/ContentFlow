/**
 * Simple endpoint to serve the pipeline enhancements SQL
 * Access at: /.netlify/functions/get-pipeline-sql
 */

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const sql = `-- SEO Wizard Blog Management Enhancement - Pipeline Enhancements
-- Run this migration to add intelligent article pipeline features
-- Date: 2024

-- ============================================
-- 1.1 ALTER content_pipeline TABLE
-- ============================================

ALTER TABLE content_pipeline
ADD COLUMN IF NOT EXISTS max_posts_per_day INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS daily_posts_published INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_daily_reset DATE,
ADD COLUMN IF NOT EXISTS preferred_publish_times JSONB DEFAULT '["09:00", "13:00", "17:00"]',
ADD COLUMN IF NOT EXISTS banner_positions JSONB DEFAULT '["after-intro", "mid-article", "before-conclusion"]',
ADD COLUMN IF NOT EXISTS affiliate_link_count_min INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS affiliate_link_count_max INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS learning_weights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS internal_linking_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN content_pipeline.max_posts_per_day IS 'Maximum number of articles to publish per day (1-3)';
COMMENT ON COLUMN content_pipeline.daily_posts_published IS 'Counter for posts published today, resets daily';
COMMENT ON COLUMN content_pipeline.last_daily_reset IS 'Date of last counter reset for daily limit tracking';
COMMENT ON COLUMN content_pipeline.preferred_publish_times IS 'Array of preferred publish times in HH:MM format';
COMMENT ON COLUMN content_pipeline.banner_positions IS 'Array of positions for affiliate banner insertion';
COMMENT ON COLUMN content_pipeline.affiliate_link_count_min IS 'Minimum number of affiliate links per article';
COMMENT ON COLUMN content_pipeline.affiliate_link_count_max IS 'Maximum number of affiliate links per article';
COMMENT ON COLUMN content_pipeline.learning_weights IS 'ML-derived weights for content optimization';
COMMENT ON COLUMN content_pipeline.internal_linking_enabled IS 'Whether to auto-insert internal links to related articles';

-- ============================================
-- 1.2 ALTER content_queue TABLE
-- ============================================

ALTER TABLE content_queue
ADD COLUMN IF NOT EXISTS opportunity_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS affiliate_program_id UUID,
ADD COLUMN IF NOT EXISTS banner_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS internal_links JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS generation_priority INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN content_queue.opportunity_score IS 'Calculated score (0-100) indicating keyword/content opportunity';
COMMENT ON COLUMN content_queue.affiliate_program_id IS 'Selected affiliate program for this article';
COMMENT ON COLUMN content_queue.banner_config IS 'Banner placement configuration for this article';
COMMENT ON COLUMN content_queue.internal_links IS 'Array of internal links to insert in this article';
COMMENT ON COLUMN content_queue.generation_priority IS 'Priority for queue ordering (1-100, higher = more urgent)';

-- Create index for efficient priority ordering
CREATE INDEX IF NOT EXISTS idx_content_queue_priority ON content_queue(blog_id, generation_priority DESC, scheduled_date ASC);

-- ============================================
-- 1.3 CREATE article_performance TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS article_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  article_id UUID REFERENCES generated_articles(id) ON DELETE SET NULL,
  wordpress_post_id INTEGER,
  views INTEGER DEFAULT 0,
  affiliate_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  word_count INTEGER,
  section_count INTEGER,
  content_type TEXT,
  keywords JSONB DEFAULT '[]',
  banner_positions_used JSONB DEFAULT '[]',
  affiliate_links_count INTEGER DEFAULT 0,
  internal_links_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  avg_time_on_page INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE article_performance IS 'Tracks performance metrics for published articles to enable ML-based learning';
COMMENT ON COLUMN article_performance.engagement_score IS 'Calculated engagement score (0-100) based on views, clicks, time on page';
COMMENT ON COLUMN article_performance.content_type IS 'Type of content: review, comparison, guide, listicle, tutorial';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_article_performance_blog ON article_performance(blog_id);
CREATE INDEX IF NOT EXISTS idx_article_performance_engagement ON article_performance(blog_id, engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_article_performance_created ON article_performance(blog_id, created_at DESC);

-- ============================================
-- 1.4 CREATE topic_clusters TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS topic_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  cluster_name TEXT NOT NULL,
  pillar_keyword TEXT NOT NULL,
  pillar_article_id UUID REFERENCES generated_articles(id) ON DELETE SET NULL,
  related_keywords JSONB DEFAULT '[]',
  article_ids JSONB DEFAULT '[]',
  total_articles INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  avg_engagement_score DECIMAL(5,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE topic_clusters IS 'Groups related articles into topic clusters for internal linking strategy';
COMMENT ON COLUMN topic_clusters.pillar_keyword IS 'Main keyword for this topic cluster (pillar content)';
COMMENT ON COLUMN topic_clusters.pillar_article_id IS 'The main pillar article for this cluster';
COMMENT ON COLUMN topic_clusters.related_keywords IS 'Array of related keywords covered in cluster articles';
COMMENT ON COLUMN topic_clusters.article_ids IS 'Array of article UUIDs in this cluster';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_topic_clusters_blog ON topic_clusters(blog_id);
CREATE INDEX IF NOT EXISTS idx_topic_clusters_pillar ON topic_clusters(blog_id, pillar_keyword);

-- ============================================
-- ADDITIONAL HELPER TABLES
-- ============================================

-- Affiliate program rotation tracking
CREATE TABLE IF NOT EXISTS affiliate_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  rotation_index INTEGER DEFAULT 0,
  program_ids JSONB DEFAULT '[]',
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blog_id)
);

COMMENT ON TABLE affiliate_rotation IS 'Tracks round-robin rotation state for affiliate programs per blog';

-- Publish log for daily limit tracking
CREATE TABLE IF NOT EXISTS publish_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  article_id UUID REFERENCES generated_articles(id) ON DELETE SET NULL,
  queue_item_id UUID REFERENCES content_queue(id) ON DELETE SET NULL,
  wordpress_post_id INTEGER,
  wordpress_url TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  publish_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE publish_log IS 'Log of all published articles for daily limit tracking and analytics';

CREATE INDEX IF NOT EXISTS idx_publish_log_blog_date ON publish_log(blog_id, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_publish_log_published ON publish_log(blog_id, published_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE article_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_rotation ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (assuming user_id column exists on blogs table)
-- These policies ensure users can only access their own data

CREATE POLICY "Users can view own article_performance" ON article_performance
  FOR SELECT USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own article_performance" ON article_performance
  FOR INSERT WITH CHECK (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own article_performance" ON article_performance
  FOR UPDATE USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own topic_clusters" ON topic_clusters
  FOR SELECT USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own topic_clusters" ON topic_clusters
  FOR INSERT WITH CHECK (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own topic_clusters" ON topic_clusters
  FOR UPDATE USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own affiliate_rotation" ON affiliate_rotation
  FOR SELECT USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own affiliate_rotation" ON affiliate_rotation
  FOR ALL USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own publish_log" ON publish_log
  FOR SELECT USING (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own publish_log" ON publish_log
  FOR INSERT WITH CHECK (
    blog_id IN (SELECT id FROM blogs WHERE user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS FOR DAILY LIMIT MANAGEMENT
-- ============================================

-- Function to check and reset daily counter if needed
CREATE OR REPLACE FUNCTION check_and_reset_daily_counter(p_blog_id UUID)
RETURNS TABLE(can_publish BOOLEAN, posts_today INTEGER, max_posts INTEGER, remaining_slots INTEGER) AS $$
DECLARE
  v_pipeline RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get pipeline settings
  SELECT * INTO v_pipeline FROM content_pipeline WHERE blog_id = p_blog_id;

  IF v_pipeline IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 0;
    RETURN;
  END IF;

  -- Reset counter if new day
  IF v_pipeline.last_daily_reset IS NULL OR v_pipeline.last_daily_reset < v_today THEN
    UPDATE content_pipeline
    SET daily_posts_published = 0, last_daily_reset = v_today
    WHERE blog_id = p_blog_id;

    v_pipeline.daily_posts_published := 0;
  END IF;

  -- Return current status
  RETURN QUERY SELECT
    v_pipeline.daily_posts_published < v_pipeline.max_posts_per_day,
    v_pipeline.daily_posts_published::INTEGER,
    v_pipeline.max_posts_per_day::INTEGER,
    (v_pipeline.max_posts_per_day - v_pipeline.daily_posts_published)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to increment daily publish counter
CREATE OR REPLACE FUNCTION increment_daily_publish_counter(p_blog_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_publish BOOLEAN;
BEGIN
  -- Check if we can publish
  SELECT can_publish INTO v_can_publish FROM check_and_reset_daily_counter(p_blog_id);

  IF v_can_publish THEN
    UPDATE content_pipeline
    SET daily_posts_published = daily_posts_published + 1,
        articles_published = articles_published + 1,
        last_publish_at = NOW()
    WHERE blog_id = p_blog_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get next publish time slot
CREATE OR REPLACE FUNCTION get_next_publish_slot(p_blog_id UUID)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_pipeline RECORD;
  v_times JSONB;
  v_posts_today INTEGER;
  v_next_time TEXT;
  v_today DATE := CURRENT_DATE;
  v_now TIME := CURRENT_TIME;
BEGIN
  SELECT * INTO v_pipeline FROM content_pipeline WHERE blog_id = p_blog_id;

  IF v_pipeline IS NULL THEN
    RETURN NULL;
  END IF;

  v_times := v_pipeline.preferred_publish_times;
  v_posts_today := v_pipeline.daily_posts_published;

  -- If we've hit daily limit, return tomorrow's first slot
  IF v_posts_today >= v_pipeline.max_posts_per_day THEN
    v_next_time := v_times->>0;
    RETURN (v_today + INTERVAL '1 day')::DATE + v_next_time::TIME;
  END IF;

  -- Find next available slot today
  FOR i IN 0..jsonb_array_length(v_times)-1 LOOP
    v_next_time := v_times->>i;
    IF v_next_time::TIME > v_now AND i >= v_posts_today THEN
      RETURN v_today + v_next_time::TIME;
    END IF;
  END LOOP;

  -- All slots used today, return tomorrow's first slot
  v_next_time := v_times->>0;
  RETURN (v_today + INTERVAL '1 day')::DATE + v_next_time::TIME;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE 'Pipeline enhancements migration complete.';
  RAISE NOTICE 'Tables created/modified: content_pipeline, content_queue, article_performance, topic_clusters, affiliate_rotation, publish_log';
  RAISE NOTICE 'Functions created: check_and_reset_daily_counter, increment_daily_publish_counter, get_next_publish_slot';
END $$;
`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    },
    body: sql
  };
};
