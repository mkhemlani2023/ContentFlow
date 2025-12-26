-- Complete ContentFlow Database Schema
-- Run this ONCE in Supabase SQL Editor to create all tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    credits INTEGER DEFAULT 50000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keyword TEXT,
    content JSONB NOT NULL,
    metadata JSONB,
    images JSONB,
    word_count INTEGER,
    model_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    signin_url TEXT,
    username TEXT,
    password TEXT,
    api_key TEXT,
    status TEXT DEFAULT 'active',
    ga_property_id TEXT,
    ga_credentials JSONB,
    ga_access_token TEXT,
    ga_refresh_token TEXT,
    ga_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publish logs table
CREATE TABLE IF NOT EXISTS publish_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
    blog_name TEXT,
    article_title TEXT,
    post_id TEXT,
    post_url TEXT,
    status TEXT NOT NULL,
    publish_type TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website metrics table
CREATE TABLE IF NOT EXISTS website_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Article traffic table
CREATE TABLE IF NOT EXISTS article_traffic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    post_id TEXT NOT NULL,
    article_url TEXT NOT NULL,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blog_id, post_id, date)
);

-- ========================================
-- AFFILIATE MARKETING TABLES
-- ========================================

-- Affiliate Programs table
CREATE TABLE IF NOT EXISTS affiliate_programs (
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

-- Affiliate Content table
CREATE TABLE IF NOT EXISTS affiliate_content (
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

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_user_id ON publish_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_logs_blog_id ON publish_logs(blog_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_article_traffic_blog_id ON article_traffic(blog_id);
CREATE INDEX IF NOT EXISTS idx_article_traffic_post_id ON article_traffic(post_id);
CREATE INDEX IF NOT EXISTS idx_article_traffic_date ON article_traffic(date);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_blog_id ON affiliate_programs(blog_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_user_id ON affiliate_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_content_article_id ON affiliate_content(article_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_content_program_id ON affiliate_content(affiliate_program_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_content_blog_id ON affiliate_content(blog_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_traffic ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Articles Policies
CREATE POLICY IF NOT EXISTS "Users can view own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

-- Blogs Policies
CREATE POLICY IF NOT EXISTS "Users can view own blogs" ON blogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own blogs" ON blogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own blogs" ON blogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own blogs" ON blogs FOR DELETE USING (auth.uid() = user_id);

-- Publish Logs Policies
CREATE POLICY IF NOT EXISTS "Users can view own publish logs" ON publish_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own publish logs" ON publish_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Website Metrics Policies
CREATE POLICY IF NOT EXISTS "Users can view own metrics" ON website_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own metrics" ON website_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit Transactions Policies
CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Article Traffic Policies
CREATE POLICY IF NOT EXISTS "Users can view own traffic" ON article_traffic FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own traffic" ON article_traffic FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own traffic" ON article_traffic FOR UPDATE USING (auth.uid() = user_id);

-- Affiliate Programs Policies
CREATE POLICY IF NOT EXISTS "Users can view own affiliate programs" ON affiliate_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own affiliate programs" ON affiliate_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own affiliate programs" ON affiliate_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own affiliate programs" ON affiliate_programs FOR DELETE USING (auth.uid() = user_id);

-- Affiliate Content Policies
CREATE POLICY IF NOT EXISTS "Users can view own affiliate content" ON affiliate_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own affiliate content" ON affiliate_content FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own affiliate content" ON affiliate_content FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can delete own affiliate content" ON affiliate_content FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_affiliate_programs_updated_at BEFORE UPDATE ON affiliate_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_affiliate_content_updated_at BEFORE UPDATE ON affiliate_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 'Schema setup complete!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
