-- ============================================
-- COMPLETE DATABASE SETUP FOR QUANTUM TRADE NEXUS
-- ============================================
-- This is the FINAL and COMPLETE SQL script
-- Run this in Supabase SQL Editor
-- It includes: Admin/Client roles, Transactions, Credit Transfers, Unique IDs, etc.
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING TABLES (if needed)
-- ============================================
-- WARNING: This will delete all data! Only run if starting fresh.
-- Comment out if you want to preserve existing data.

DROP TABLE IF EXISTS credit_transfers CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS portfolio_positions CASCADE;
DROP TABLE IF EXISTS watchlist CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- STEP 2: CREATE USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  account_balance NUMERIC DEFAULT 1500 NOT NULL,
  total_invested NUMERIC DEFAULT 0 NOT NULL,
  member_since TIMESTAMP DEFAULT NOW() NOT NULL,
  trading_level TEXT DEFAULT 'Beginner' NOT NULL,
  role TEXT DEFAULT 'client' NOT NULL CHECK (role IN ('admin', 'client')),
  unique_user_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE PORTFOLIO POSITIONS TABLE
-- ============================================
CREATE TABLE portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  average_price NUMERIC NOT NULL CHECK (average_price > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ============================================
-- STEP 4: CREATE TRANSACTIONS TABLE
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 5: CREATE WATCHLIST TABLE
-- ============================================
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ============================================
-- STEP 6: CREATE CREDIT TRANSFERS TABLE
-- ============================================
CREATE TABLE credit_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (from_user_id != to_user_id)
);

