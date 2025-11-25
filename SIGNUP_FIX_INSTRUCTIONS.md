# Fix Signup Error: "Database error saving new user"

## Problem
The database trigger `handle_new_user()` is failing because it doesn't include the `unique_user_id` field when creating user profiles.

## Solution Options

### Option 1: Fix the Trigger (Recommended)
Run the SQL script `FIX_SIGNUP_TRIGGER.sql` in Supabase SQL Editor. This will:
- Create/update the `generate_unique_user_id()` function
- Update `handle_new_user()` to include `unique_user_id`
- Add proper error handling

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Open `FIX_SIGNUP_TRIGGER.sql`
3. Copy and paste the entire script
4. Click "Run"
5. Try signing up again

### Option 2: Disable Trigger and Use API Route
If the trigger continues to cause issues, disable it and let the API route handle user creation:

**SQL to disable trigger:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

The API route (`/api/user/create`) will automatically create user profiles when users sign up.

## What I've Fixed in the Code

1. **Updated `contexts/AuthContext.tsx`:**
   - Now calls `/api/user/create` immediately after successful signup
   - This ensures user profiles are created even if the trigger fails
   - Added better error handling

2. **Created `FIX_SIGNUP_TRIGGER.sql`:**
   - Complete SQL script to fix the trigger
   - Includes `unique_user_id` generation
   - Has error handling to prevent signup failures

## Testing

After applying the fix:
1. Try signing up with a new email
2. Check the browser console for success messages
3. Verify the user was created in Supabase:
   ```sql
   SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
   ```

## If Issues Persist

1. Check Supabase Logs:
   - Dashboard → Logs → Postgres Logs
   - Look for errors related to `handle_new_user`

2. Verify table structure:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'users'
   ORDER BY ordinal_position;
   ```

3. Check if functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('handle_new_user', 'generate_unique_user_id');
   ```

