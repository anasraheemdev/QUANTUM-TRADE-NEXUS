-- Fix RLS infinite recursion by using is_admin() function instead of direct queries
-- This function is SECURITY DEFINER and bypasses RLS

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all positions" ON portfolio_positions;
DROP POLICY IF EXISTS "Admins can manage all positions" ON portfolio_positions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;

-- Recreate admin policies using is_admin() function (SECURITY DEFINER, bypasses RLS)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin can update all users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admin can view all positions
CREATE POLICY "Admins can view all positions"
  ON portfolio_positions FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin can manage all positions
CREATE POLICY "Admins can manage all positions"
  ON portfolio_positions FOR ALL
  USING (is_admin(auth.uid()));

-- Admin can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin(auth.uid()));

-- Admin can manage all transactions
CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  USING (is_admin(auth.uid()));

