# Troubleshooting Signup Issues

## Quick Fix Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to sign up
4. Look for error messages
5. Check Network tab for failed API calls

### Step 2: Verify Database Table Exists
1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Check if `users` table exists
4. If not, create it using the SQL from `SUPABASE_SETUP.md`

### Step 3: Check Table Structure
The `users` table MUST have:
- `id` (UUID, PRIMARY KEY, references auth.users(id))
- `email` (TEXT, UNIQUE, NOT NULL)
- `name` (TEXT)
- `account_balance` (NUMERIC, default 100000)
- `total_invested` (NUMERIC, default 0)
- `trading_level` (TEXT, default 'Beginner')
- `member_since` (TIMESTAMP, default NOW())

### Step 4: Install Database Trigger (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL from `SUPABASE_DATABASE_TRIGGER.sql`
3. Click "Run"
4. This will automatically create user profiles on signup

### Step 5: Check RLS Policies
1. Go to Supabase Dashboard → Authentication → Policies
2. Make sure `users` table has policies that allow inserts
3. Or use the database trigger (bypasses RLS)

### Step 6: Check Email Confirmation Settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Check "Enable email confirmations"
3. If enabled, users need to confirm email before profile is created
4. The trigger will create profile even if email isn't confirmed

## Common Errors

### Error: "relation 'users' does not exist"
**Fix:** Create the `users` table using SQL from `SUPABASE_SETUP.md`

### Error: "new row violates row-level security policy"
**Fix:** 
- Install the database trigger (bypasses RLS)
- Or update RLS policies to allow inserts

### Error: "duplicate key value violates unique constraint"
**Fix:** User already exists - this is OK, profile creation is idempotent

### Error: "foreign key constraint fails"
**Fix:** Make sure `users.id` references `auth.users(id)` correctly

## Testing

1. **Sign Up:**
   - Go to `/signup`
   - Fill form and submit
   - Check browser console for messages

2. **Check Supabase:**
   - Go to Table Editor → `users`
   - Should see new user

3. **Check Logs:**
   - Supabase Dashboard → Logs
   - Look for errors during signup

## Current Implementation

The app tries to create user profile in this order:
1. **Database Trigger** (if installed) - Most reliable
2. **API Route** (`/api/user/create`) - Uses admin client, bypasses RLS
3. **Auth State Handler** - Creates on SIGNED_UP event
4. **Fallback on First Login** - Creates when user first accesses profile

## Still Not Working?

1. Check browser console for specific error messages
2. Check Supabase logs for database errors
3. Verify environment variables are set correctly
4. Make sure `users` table structure matches exactly
5. Try installing the database trigger

