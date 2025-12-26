-- Affiliate Programs Schema - Standalone
-- Run this ONLY for affiliate tables (assumes base tables already exist)

-- First, drop affiliate tables if they exist
DROP TABLE IF EXISTS affiliate_content CASCADE;
DROP TABLE IF EXISTS affiliate_programs CASCADE;

-- Create Affiliate Programs table
CREATE TABLE affiliate_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,

    -- Program Details
    program_name TEXT NOT NULL,
    program_url TEXT,
    network TEXT,

    -- Commission & Terms
    commission_rate TEXT,
    commission_type TEXT,
    cookie_duration TEXT,
    minimum_payout DECIMAL(10,2),
    payment_frequency TEXT,
    payment_methods TEXT[],

    -- Affiliate IDs & Links
    affiliate_id TEXT,
    affiliate_link_template TEXT,
    tracking_params JSONB,

    -- Program Requirements & Terms
    terms_summary TEXT,
    program_requirements TEXT,
    prohibited_content TEXT[],
    disclosure_required BOOLEAN DEFAULT true,

    -- AI Analysis
    ai_summary JSONB,
    target_audience TEXT,
    content_opportunities JSONB,
    competitive_analysis TEXT,

    -- Status & Performance
    signup_status TEXT DEFAULT 'pending',
    signup_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active',

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(blog_id, program_name)
);

-- Create Affiliate Content table
CREATE TABLE affiliate_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    affiliate_program_id UUID REFERENCES affiliate_programs(id) ON DELETE CASCADE,

    -- Content Details
    article_title TEXT,
    article_url TEXT,

    -- Affiliate Metrics
    affiliate_links_count INTEGER DEFAULT 0,
    primary_cta TEXT,

    -- Traffic & Performance Predictions
    predicted_monthly_traffic INTEGER,
    predicted_conversion_rate DECIMAL(5,2),
    predicted_monthly_revenue DECIMAL(10,2),

    -- Actual Performance
    actual_clicks INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_revenue DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    content_type TEXT,
    target_keywords TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_affiliate_programs_blog_id ON affiliate_programs(blog_id);
CREATE INDEX idx_affiliate_programs_user_id ON affiliate_programs(user_id);
CREATE INDEX idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX idx_affiliate_content_article_id ON affiliate_content(article_id);
CREATE INDEX idx_affiliate_content_program_id ON affiliate_content(affiliate_program_id);
CREATE INDEX idx_affiliate_content_blog_id ON affiliate_content(blog_id);

-- Enable RLS
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can insert own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can update own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can delete own affiliate programs" ON affiliate_programs;
DROP POLICY IF EXISTS "Users can view own affiliate content" ON affiliate_content;
DROP POLICY IF EXISTS "Users can insert own affiliate content" ON affiliate_content;
DROP POLICY IF EXISTS "Users can update own affiliate content" ON affiliate_content;
DROP POLICY IF EXISTS "Users can delete own affiliate content" ON affiliate_content;

-- Create RLS policies
CREATE POLICY "Users can view own affiliate programs" ON affiliate_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate programs" ON affiliate_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate programs" ON affiliate_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own affiliate programs" ON affiliate_programs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own affiliate content" ON affiliate_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate content" ON affiliate_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate content" ON affiliate_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own affiliate content" ON affiliate_content FOR DELETE USING (auth.uid() = user_id);

-- Create triggers
DROP TRIGGER IF EXISTS update_affiliate_programs_updated_at ON affiliate_programs;
DROP TRIGGER IF EXISTS update_affiliate_content_updated_at ON affiliate_content;

CREATE TRIGGER update_affiliate_programs_updated_at
    BEFORE UPDATE ON affiliate_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_content_updated_at
    BEFORE UPDATE ON affiliate_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify
SELECT 'Affiliate tables created successfully!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'affiliate%';
