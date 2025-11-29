# Debug Notifications - Troubleshooting Guide

## ✅ What Has Been Fixed

### 1. **Added Comprehensive Logging**
   - All notification creation functions now log their execution
   - Trade execution logs when notification is created
   - Balance modification logs when notification is created
   - Profile update logs when notification is created
   - Certification update logs when notification is created

### 2. **Fixed Notification API**
   - Fixed bug where admin notifications weren't being combined correctly
   - Now properly combines transfer notifications and admin notifications
   - Added detailed logging to track notification fetching

### 3. **Enhanced Error Handling**
   - All notification functions wrapped in try-catch
   - Errors are logged but don't fail the operation
   - Better error messages in console

## 🔍 How to Debug

### Step 1: Check Browser Console
When you perform an operation (trade, balance modification, etc.), check the browser console for:
- `🔔 Creating trade execution notification:` - Shows notification is being created
- `✅ Notification created successfully:` - Shows notification was saved
- `❌ Error creating notification:` - Shows if there was an error

### Step 2: Check Server Logs
Check your terminal/console where the Next.js server is running for:
- `🔔 Attempting to create trade notification for client:`
- `🔔 Trade notification creation result:`
- `📊 Notification summary:` - Shows how many notifications were fetched

### Step 3: Check Database
Run this SQL in Supabase to see if notifications are being created:
```sql
SELECT * FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 4: Check API Response
Open browser DevTools → Network tab → Filter by "notifications"
- Click on the request to `/api/notifications`
- Check the Response tab to see what notifications are returned
- Look for the `notifications` array and `unreadCount`

## 🐛 Common Issues

### Issue 1: Notifications Table Doesn't Exist
**Symptom:** Console shows "Notifications table may not exist"
**Fix:** Run `ADMIN_OPERATIONS_SETUP.sql` in Supabase SQL Editor

### Issue 2: Admin Client Not Available
**Symptom:** Console shows "Admin client not available, notification not created"
**Fix:** Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`

### Issue 3: Notifications Created But Not Showing
**Symptom:** Notifications exist in database but don't appear in UI
**Fix:** 
- Check browser console for API errors
- Verify notifications are being fetched (check Network tab)
- Check that notification IDs are unique
- Clear browser cache and refresh

### Issue 4: Only Manual Notifications Work
**Symptom:** Direct admin notifications work, but automatic ones don't
**Fix:**
- Check server console for notification creation logs
- Verify notification functions are being called
- Check that `user.id` is being passed correctly as `adminId`

## 📋 Testing Checklist

1. ✅ Execute a trade → Check console for `🔔 Creating trade execution notification`
2. ✅ Modify balance → Check console for `🔔 Creating balance modification notification`
3. ✅ Update profile → Check console for `🔔 Attempting to create profile update notification`
4. ✅ Update certification → Check console for `🔔 Attempting to create certification notification`
5. ✅ Check database → Verify notifications exist in `notifications` table
6. ✅ Check API → Verify `/api/notifications` returns the notifications
7. ✅ Check UI → Verify notifications appear in bell dropdown

## 🔧 Files Modified

- `lib/notifications.ts` - Added comprehensive logging
- `app/api/admin/trade/route.ts` - Added logging for trade notifications
- `components/AdminOperationsModal.tsx` - Added logging for all operations
- `app/api/notifications/route.ts` - Fixed notification combining bug, added logging

## 🚀 Next Steps

1. Perform a trade operation
2. Check browser console for notification logs
3. Check server console for notification logs
4. Check database to verify notifications were created
5. Check bell dropdown to see if notifications appear

If notifications still don't appear, the logs will help identify where the issue is occurring.

