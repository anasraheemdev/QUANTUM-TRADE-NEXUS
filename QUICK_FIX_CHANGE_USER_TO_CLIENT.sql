-- ============================================
-- QUICK FIX: Change a user from admin to client
-- ============================================
-- This will change the user "mubeenniaz2@gmail.com" from admin to client
-- You can test with this user, or change the email to another user

UPDATE users
SET role = 'client'
WHERE email = 'mubeenniaz2@gmail.com';

-- Verify the change
SELECT 
  id,
  email,
  name,
  role,
  account_balance,
  unique_user_id
FROM users
WHERE email = 'mubeenniaz2@gmail.com';

-- ============================================
-- Check if there are users in auth.users without profiles
-- ============================================
-- This will show users that signed up but don't have profiles in public.users
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN pu.id IS NULL THEN '❌ MISSING PROFILE' ELSE '✅ HAS PROFILE' END as profile_status,
  pu.role as current_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- ============================================
-- Create profiles for users missing from public.users
-- ============================================
-- This will create profiles for any users in auth.users that don't have profiles
-- They will be created with role='client' by default
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
  'client'  -- All new profiles will be clients
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Final verification: Show all users and their roles
-- ============================================
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
  unique_user_id,
  created_at
FROM users
WHERE role IS NULL 
   OR role = ''
   OR (role != 'admin' AND role != 'ADMIN')
ORDER BY created_at DESC;

