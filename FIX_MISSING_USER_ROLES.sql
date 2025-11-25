-- Fix missing user roles: Set all users without a role to 'client'
-- This ensures all existing users have a role set

-- First, show all current users and their roles
SELECT 
  id,
  email,
  name,
  role,
  account_balance,
  unique_user_id,
  created_at
FROM users
ORDER BY created_at DESC;

-- Update all users that don't have a role set (null, empty string, etc.) to 'client'
-- IMPORTANT: Only update users that are NOT explicitly set as 'admin'
UPDATE users
SET role = 'client'
WHERE role IS NULL 
   OR role = ''
   OR (role NOT IN ('admin', 'ADMIN', 'client', 'CLIENT'));

-- If you need to change a specific user from admin to client, use this:
-- UPDATE users
-- SET role = 'client'
-- WHERE email = 'user@example.com';  -- Replace with actual client email

-- Verify the update - show role distribution
SELECT 
  role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Show all users that should be clients (for verification)
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

-- Show ALL users (including admins) for complete overview
SELECT 
  id,
  email,
  name,
  role,
  account_balance,
  unique_user_id,
  created_at
FROM users
ORDER BY created_at DESC;

