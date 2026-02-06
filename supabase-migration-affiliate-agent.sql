-- ============================================================
-- Affiliate Agent Migration
-- Tables: affiliate_application_profile, affiliate_clicks, affiliate_assets
-- ============================================================

-- Table 1: affiliate_application_profile (one per user)
-- Stores business details filled once, reused for all affiliate applications
CREATE TABLE IF NOT EXISTS affiliate_application_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    website_url TEXT,
    niche_description TEXT,
    monthly_traffic_estimate TEXT, -- "< 1000", "1000-5000", "5000-10000", "10000-50000", "50000+"
    audience_demographics TEXT,
    audience_geo TEXT,
    content_types TEXT[] DEFAULT '{}',
    social_media_links JSONB DEFAULT '{}',
    preferred_payment_method TEXT, -- "paypal", "bank_transfer", "check"
    paypal_email TEXT,
    is_us_based BOOLEAN DEFAULT true,
    tax_id_type TEXT, -- "ein", "ssn", "non_us"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for affiliate_application_profile
ALTER TABLE affiliate_application_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON affiliate_application_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON affiliate_application_profile
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON affiliate_application_profile
    FOR UPDATE USING (auth.uid() = user_id);

-- Table 2: affiliate_clicks (public insert for tracking)
-- Logs every affiliate link click with UTM data
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES affiliate_programs(id) ON DELETE SET NULL,
    article_id UUID,
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    utm_source TEXT,
    utm_medium TEXT DEFAULT 'affiliate',
    utm_campaign TEXT,
    utm_content TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    referrer_url TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    event_type TEXT DEFAULT 'click', -- "click" or "conversion"
    conversion_value DECIMAL(10,2),
    order_id TEXT
);

-- Indexes for affiliate_clicks
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_program_date ON affiliate_clicks(program_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_article_date ON affiliate_clicks(article_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_blog_date ON affiliate_clicks(blog_id, clicked_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_event_type ON affiliate_clicks(event_type);

-- RLS for affiliate_clicks
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own clicks
CREATE POLICY "Users can view own clicks" ON affiliate_clicks
    FOR SELECT USING (auth.uid() = user_id);

-- Anyone can insert clicks (public tracking endpoint)
CREATE POLICY "Public click tracking insert" ON affiliate_clicks
    FOR INSERT WITH CHECK (true);

-- Table 3: affiliate_assets (per program)
-- Stores scraped/manual banners, links, coupons, logos
CREATE TABLE IF NOT EXISTS affiliate_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES affiliate_programs(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- "banner", "text_link", "logo", "coupon", "product_image"
    asset_url TEXT,
    asset_html TEXT,
    dimensions TEXT, -- "728x90" etc.
    alt_text TEXT,
    coupon_code TEXT,
    offer_description TEXT,
    offer_expiry TIMESTAMPTZ,
    status TEXT DEFAULT 'active', -- "active", "expired", "disabled"
    source TEXT DEFAULT 'manual', -- "scraped", "manual", "api"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for affiliate_assets
CREATE INDEX IF NOT EXISTS idx_affiliate_assets_program ON affiliate_assets(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_assets_user ON affiliate_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_assets_type ON affiliate_assets(asset_type);

-- RLS for affiliate_assets
ALTER TABLE affiliate_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON affiliate_assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON affiliate_assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON affiliate_assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON affiliate_assets
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can insert assets (for backend scraping)
CREATE POLICY "Service can insert assets" ON affiliate_assets
    FOR INSERT WITH CHECK (true);
