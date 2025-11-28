-- ============================================
-- FIX RLS INFINITE RECURSION - FINAL FIX
-- ============================================
-- This fixes the infinite recursion by using the is_admin() function
-- which is SECURITY DEFINER and bypasses RLS

-- Step 1: Ensure is_admin() function exists and is SECURITY DEFINER
DROP FUNCTION IF EXISTS is_admin(UUID);
DROP FUNCTION IF EXISTS is_admin(user_id UUID);
DROP FUNCTION IF EXISTS is_admin(p_user_id UUID);

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER allows this function to bypass RLS
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop all existing admin policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all positions" ON portfolio_positions;
DROP POLICY IF EXISTS "Admins can manage all positions" ON portfolio_positions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;

-- Step 3: Recreate admin policies using is_admin() function
-- This function is SECURITY DEFINER, so it bypasses RLS and prevents recursion

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view all positions"
  ON portfolio_positions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all positions"
  ON portfolio_positions FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Step 4: Grant execute permission on is_admin function
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO anon;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that the function exists and is SECURITY DEFINER
SELECT 
  proname, 
  prosecdef as is_security_definer,
  proargtypes::regtype[] as argument_types
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check RLS policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'portfolio_positions', 'transactions')
ORDER BY tablename, policyname;

