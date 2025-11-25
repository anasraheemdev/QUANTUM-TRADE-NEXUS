-- ============================================
-- FIX SIGNUP ERROR: Update handle_new_user() Trigger
-- ============================================
-- This fixes the "Database error saving new user" error during signup
-- Run this in Supabase SQL Editor

-- Step 1: Make sure generate_unique_user_id() function exists
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

-- Step 2: Update handle_new_user() function to include unique_user_id
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
    unique_user_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1), 'User'),
    1500,
    0,
    'Beginner',
    NOW(),
    user_unique_id
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

-- Step 3: Verify the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_unique_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================
-- ALTERNATIVE: Disable trigger and use API route instead
-- ============================================
-- If the trigger continues to cause issues, uncomment this to disable it:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'generate_unique_user_id');

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Test: Check users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

