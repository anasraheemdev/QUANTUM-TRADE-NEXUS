-- ============================================
-- FIX ALL TABLES: Change bigint to UUID
-- ============================================
-- This script fixes all tables that reference users.id
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing foreign key constraints
ALTER TABLE IF EXISTS portfolio_positions 
  DROP CONSTRAINT IF EXISTS portfolio_positions_user_id_fkey;

ALTER TABLE IF EXISTS transactions 
  DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;

ALTER TABLE IF EXISTS watchlist 
  DROP CONSTRAINT IF EXISTS watchlist_user_id_fkey;

-- Step 2: Fix users table (if not already fixed)
-- Drop and recreate users table with UUID
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  account_balance NUMERIC DEFAULT 100000,
  total_invested NUMERIC DEFAULT 0,
  member_since TIMESTAMP DEFAULT NOW(),
  trading_level TEXT DEFAULT 'Beginner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Fix portfolio_positions table
-- Drop and recreate with UUID user_id
DROP TABLE IF EXISTS portfolio_positions CASCADE;

CREATE TABLE portfolio_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  average_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Step 4: Fix transactions table
-- Drop and recreate with UUID user_id
DROP TABLE IF EXISTS transactions CASCADE;

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Fix watchlist table
-- Drop and recreate with UUID user_id
DROP TABLE IF EXISTS watchlist CASCADE;

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_user_id ON portfolio_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_symbol ON portfolio_positions(symbol);

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS Policies for users table
-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Step 9: Create RLS Policies for portfolio_positions
CREATE POLICY "Users can view own positions"
  ON portfolio_positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON portfolio_positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions"
  ON portfolio_positions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own positions"
  ON portfolio_positions FOR DELETE
  USING (auth.uid() = user_id);

-- Step 10: Create RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 11: Create RLS Policies for watchlist
CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Step 12: Create Database Trigger for Automatic User Profile Creation
-- This trigger automatically creates a user profile when a user signs up
-- It runs AFTER the user is created in auth.users, so the foreign key constraint is satisfied

-- Function to create user profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, account_balance, total_invested, trading_level, member_since)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    1500,
    0,
    'Beginner',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is correct:

-- Check users table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
-- Expected: data_type = 'uuid'

-- Check portfolio_positions table
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'portfolio_positions' AND column_name = 'user_id';
-- Expected: data_type = 'uuid'

-- Check transactions table
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'user_id';
-- Expected: data_type = 'uuid'

-- Check watchlist table
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'watchlist' AND column_name = 'user_id';
-- Expected: data_type = 'uuid'

