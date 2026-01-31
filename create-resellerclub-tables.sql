-- ResellerClub Integration Tables for SEO Wizard
-- Run this migration in Supabase SQL Editor

-- =====================================================
-- TABLE 1: resellerclub_customers
-- Links Supabase users to ResellerClub customer accounts
-- =====================================================
CREATE TABLE IF NOT EXISTS resellerclub_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- ResellerClub customer details
  resellerclub_customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,

  -- Contact details (cached)
  address_line_1 TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  phone_cc TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Default contact ID for domain registrations
  default_contact_id TEXT,

  -- Account status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  balance DECIMAL(10,2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rc_customers_user_id ON resellerclub_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_customers_email ON resellerclub_customers(email);
CREATE INDEX IF NOT EXISTS idx_rc_customers_rc_id ON resellerclub_customers(resellerclub_customer_id);

-- Enable RLS
ALTER TABLE resellerclub_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own RC customer" ON resellerclub_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own RC customer" ON resellerclub_customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RC customer" ON resellerclub_customers FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 2: domain_orders
-- Tracks domain registrations from ResellerClub
-- =====================================================
CREATE TABLE IF NOT EXISTS domain_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,

  -- ResellerClub order details
  resellerclub_order_id TEXT NOT NULL,
  resellerclub_customer_id TEXT NOT NULL,

  -- Domain details
  domain_name TEXT NOT NULL,
  tld TEXT NOT NULL,
  registration_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  years INTEGER DEFAULT 1,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'transferred')),
  auto_renew BOOLEAN DEFAULT true,

  -- Privacy
  privacy_enabled BOOLEAN DEFAULT false,

  -- Nameservers (stored as JSON array)
  nameservers JSONB DEFAULT '["ns1.resellerclub.com", "ns2.resellerclub.com"]'::jsonb,

  -- Cost tracking
  purchase_price DECIMAL(10,2),
  renewal_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_domain_orders_user_id ON domain_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_orders_domain ON domain_orders(domain_name);
CREATE INDEX IF NOT EXISTS idx_domain_orders_status ON domain_orders(status);
CREATE INDEX IF NOT EXISTS idx_domain_orders_expiry ON domain_orders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_domain_orders_rc_order ON domain_orders(resellerclub_order_id);

-- Enable RLS
ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own domains" ON domain_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own domains" ON domain_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own domains" ON domain_orders FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 3: hosting_orders
-- Tracks web hosting from ResellerClub
-- =====================================================
CREATE TABLE IF NOT EXISTS hosting_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
  domain_order_id UUID REFERENCES domain_orders(id) ON DELETE SET NULL,

  -- ResellerClub order details
  resellerclub_order_id TEXT NOT NULL,
  resellerclub_customer_id TEXT NOT NULL,

  -- Hosting details
  domain_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT,
  hosting_type TEXT DEFAULT 'linux' CHECK (hosting_type IN ('linux', 'windows')),
  region TEXT DEFAULT 'US',

  -- Duration
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  months INTEGER DEFAULT 12,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT true,

  -- Server details (populated after provisioning)
  server_ip TEXT,
  cpanel_url TEXT,
  ftp_hostname TEXT,
  ftp_username TEXT,

  -- Resource limits
  disk_space_mb INTEGER,
  bandwidth_mb INTEGER,
  email_accounts INTEGER,
  databases INTEGER,

  -- Cost tracking
  purchase_price DECIMAL(10,2),
  renewal_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hosting_orders_user_id ON hosting_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_hosting_orders_domain ON hosting_orders(domain_name);
CREATE INDEX IF NOT EXISTS idx_hosting_orders_status ON hosting_orders(status);
CREATE INDEX IF NOT EXISTS idx_hosting_orders_expiry ON hosting_orders(expiry_date);