-- ============================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_unique_id ON users(unique_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_user_id ON portfolio_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_symbol ON portfolio_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_from_user ON credit_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_to_user ON credit_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_created_at ON credit_transfers(created_at DESC);

-- ============================================
-- STEP 8: CREATE FUNCTIONS
-- ============================================
-- Drop existing triggers first (they depend on functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_portfolio_positions_updated_at ON portfolio_positions;

-- Drop existing functions first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS generate_unique_user_id();
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS process_credit_transfer(UUID, UUID, NUMERIC);
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin(user_id UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Function to generate unique user ID
CREATE OR REPLACE FUNCTION generate_unique_user_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
BEGIN
  LOOP
    -- Generate a 6-digit random number
    new_id := 'USER' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    
    -- Check if this ID already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE unique_user_id = new_id) INTO exists_check;
    
    -- If unique, exit loop
    EXIT WHEN NOT exists_check;
    
    -- Prevent infinite loop
    attempts := attempts + 1;
    IF attempts > 100 THEN
      -- Fallback: use timestamp-based ID
      new_id := 'USER' || LPAD(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 10, '0');
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_unique_id TEXT;
BEGIN
  -- Generate unique user ID
  BEGIN
    user_unique_id := generate_unique_user_id();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if function fails
    user_unique_id := 'USER' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  END;
  
  -- Insert user profile with all required fields
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    account_balance, 
    total_invested, 
    trading_level, 
    member_since,
    unique_user_id,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1), 'User'),
    1500,
    0,
    'Beginner',
    NOW(),
    user_unique_id,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    name = COALESCE(EXCLUDED.name, users.name),
    unique_user_id = COALESCE(users.unique_user_id, EXCLUDED.unique_user_id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process credit transfers (atomic operation)
CREATE OR REPLACE FUNCTION process_credit_transfer(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_from_balance NUMERIC;
  v_to_balance NUMERIC;
  v_transfer_id UUID;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be greater than 0');
  END IF;

  -- Check if users are different
  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Get current balances
  SELECT account_balance INTO v_from_balance
  FROM users WHERE id = p_from_user_id FOR UPDATE;
  
  IF v_from_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender not found');
  END IF;

  SELECT account_balance INTO v_to_balance
  FROM users WHERE id = p_to_user_id FOR UPDATE;
  
  IF v_to_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  -- Check if sender has enough balance
  IF v_from_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Update balances
  UPDATE users 
  SET account_balance = account_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_from_user_id;

  UPDATE users 
  SET account_balance = account_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_to_user_id;

  -- Record transfer
  INSERT INTO credit_transfers (from_user_id, to_user_id, amount)
  VALUES (p_from_user_id, p_to_user_id, p_amount)
  RETURNING id INTO v_transfer_id;

  RETURN json_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'from_balance', v_from_balance - p_amount,
    'to_balance', v_to_balance + p_amount
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
-- Drop existing function first if parameter name changed
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin(user_id UUID);

CREATE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 9: CREATE TRIGGERS
-- ============================================

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_positions_updated_at
  BEFORE UPDATE ON portfolio_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 10: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 11: CREATE RLS POLICIES
-- ============================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view public profiles" ON users;
CREATE POLICY "Users can view public profiles"
  ON users FOR SELECT
  USING (true); -- Allow authenticated users to view other users' public profiles

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own balance" ON users;
CREATE POLICY "Users can update own balance"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can update all users
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PORTFOLIO POSITIONS POLICIES
DROP POLICY IF EXISTS "Users can view own positions" ON portfolio_positions;
CREATE POLICY "Users can view own positions"
  ON portfolio_positions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own positions" ON portfolio_positions;
CREATE POLICY "Users can insert own positions"
  ON portfolio_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own positions" ON portfolio_positions;
CREATE POLICY "Users can update own positions"
  ON portfolio_positions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own positions" ON portfolio_positions;
CREATE POLICY "Users can delete own positions"
  ON portfolio_positions FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can view all positions
DROP POLICY IF EXISTS "Admins can view all positions" ON portfolio_positions;
CREATE POLICY "Admins can view all positions"
  ON portfolio_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can manage all positions
DROP POLICY IF EXISTS "Admins can manage all positions" ON portfolio_positions;
CREATE POLICY "Admins can manage all positions"
  ON portfolio_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin can insert transactions for any user
DROP POLICY IF EXISTS "Admins can insert all transactions" ON transactions;
CREATE POLICY "Admins can insert all transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- WATCHLIST POLICIES
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlist;
CREATE POLICY "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlist;
CREATE POLICY "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- CREDIT TRANSFERS POLICIES
DROP POLICY IF EXISTS "Users can view own transfers" ON credit_transfers;
CREATE POLICY "Users can view own transfers"
  ON credit_transfers FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

DROP POLICY IF EXISTS "Users can create transfers" ON credit_transfers;
CREATE POLICY "Users can create transfers"
  ON credit_transfers FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- STEP 12: GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.generate_unique_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_credit_transfer(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- ============================================
-- STEP 13: GENERATE UNIQUE IDs FOR EXISTING USERS
-- ============================================
-- This updates any existing users that don't have unique_user_id
DO $$
DECLARE
  user_record RECORD;
  new_unique_id TEXT;
BEGIN
  FOR user_record IN 
    SELECT id FROM users WHERE unique_user_id IS NULL
  LOOP
    -- Generate unique ID
    new_unique_id := generate_unique_user_id();
    
    -- Update user
    UPDATE users 
    SET unique_user_id = new_unique_id
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- ============================================
-- STEP 14: HOW TO MAKE A USER AN ADMIN
-- ============================================
-- After running this script, to make a user an admin, run:
-- UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is set up correctly:

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'portfolio_positions', 'transactions', 'watchlist', 'credit_transfers')
ORDER BY table_name;

-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'portfolio_positions', 'transactions', 'watchlist', 'credit_transfers');

-- Check functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'generate_unique_user_id', 'process_credit_transfer', 'is_admin');

-- Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- END OF SETUP
-- ============================================
-- Your database is now fully configured!
-- Next steps:
-- 1. Make a user an admin: UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
-- 2. Test signup to verify trigger works
-- 3. Test credit transfers
-- 4. Test admin functions

