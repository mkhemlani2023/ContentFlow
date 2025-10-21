-- ContentFlow Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Articles table - stores generated articles
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    keyword TEXT,
    content JSONB NOT NULL,
    metadata JSONB,
    images JSONB DEFAULT '[]'::jsonb,
    word_count INTEGER,
    model_tier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blogs table - stores WordPress/Ghost/etc blog configurations
CREATE TABLE blogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL, -- wordpress, ghost, medium, etc
    url TEXT NOT NULL,
    signin_url TEXT,
    username TEXT, -- encrypted
    password TEXT, -- encrypted
    api_key TEXT, -- encrypted
    status TEXT DEFAULT 'active', -- active, inactive, error
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Publish logs table - tracks article publishing history
CREATE TABLE publish_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
    blog_name TEXT,
    article_title TEXT,
    post_id TEXT, -- WordPress post ID
    post_url TEXT, -- Live URL of published article
    status TEXT NOT NULL, -- success, failed, pending
    publish_type TEXT, -- now, draft, scheduled
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website metrics table - stores tracked website data
CREATE TABLE website_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions table - tracks credit purchases and usage
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- purchase, deduction, bonus
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table - extends auth.users with app-specific data
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    credits INTEGER DEFAULT 50000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_publish_logs_user_id ON publish_logs(user_id);
CREATE INDEX idx_publish_logs_created_at ON publish_logs(created_at DESC);
CREATE INDEX idx_website_metrics_user_id ON website_metrics(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Articles policies
CREATE POLICY "Users can view their own articles"
    ON articles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own articles"
    ON articles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
    ON articles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
    ON articles FOR DELETE
    USING (auth.uid() = user_id);

-- Blogs policies
CREATE POLICY "Users can view their own blogs"
    ON blogs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blogs"
    ON blogs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blogs"
    ON blogs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blogs"
    ON blogs FOR DELETE
    USING (auth.uid() = user_id);

-- Publish logs policies
CREATE POLICY "Users can view their own publish logs"
    ON publish_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own publish logs"
    ON publish_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Website metrics policies
CREATE POLICY "Users can view their own website metrics"
    ON website_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own website metrics"
    ON website_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own website metrics"
    ON website_metrics FOR DELETE
    USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view their own credit transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
    ON credit_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, credits, created_at)
    VALUES (NEW.id, NEW.email, 50000, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
