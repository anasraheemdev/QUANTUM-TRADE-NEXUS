-- ============================================
-- FIX RLS POLICIES FOR CREDIT TRANSFERS
-- ============================================
-- This script fixes RLS policies to allow balance updates
-- Run this in Supabase SQL Editor

-- Step 1: Allow users to update their own account_balance
DROP POLICY IF EXISTS "Users can update own balance" ON users;
CREATE POLICY "Users can update own balance"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 2: Allow system to update balances for credit transfers
-- This allows the process_credit_transfer function to work
-- Note: The function uses SECURITY DEFINER, but this policy helps for direct updates
DROP POLICY IF EXISTS "System can update balances for transfers" ON users;
CREATE POLICY "System can update balances for transfers"
  ON users FOR UPDATE
  USING (true)  -- Allow updates for credit transfers
  WITH CHECK (true);

-- Step 3: Verify the process_credit_transfer function exists
-- If it doesn't exist, you need to run the full SUPABASE_CREDIT_TRANSFER_SETUP.sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'process_credit_transfer';

-- Step 4: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.process_credit_transfer TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check RLS policies on users table
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

