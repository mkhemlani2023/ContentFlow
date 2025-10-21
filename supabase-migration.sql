-- Migration script to add missing columns to existing tables

-- Add user_id to blogs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE blogs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add other missing columns to blogs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'signin_url') THEN
        ALTER TABLE blogs ADD COLUMN signin_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'username') THEN
        ALTER TABLE blogs ADD COLUMN username TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'password') THEN
        ALTER TABLE blogs ADD COLUMN password TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'api_key') THEN
        ALTER TABLE blogs ADD COLUMN api_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'status') THEN
        ALTER TABLE blogs ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'created_at') THEN
        ALTER TABLE blogs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blogs' AND column_name = 'updated_at') THEN
        ALTER TABLE blogs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add user_id to articles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'articles' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE articles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Now run the safe schema script
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missing tables
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

CREATE TABLE IF NOT EXISTS website_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    metrics JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    credits INTEGER DEFAULT 50000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_articles_user_id') THEN
        CREATE INDEX idx_articles_user_id ON articles(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_articles_created_at') THEN
        CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blogs_user_id') THEN
        CREATE INDEX idx_blogs_user_id ON blogs(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_publish_logs_user_id') THEN
        CREATE INDEX idx_publish_logs_user_id ON publish_logs(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_publish_logs_created_at') THEN
        CREATE INDEX idx_publish_logs_created_at ON publish_logs(created_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_website_metrics_user_id') THEN
        CREATE INDEX idx_website_metrics_user_id ON website_metrics(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_credit_transactions_user_id') THEN
        CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
    END IF;
END$$;

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;

DROP POLICY IF EXISTS "Users can view their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can insert their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can update their own blogs" ON blogs;
DROP POLICY IF EXISTS "Users can delete their own blogs" ON blogs;

DROP POLICY IF EXISTS "Users can view their own publish logs" ON publish_logs;
DROP POLICY IF EXISTS "Users can insert their own publish logs" ON publish_logs;

DROP POLICY IF EXISTS "Users can view their own website metrics" ON website_metrics;
DROP POLICY IF EXISTS "Users can insert their own website metrics" ON website_metrics;
DROP POLICY IF EXISTS "Users can delete their own website metrics" ON website_metrics;

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert their own credit transactions" ON credit_transactions;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create policies
CREATE POLICY "Users can view their own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own articles" ON articles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own blogs" ON blogs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own blogs" ON blogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blogs" ON blogs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blogs" ON blogs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own publish logs" ON publish_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own publish logs" ON publish_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own website metrics" ON website_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own website metrics" ON website_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own website metrics" ON website_metrics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, credits, created_at)
    VALUES (NEW.id, NEW.email, 50000, NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop existing update triggers
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