-- Enable RLS
ALTER TABLE hosting_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own hosting" ON hosting_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hosting" ON hosting_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own hosting" ON hosting_orders FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 4: email_orders
-- Tracks email hosting from ResellerClub
-- =====================================================
CREATE TABLE IF NOT EXISTS email_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID REFERENCES blogs(id) ON DELETE SET NULL,
  domain_order_id UUID REFERENCES domain_orders(id) ON DELETE SET NULL,

  -- ResellerClub order details
  resellerclub_order_id TEXT NOT NULL,
  resellerclub_customer_id TEXT NOT NULL,

  -- Email hosting details
  domain_name TEXT NOT NULL,
  provider TEXT DEFAULT 'titan' CHECK (provider IN ('titan', 'google', 'microsoft')),
  plan_id TEXT,
  plan_name TEXT,

  -- Account details
  num_accounts INTEGER DEFAULT 1,
  storage_per_account_gb INTEGER DEFAULT 10,

  -- Duration
  start_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  months INTEGER DEFAULT 12,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT true,

  -- DNS records for email setup (cached)
  mx_records JSONB,
  spf_record TEXT,
  dkim_record TEXT,

  -- Cost tracking
  purchase_price DECIMAL(10,2),
  renewal_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_orders_user_id ON email_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_orders_domain ON email_orders(domain_name);
CREATE INDEX IF NOT EXISTS idx_email_orders_status ON email_orders(status);
CREATE INDEX IF NOT EXISTS idx_email_orders_expiry ON email_orders(expiry_date);

-- Enable RLS
ALTER TABLE email_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email orders" ON email_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email orders" ON email_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email orders" ON email_orders FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 5: email_accounts
-- Individual email accounts under an email order
-- =====================================================
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_order_id UUID REFERENCES email_orders(id) ON DELETE CASCADE,

  -- Account details
  email_address TEXT NOT NULL,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Storage
  storage_used_mb INTEGER DEFAULT 0,
  storage_limit_mb INTEGER,

  -- Webmail access
  webmail_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_order_id ON email_accounts(email_order_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email_address);

-- Enable RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email accounts" ON email_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email accounts" ON email_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email accounts" ON email_accounts FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 6: service_transactions
-- Tracks all billing transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS service_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Order reference (one of these will be set)
  domain_order_id UUID REFERENCES domain_orders(id) ON DELETE SET NULL,
  hosting_order_id UUID REFERENCES hosting_orders(id) ON DELETE SET NULL,
  email_order_id UUID REFERENCES email_orders(id) ON DELETE SET NULL,

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'upgrade', 'refund', 'credit')),
  service_type TEXT NOT NULL CHECK (service_type IN ('domain', 'hosting', 'email', 'addon', 'credit')),

  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- External references
  resellerclub_transaction_id TEXT,
  stripe_payment_intent_id TEXT,

  -- Description
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_transactions_user_id ON service_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_service_transactions_type ON service_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_service_transactions_status ON service_transactions(status);
CREATE INDEX IF NOT EXISTS idx_service_transactions_created ON service_transactions(created_at);

-- Enable RLS
ALTER TABLE service_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own transactions" ON service_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON service_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's service summary
CREATE OR REPLACE FUNCTION get_user_services_summary(p_user_id UUID)
RETURNS TABLE (
  active_domains INTEGER,
  expiring_domains INTEGER,
  active_hosting INTEGER,
  active_email INTEGER,
  total_email_accounts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM domain_orders WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM domain_orders WHERE user_id = p_user_id AND status = 'active' AND expiry_date < NOW() + INTERVAL '30 days'),
    (SELECT COUNT(*)::INTEGER FROM hosting_orders WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM email_orders WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM email_accounts WHERE user_id = p_user_id AND status = 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get domains expiring soon
CREATE OR REPLACE FUNCTION get_expiring_domains(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS SETOF domain_orders AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM domain_orders
  WHERE user_id = p_user_id
    AND status = 'active'
    AND expiry_date < NOW() + (p_days || ' days')::INTERVAL
  ORDER BY expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_rc_customers_updated_at
  BEFORE UPDATE ON resellerclub_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_orders_updated_at
  BEFORE UPDATE ON domain_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_orders_updated_at
  BEFORE UPDATE ON hosting_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_orders_updated_at
  BEFORE UPDATE ON email_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON resellerclub_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON domain_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON hosting_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_accounts TO authenticated;
GRANT SELECT, INSERT ON service_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_services_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_expiring_domains TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'ResellerClub Integration tables created successfully!';
  RAISE NOTICE 'Tables: resellerclub_customers, domain_orders, hosting_orders, email_orders, email_accounts, service_transactions';
  RAISE NOTICE 'Functions: get_user_services_summary, get_expiring_domains';
END $$;
