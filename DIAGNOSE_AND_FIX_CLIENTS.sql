-- ============================================
-- QUICK FIX: Change one user from admin to client
-- ============================================
-- Run this FIRST to make one user a client for testing:
UPDATE users
SET role = 'client'
WHERE email = 'mubeenniaz2@gmail.com';

-- ============================================
-- STEP 1: Check ALL users in the database
-- ============================================
-- This will show you all users and their roles
SELECT 
  id,
  email,
  name,
  role,
  account_balance,
  unique_user_id,
  created_at,
  updated_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- STEP 2: Check users in auth.users (Supabase Auth)
-- ============================================
-- This shows users that signed up but might not have profiles
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Find users that should be clients
-- ============================================
-- If you see a user that should be a client but has role='admin', 
-- you can fix it with the queries below

-- Option A: Change a specific user from admin to client (replace email)
UPDATE users
SET role = 'client'
WHERE email = 'client@example.com';  -- Replace with actual client email

-- Option B: Change all non-admin users to client (if they have null/empty role)
UPDATE users
SET role = 'client'
WHERE role IS NULL 
   OR role = ''
   OR (role NOT IN ('admin', 'ADMIN', 'client', 'CLIENT'));

-- Option C: If a user exists in auth.users but NOT in public.users,
-- you need to create their profile. Use this to find them:
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN pu.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================
-- STEP 4: Create missing user profiles
-- ============================================
-- If you found users in auth.users without profiles, create them:
-- (Replace the UUID and email with actual values from Step 3)
/*
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
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'User'),
  1500,
  0,
  'Beginner',
  au.created_at,
  'USER' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0'),
  'client'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
  AND au.email = 'client@example.com';  -- Replace with actual email
*/

-- ============================================
-- STEP 5: Verify the fix
-- ============================================
-- After running the fixes, verify:
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Show all clients
SELECT 
  id,
  email,
  name,
  role,
  account_balance,
  unique_user_id
FROM users
WHERE role IS NULL 
   OR role = ''
   OR (role != 'admin' AND role != 'ADMIN')
ORDER BY created_at DESC;

