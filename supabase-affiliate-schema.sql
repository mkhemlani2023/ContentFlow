-- Affiliate Programs Schema for ContentFlow
-- Add this to your Supabase database

-- Affiliate Programs table - stores affiliate program details per blog
CREATE TABLE IF NOT EXISTS affiliate_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,

    -- Program Details
    program_name TEXT NOT NULL, -- e.g., "Viome", "Seed Probiotics"
    program_url TEXT, -- Affiliate program homepage
    network TEXT, -- e.g., "ShareASale", "Impact", "Direct"

    -- Commission & Terms
    commission_rate TEXT, -- e.g., "10%", "$50 per sale", "Tiered 5-15%"
    commission_type TEXT, -- "percentage", "flat", "tiered", "hybrid"
    cookie_duration TEXT, -- e.g., "30 days", "lifetime", "24 hours"
    minimum_payout DECIMAL(10,2), -- Minimum to receive payment
    payment_frequency TEXT, -- e.g., "monthly", "net-30", "net-60"
    payment_methods TEXT[], -- ["PayPal", "Direct Deposit", "Check"]

    -- Affiliate IDs & Links
    affiliate_id TEXT, -- User's affiliate ID (e.g., "viome-123")
    affiliate_link_template TEXT, -- Link template with placeholder
    tracking_params JSONB, -- Additional tracking parameters

    -- Program Requirements & Terms
    terms_summary TEXT, -- AI-generated summary of T&Cs
    program_requirements TEXT, -- Requirements to join/maintain
    prohibited_content TEXT[], -- What content is not allowed
    disclosure_required BOOLEAN DEFAULT true,

    -- AI Analysis
    ai_summary JSONB, -- Full AI analysis of the program
    target_audience TEXT, -- Who this program is good for
    content_opportunities JSONB, -- Suggested content types/topics
    competitive_analysis TEXT, -- How it compares to alternatives

    -- Status & Performance
    signup_status TEXT DEFAULT 'pending', -- pending, applied, approved, active, rejected
    signup_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- active, paused, inactive

    -- Metadata
    notes TEXT, -- User notes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(blog_id, program_name) -- One program per blog
);

-- Affiliate Content table - tracks articles with affiliate links
CREATE TABLE IF NOT EXISTS affiliate_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
    affiliate_program_id UUID REFERENCES affiliate_programs(id) ON DELETE CASCADE,

    -- Content Details
    article_title TEXT,
    article_url TEXT, -- Published URL

    -- Affiliate Metrics
    affiliate_links_count INTEGER DEFAULT 0,
    primary_cta TEXT, -- Main call-to-action used

    -- Traffic & Performance Predictions
    predicted_monthly_traffic INTEGER,
    predicted_conversion_rate DECIMAL(5,2), -- Estimated conversion %
    predicted_monthly_revenue DECIMAL(10,2),

    -- Actual Performance (to be tracked later)
    actual_clicks INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_revenue DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    content_type TEXT, -- "review", "comparison", "roundup", "guide"
    target_keywords TEXT[], -- Keywords this article targets
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_affiliate_programs_blog_id ON affiliate_programs(blog_id);
CREATE INDEX idx_affiliate_programs_user_id ON affiliate_programs(user_id);
CREATE INDEX idx_affiliate_programs_status ON affiliate_programs(status);
CREATE INDEX idx_affiliate_content_article_id ON affiliate_content(article_id);
CREATE INDEX idx_affiliate_content_program_id ON affiliate_content(affiliate_program_id);
CREATE INDEX idx_affiliate_content_blog_id ON affiliate_content(blog_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_content ENABLE ROW LEVEL SECURITY;

-- Affiliate Programs Policies
CREATE POLICY "Users can view their own affiliate programs"
    ON affiliate_programs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate programs"
    ON affiliate_programs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate programs"
    ON affiliate_programs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affiliate programs"
    ON affiliate_programs FOR DELETE
    USING (auth.uid() = user_id);

-- Affiliate Content Policies
CREATE POLICY "Users can view their own affiliate content"
    ON affiliate_content FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affiliate content"
    ON affiliate_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affiliate content"
    ON affiliate_content FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affiliate content"
    ON affiliate_content FOR DELETE
    USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_affiliate_programs_updated_at
    BEFORE UPDATE ON affiliate_programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_content_updated_at
    BEFORE UPDATE ON affiliate_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data structure (comments showing expected JSON format)

-- ai_summary JSONB example:
-- {
--   "overview": "Viome is a health tech company offering microbiome testing...",
--   "products": ["Gut Intelligence Test", "Full Body Intelligence Test"],
--   "commission_structure": "15% on all products, 20% on subscriptions",
--   "pros": ["High commission", "Recurring revenue", "Premium brand"],
--   "cons": ["Higher price point", "Niche audience"],
--   "best_content_types": ["Reviews", "How it works", "Comparison with competitors"]
-- }

-- content_opportunities JSONB example:
-- {
--   "review_articles": ["Viome Gut Test Review 2025", "Is Viome Worth It?"],
--   "comparison_articles": ["Viome vs Thorne", "Viome vs Ombre"],
--   "guide_articles": ["How to Interpret Viome Results", "Best Microbiome Tests"],
--   "keywords": ["viome review", "gut microbiome test", "personalized nutrition"]
-- }

-- tracking_params JSONB example:
-- {
--   "utm_source": "gutandbody",
--   "utm_medium": "affiliate",
--   "utm_campaign": "viome-review",
--   "custom_param": "value"
-- }
