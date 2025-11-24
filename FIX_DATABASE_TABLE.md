# 🔧 Fix Database Table Structure

## ❌ Error Found
```
invalid input syntax for type bigint: "71d3a281-861b-4802-b435-0f101592ccf4"
```

**Problem:** Your `users` table has `id` column as `bigint` instead of `UUID`.  
**Solution:** Change the column type to `UUID` to match Supabase Auth.

---

## ✅ Complete Fix (All Tables)

**⚠️ IMPORTANT:** All related tables (`portfolio_positions`, `transactions`, `watchlist`) also need to be fixed because they have `user_id` as `bigint` instead of `UUID`.

### Step 1: Go to Supabase Dashboard
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Run the Complete Fix Script

**Use the file `FIX_ALL_TABLES.sql`** - it fixes ALL tables at once:

1. Opens `FIX_ALL_TABLES.sql` in your project
2. Copy the entire SQL script
3. Paste into Supabase SQL Editor
4. Click **Run**

This script will:
- ✅ Fix `users` table (UUID id)
- ✅ Fix `portfolio_positions` table (UUID user_id)
- ✅ Fix `transactions` table (UUID user_id)
- ✅ Fix `watchlist` table (UUID user_id)
- ✅ Create all foreign keys correctly
- ✅ Set up RLS policies
- ✅ Create indexes for performance

**⚠️ WARNING:** This will DELETE all existing data in these tables. If you have important data, back it up first!

### Step 3: Verify Fix

Run this query to check:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'id';
```

**Expected Result:**
- `data_type`: `uuid` ✅
- `is_nullable`: `NO` ✅

### Step 4: Test Signup

1. Go back to your app
2. Try signing up again
3. Check browser console - should see: `✅ User profile created successfully`
4. Check Supabase Table Editor → `users` table - should see new user

---

## 🔍 How to Check Current Table Structure

1. Go to **Table Editor** → `users` table
2. Click on the table
3. Look at the `id` column
4. **Current (Wrong):** `bigint` or `int8` ❌
5. **Should Be:** `uuid` ✅

---

## 📝 Why This Happened

The `users` table was created with `id` as `bigint` (integer), but Supabase Auth uses `UUID` (string) for user IDs. They must match!

---

## ✅ After Fixing

1. ✅ Table structure is correct
2. ✅ Signup will work
3. ✅ User profiles will be created automatically
4. ✅ All foreign keys will work correctly

