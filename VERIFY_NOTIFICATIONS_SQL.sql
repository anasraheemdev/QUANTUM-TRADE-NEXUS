-- ============================================
-- VERIFY NOTIFICATIONS - SQL QUERIES
-- ============================================
-- Run these queries in Supabase SQL Editor to verify notifications

-- 1. Check if notifications table exists
SELECT 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'notifications';

-- 2. Count total notifications
SELECT COUNT(*) as total_notifications FROM notifications;

-- 3. View all notifications (last 20)
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  from_admin,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check notifications for a specific user (replace USER_ID)
SELECT 
  id,
  title,
  message,
  type,
  from_admin,
  read,
  created_at
FROM notifications
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC;

-- 5. Count unread notifications per user
SELECT 
  user_id,
  COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY user_id;

-- 6. Check recent trade notifications
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  created_at
FROM notifications
WHERE title LIKE '%Trade Executed%'
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check recent balance modification notifications
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  created_at
FROM notifications
WHERE title LIKE '%Balance Updated%'
ORDER BY created_at DESC
LIMIT 10;

-- 8. Verify notification structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- 9. Test: Create a test notification (replace USER_ID)
-- INSERT INTO notifications (user_id, title, message, type, from_admin, read)
-- VALUES (
--   'USER_ID_HERE',
--   'Test Notification',
--   'This is a test notification to verify the system is working',
--   'info',
--   false,
--   false
-- );

-- 10. Check notification RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications';

