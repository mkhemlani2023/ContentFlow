-- Content Pipeline Tables for SEO Wizard
-- Run this migration in Supabase SQL Editor

-- =====================================================
-- TABLE 1: content_queue
-- Stores articles ready for publishing on schedule
-- =====================================================
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  article_id UUID REFERENCES generated_articles(id) ON DELETE SET NULL,

  -- Queue status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_date TIMESTAMPTZ,     -- When to publish
  published_at TIMESTAMPTZ,       -- When actually published

  -- Article metadata (cached for quick display)
  title TEXT NOT NULL,
  target_keyword TEXT,
  word_count INTEGER DEFAULT 0,
  has_images BOOLEAN DEFAULT false,
  has_affiliate_links BOOLEAN DEFAULT false,
  model_tier TEXT DEFAULT 'premium',

  -- WordPress publishing info
  wordpress_post_id INTEGER,
  wordpress_url TEXT,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_content_queue_blog_id ON content_queue(blog_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_scheduled ON content_queue(scheduled_date) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_content_queue_user_id ON content_queue(user_id);

-- Enable RLS
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_queue
CREATE POLICY "Users can view own queue items"
  ON content_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items"
  ON content_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue items"
  ON content_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue items"
  ON content_queue FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 2: content_pipeline
-- Stores pipeline configuration per blog
-- =====================================================
CREATE TABLE IF NOT EXISTS content_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pipeline settings
  target_queue_size INTEGER DEFAULT 20,
  publish_schedule JSONB DEFAULT '{"frequency": "3x_week", "days": ["monday", "wednesday", "friday"], "time": "09:00", "timezone": "America/New_York"}'::jsonb,
  model_tier TEXT DEFAULT 'premium' CHECK (model_tier IN ('basic', 'premium', 'enterprise')),
  word_count INTEGER DEFAULT 2000,
  affiliate_program_id UUID REFERENCES affiliate_programs(id) ON DELETE SET NULL,

  -- Image generation settings
  image_generation TEXT DEFAULT 'ai' CHECK (image_generation IN ('ai', 'stock', 'none')),

  -- Pipeline status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'stopped')),
  articles_published INTEGER DEFAULT 0,
  articles_generated INTEGER DEFAULT 0,
  last_generation_at TIMESTAMPTZ,
  last_publish_at TIMESTAMPTZ,

  -- Content context (for thematic continuity)
  niche_keyword TEXT,
  covered_keywords JSONB DEFAULT '[]'::jsonb,       -- Keywords already targeted
  content_themes JSONB DEFAULT '[]'::jsonb,         -- Extracted themes from existing content
  topic_clusters JSONB DEFAULT '[]'::jsonb,         -- Topic clusters for the niche

  -- Revenue tracking
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_pipeline_blog_id ON content_pipeline(blog_id);
CREATE INDEX IF NOT EXISTS idx_content_pipeline_user_id ON content_pipeline(user_id);
CREATE INDEX IF NOT EXISTS idx_content_pipeline_status ON content_pipeline(status);

-- Enable RLS
ALTER TABLE content_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_pipeline
CREATE POLICY "Users can view own pipelines"
  ON content_pipeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipelines"
  ON content_pipeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipelines"
  ON content_pipeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pipelines"
  ON content_pipeline FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ALTER BLOGS TABLE
-- Add publish_schedule column for backwards compatibility
-- =====================================================
ALTER TABLE blogs
ADD COLUMN IF NOT EXISTS publish_schedule JSONB DEFAULT '{"frequency": "3x_week", "days": ["monday", "wednesday", "friday"], "time": "09:00", "timezone": "America/New_York"}'::jsonb;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get due articles for publishing
CREATE OR REPLACE FUNCTION get_due_articles()
RETURNS SETOF content_queue AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM content_queue
  WHERE status = 'scheduled'
    AND scheduled_date <= NOW()
  ORDER BY scheduled_date ASC
  LIMIT 50; -- Process in batches
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get queue statistics for a blog
CREATE OR REPLACE FUNCTION get_queue_stats(p_blog_id UUID)
RETURNS TABLE (
  pending_count INTEGER,
  scheduled_count INTEGER,
  published_count INTEGER,
  failed_count INTEGER,
  next_scheduled TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_count,
    COUNT(*) FILTER (WHERE status = 'scheduled')::INTEGER as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'published')::INTEGER as published_count,
    COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as failed_count,
    MIN(scheduled_date) FILTER (WHERE status = 'scheduled') as next_scheduled
  FROM content_queue
  WHERE blog_id = p_blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule articles based on frequency
CREATE OR REPLACE FUNCTION schedule_queue_articles(
  p_blog_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER AS $$
DECLARE
  v_pipeline content_pipeline%ROWTYPE;
  v_schedule JSONB;
  v_frequency TEXT;
  v_time TEXT;
  v_timezone TEXT;
  v_days TEXT[];
  v_article RECORD;
  v_current_date TIMESTAMPTZ;
  v_day_index INTEGER;
  v_scheduled_count INTEGER := 0;
BEGIN
  -- Get pipeline settings
  SELECT * INTO v_pipeline FROM content_pipeline WHERE blog_id = p_blog_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_schedule := v_pipeline.publish_schedule;
  v_frequency := v_schedule->>'frequency';
  v_time := COALESCE(v_schedule->>'time', '09:00');
  v_timezone := COALESCE(v_schedule->>'timezone', 'America/New_York');

  -- Parse days array
  SELECT array_agg(d) INTO v_days
  FROM jsonb_array_elements_text(v_schedule->'days') d;

  v_current_date := p_start_date;
  v_day_index := 0;

  -- Schedule each pending article
  FOR v_article IN
    SELECT id
    FROM content_queue
    WHERE blog_id = p_blog_id AND status = 'pending'
    ORDER BY created_at
  LOOP
    -- Find next valid publishing day
    WHILE NOT (LOWER(to_char(v_current_date, 'Day')) = ANY(v_days)) LOOP
      v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    -- Update article with scheduled date
    UPDATE content_queue
    SET
      status = 'scheduled',
      scheduled_date = (v_current_date::DATE || ' ' || v_time)::TIMESTAMPTZ,
      updated_at = NOW()
    WHERE id = v_article.id;

    v_scheduled_count := v_scheduled_count + 1;

    -- Move to next day for next article
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RETURN v_scheduled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_queue_updated_at
  BEFORE UPDATE ON content_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pipeline_updated_at
  BEFORE UPDATE ON content_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON content_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_pipeline TO authenticated;
GRANT EXECUTE ON FUNCTION get_due_articles TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_stats TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_queue_articles TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Content Pipeline tables created successfully!';
  RAISE NOTICE 'Tables created: content_queue, content_pipeline';
  RAISE NOTICE 'Functions created: get_due_articles, get_queue_stats, schedule_queue_articles';
END $$;
