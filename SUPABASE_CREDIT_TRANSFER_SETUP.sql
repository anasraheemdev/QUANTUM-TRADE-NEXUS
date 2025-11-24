-- ============================================
-- CREDIT TRANSFER SYSTEM SETUP
-- ============================================
-- This script sets up the credit transfer system
-- Run this in Supabase SQL Editor

-- Step 1: Function to generate unique user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 6-digit number
    new_id := 'USER' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM users WHERE unique_user_id = new_id) INTO exists_check;
    
    -- If it doesn't exist, we're done
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Update initial account balance to $1500
-- Update the trigger function to use $1500 instead of $100000 and generate unique ID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_unique_id TEXT;
BEGIN
  -- Generate unique user ID
  v_unique_id := public.generate_unique_user_id();
  
  INSERT INTO public.users (id, email, name, account_balance, total_invested, trading_level, member_since, unique_user_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    1500,  -- Changed from 100000 to 1500
    0,
    'Beginner',
    NOW(),
    v_unique_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, users.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Add unique_user_id column to users table (if not exists)
-- This will be a short, shareable ID like "USER123" or similar
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'unique_user_id'
  ) THEN
    ALTER TABLE users ADD COLUMN unique_user_id TEXT UNIQUE;
    
    -- Generate unique IDs for existing users using a CTE
    WITH numbered_users AS (
      SELECT 
        id,
        'USER' || LPAD(ROW_NUMBER() OVER (ORDER BY COALESCE(created_at, member_since, NOW()))::TEXT, 6, '0') AS new_unique_id
      FROM users
      WHERE unique_user_id IS NULL
    )
    UPDATE users u
    SET unique_user_id = nu.new_unique_id
    FROM numbered_users nu
    WHERE u.id = nu.id;
    
    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_users_unique_user_id ON users(unique_user_id);
  END IF;
END $$;

-- Step 3: Create credit_transfers table
CREATE TABLE IF NOT EXISTS credit_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transfers_from_user ON credit_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_to_user ON credit_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_created_at ON credit_transfers(created_at DESC);

-- Step 4: Enable RLS on credit_transfers
ALTER TABLE credit_transfers ENABLE ROW LEVEL SECURITY;

-- Step 4.5: Add RLS policies for users table
-- Allow users to view public profiles (for search)
DROP POLICY IF EXISTS "Users can view public profiles" ON users;
CREATE POLICY "Users can view public profiles"
  ON users FOR SELECT
  USING (true);  -- Allow all authenticated users to view public user data

-- Allow users to update their own account_balance (for transfers)
DROP POLICY IF EXISTS "Users can update own balance" ON users;
CREATE POLICY "Users can update own balance"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also allow updating other users' balances (for receiving transfers)
-- This is needed when someone sends you credits
DROP POLICY IF EXISTS "Users can receive credits" ON users;
CREATE POLICY "Users can receive credits"
  ON users FOR UPDATE
  USING (true)  -- Allow updates for credit transfers
  WITH CHECK (true);

-- Step 5: Drop existing policies if they exist, then create RLS Policies for credit_transfers
DROP POLICY IF EXISTS "Users can view own transfers" ON credit_transfers;
DROP POLICY IF EXISTS "Users can create transfers" ON credit_transfers;

-- Users can view transfers they sent or received
CREATE POLICY "Users can view own transfers"
  ON credit_transfers FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create transfers (only from their own account)
CREATE POLICY "Users can create transfers"
  ON credit_transfers FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Step 6: Create function to process credit transfer
-- This ensures atomicity and prevents negative balances
CREATE OR REPLACE FUNCTION public.process_credit_transfer(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_amount NUMERIC,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_from_balance NUMERIC;
  v_transfer_id UUID;
BEGIN
  -- Check if users exist and are different
  IF p_from_user_id = p_to_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Get sender's current balance
  SELECT account_balance INTO v_from_balance
  FROM users
  WHERE id = p_from_user_id;

  IF v_from_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender not found');
  END IF;

  -- Check if receiver exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_to_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Receiver not found');
  END IF;

  -- Check if sender has enough balance
  IF v_from_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Perform the transfer atomically
  BEGIN
    -- Deduct from sender
    UPDATE users
    SET account_balance = account_balance - p_amount
    WHERE id = p_from_user_id;

    -- Add to receiver
    UPDATE users
    SET account_balance = account_balance + p_amount
    WHERE id = p_to_user_id;

    -- Record the transfer
    INSERT INTO credit_transfers (from_user_id, to_user_id, amount, note, status)
    VALUES (p_from_user_id, p_to_user_id, p_amount, p_note, 'completed')
    RETURNING id INTO v_transfer_id;

    RETURN json_build_object(
      'success', true,
      'transfer_id', v_transfer_id,
      'new_balance', v_from_balance - p_amount
    );
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Update default account_balance in users table
ALTER TABLE users ALTER COLUMN account_balance SET DEFAULT 1500;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that everything is set up correctly:

-- Verify trigger function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Verify credit_transfers table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'credit_transfers';

-- Verify transfer function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'process_credit_transfer';

