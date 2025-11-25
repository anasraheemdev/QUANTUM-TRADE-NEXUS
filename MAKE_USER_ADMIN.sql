-- ============================================
-- HOW TO MAKE A USER AN ADMIN
-- ============================================
-- Run this in Supabase SQL Editor

-- Method 1: Update by Email (Recommended)
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Method 2: Update by User ID (UUID)
-- First, find the user ID:
-- SELECT id, email, name FROM users WHERE email = 'your-email@example.com';
-- Then use the ID:
-- UPDATE users SET role = 'admin' WHERE id = 'user-uuid-here';

-- Method 3: Update Multiple Users
-- UPDATE users 
-- SET role = 'admin' 
-- WHERE email IN ('admin1@example.com', 'admin2@example.com');

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if the user is now an admin:
SELECT id, email, name, role, account_balance, unique_user_id
FROM users 
WHERE email = 'your-email@example.com';

-- List all admins:
SELECT id, email, name, role, account_balance, unique_user_id, member_since
FROM users 
WHERE role = 'admin'
ORDER BY member_since DESC;

-- ============================================
-- REMOVE ADMIN ROLE (if needed)
-- ============================================
-- To remove admin role and make user a client again:
-- UPDATE users 
-- SET role = 'client' 
-- WHERE email = 'your-email@example.com';

