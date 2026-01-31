-- ResellerClub Integration Tables
-- Run this SQL in your Supabase SQL Editor to create the reseller database structure

-- Domains table - stores domain registrations and orders
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    tld TEXT NOT NULL,  -- .com, .net, .org, etc.
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, active, expired, transferred, cancelled
    registration_date TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    privacy_protection BOOLEAN DEFAULT false,
    nameservers JSONB DEFAULT '[]'::jsonb,  -- Array of nameserver addresses
    dns_records JSONB DEFAULT '[]'::jsonb,  -- DNS configuration
    registrar_order_id TEXT,  -- ResellerClub order ID
    registrar_domain_id TEXT,  -- ResellerClub domain ID
    purchase_price DECIMAL(10, 2),
    renewal_price DECIMAL(10, 2),
    currency TEXT DEFAULT 'USD',
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,  -- Link to blog if used
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hosting accounts table - stores web hosting subscriptions
CREATE TABLE hosting_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,  -- siteground, cloudways, resellerclub, etc.
    plan_name TEXT NOT NULL,  -- starter, business, professional
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, provisioning, active, suspended, cancelled
    server_ip TEXT,
    cpanel_url TEXT,
    cpanel_username TEXT,  -- encrypted
    cpanel_password TEXT,  -- encrypted
    ftp_host TEXT,
    ftp_username TEXT,  -- encrypted
    ftp_password TEXT,  -- encrypted
    disk_space_gb INTEGER,
    bandwidth_gb INTEGER,
    databases_count INTEGER,
    email_accounts_count INTEGER,
    ssl_enabled BOOLEAN DEFAULT false,
    provider_account_id TEXT,  -- Provider's account ID
    provider_order_id TEXT,  -- Provider's order ID
    monthly_price DECIMAL(10, 2),
    billing_cycle TEXT DEFAULT 'monthly',  -- monthly, yearly, biennially
    next_billing_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email accounts table - stores email hosting subscriptions
CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,  -- google_workspace, microsoft_365, zoho, resellerclub
    plan_name TEXT NOT NULL,  -- basic, business, enterprise
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, provisioning, active, suspended, cancelled
    email_addresses JSONB DEFAULT '[]'::jsonb,  -- Array of email addresses under this plan
    max_users INTEGER DEFAULT 1,
    storage_per_user_gb INTEGER DEFAULT 15,
    admin_email TEXT,  -- Primary admin email
    provider_subscription_id TEXT,  -- Provider's subscription ID
    monthly_price_per_user DECIMAL(10, 2),
    billing_cycle TEXT DEFAULT 'monthly',
    next_billing_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Domain orders table - tracks all domain-related transactions
CREATE TABLE domain_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL,  -- registration, renewal, transfer, privacy
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed, refunded
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,  -- credit_card, paypal, credits
    payment_transaction_id TEXT,
    registrar_order_id TEXT,
    registrar_invoice_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Hosting orders table - tracks all hosting-related transactions
CREATE TABLE hosting_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hosting_account_id UUID REFERENCES hosting_accounts(id) ON DELETE SET NULL,
    order_type TEXT NOT NULL,  -- new, upgrade, downgrade, renewal
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed, refunded
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    billing_period TEXT,  -- 1month, 12months, 24months
    payment_method TEXT,
    payment_transaction_id TEXT,
    provider_order_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_domains_status ON domains(status);
CREATE INDEX idx_domains_domain_name ON domains(domain_name);
CREATE INDEX idx_domains_expiry_date ON domains(expiry_date);
CREATE INDEX idx_hosting_accounts_user_id ON hosting_accounts(user_id);
CREATE INDEX idx_hosting_accounts_status ON hosting_accounts(status);
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_domain_id ON email_accounts(domain_id);
CREATE INDEX idx_domain_orders_user_id ON domain_orders(user_id);
CREATE INDEX idx_domain_orders_status ON domain_orders(status);
CREATE INDEX idx_hosting_orders_user_id ON hosting_orders(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_orders ENABLE ROW LEVEL SECURITY;

-- Domains policies
CREATE POLICY "Users can view their own domains"
    ON domains FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains"
    ON domains FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
    ON domains FOR UPDATE
    USING (auth.uid() = user_id);

-- Hosting accounts policies
CREATE POLICY "Users can view their own hosting accounts"
    ON hosting_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hosting accounts"
    ON hosting_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hosting accounts"
    ON hosting_accounts FOR UPDATE
    USING (auth.uid() = user_id);

-- Email accounts policies
CREATE POLICY "Users can view their own email accounts"
    ON email_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email accounts"
    ON email_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
    ON email_accounts FOR UPDATE
    USING (auth.uid() = user_id);

-- Domain orders policies
CREATE POLICY "Users can view their own domain orders"
    ON domain_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domain orders"
    ON domain_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Hosting orders policies
CREATE POLICY "Users can view their own hosting orders"
    ON hosting_orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hosting orders"
    ON hosting_orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_accounts_updated_at BEFORE UPDATE ON hosting_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
