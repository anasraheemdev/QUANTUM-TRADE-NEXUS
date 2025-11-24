# 🔧 Balance Update Fix

## Problem
Account balance was not updating after credit transfers due to RLS (Row Level Security) policies blocking the UPDATE operations.

## Solution Applied

### 1. Use Admin Client for Balance Updates
Updated `app/api/transfers/route.ts` to use `createAdminClient()` instead of `createServerClient()` for balance updates. The admin client bypasses RLS policies.

**Key Changes:**
- ✅ Import `createAdminClient` from `@/lib/supabase`
- ✅ Use `adminSupabase` for all balance UPDATE operations
- ✅ Use `adminSupabase` for RPC function calls
- ✅ Use `adminSupabase` for recording transfers

### 2. Why This Works
- `createServerClient()` uses the anon key and respects RLS policies
- `createAdminClient()` uses the service role key and bypasses RLS
- Balance updates require bypassing RLS because users need to update other users' balances (when receiving credits)

## Files Modified

1. **`app/api/transfers/route.ts`**
   - Added `createAdminClient` import
   - Changed balance updates to use `adminSupabase`
   - Changed transfer recording to use `adminSupabase`

## Testing

1. **Send Credits:**
   - Go to another user's profile
   - Click "Send Credits"
   - Enter an amount
   - Submit

2. **Verify Balance Update:**
   - Check your profile page - balance should decrease
   - Check receiver's profile - balance should increase
   - Refresh the page if needed

3. **Check Notifications:**
   - Click the bell icon in Navbar
   - You should see the transfer notification

## If Balance Still Doesn't Update

1. **Check Browser Console:**
   - Look for error messages
   - Check network tab for API responses

2. **Verify Service Role Key:**
   - Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
   - This is required for admin operations

3. **Check Database:**
   - Go to Supabase Dashboard → Table Editor → `users`
   - Verify the balance was actually updated in the database
   - If it's updated in DB but not in UI, it's a refresh issue

4. **Manual Refresh:**
   - After transfer, manually refresh the page (F5)
   - The balance should update

## Environment Variables Required

Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  ← IMPORTANT!
```

The service role key is required for balance updates to work!

