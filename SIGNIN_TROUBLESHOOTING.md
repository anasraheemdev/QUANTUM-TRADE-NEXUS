# Sign-In Troubleshooting Guide

## ✅ Important: Passwords Are NOT in the `users` Table

**Passwords are stored in `auth.users` (managed by Supabase Auth), NOT in the `public.users` table.**

The `public.users` table only stores:
- Profile information (name, email, avatar)
- Trading data (account_balance, total_invested, trading_level)
- **NO passwords** - these are handled by Supabase Auth

## Common Sign-In Issues

### Issue 1: Email Confirmation Required

If email confirmation is enabled in Supabase, users must confirm their email before they can sign in.

**Check Email Confirmation Settings:**
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Look for **"Enable email confirmations"**
3. If enabled, users need to click the confirmation link in their email

**Solution Options:**

**Option A: Disable Email Confirmation (For Development)**
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Turn OFF **"Enable email confirmations"**
3. Users can sign in immediately after signup

**Option B: Keep Email Confirmation (For Production)**
- Users must check their email and click the confirmation link
- After confirmation, they can sign in normally

### Issue 2: Check Browser Console for Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to sign in
4. Look for error messages

Common errors:
- `"Email not confirmed"` → User needs to confirm email
- `"Invalid login credentials"` → Wrong email/password
- `"User not found"` → User doesn't exist in auth.users

### Issue 3: Verify User Exists in auth.users

Run this query in Supabase SQL Editor:

```sql
SELECT id, email, confirmed_at, created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

**Check:**
- ✅ `confirmed_at` should NOT be NULL (if email confirmation is enabled)
- ✅ User should exist in the table

### Issue 4: Check Sign-In Flow

The sign-in process:
1. User enters email/password
2. Supabase Auth verifies credentials in `auth.users`
3. If valid, creates a session
4. Session is stored in browser
5. User is redirected to dashboard

**If sign-in fails:**
- Check browser console for errors
- Check Network tab for failed API calls
- Verify email/password are correct

## Testing Sign-In

1. **Sign Up a New User:**
   - Go to `/signup`
   - Fill in form and submit
   - Check email for confirmation link (if enabled)

2. **Confirm Email (if required):**
   - Click confirmation link in email
   - Should redirect to dashboard

3. **Sign In:**
   - Go to `/signin`
   - Enter email and password
   - Should redirect to dashboard

## Quick Fix: Disable Email Confirmation

For development/testing, you can disable email confirmation:

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. Turn it **OFF**
4. Save changes
5. Try signing in again

**Note:** For production, keep email confirmation enabled for security.

## Verify Sign-In is Working

After signing in, check:
1. ✅ Browser console shows no errors
2. ✅ User is redirected to `/dashboard`
3. ✅ Navbar shows user email/name
4. ✅ Sidebar shows user information
5. ✅ Can access protected routes

## Still Not Working?

1. **Check Supabase Logs:**
   - Go to **Supabase Dashboard** → **Logs**
   - Look for authentication errors

2. **Check Environment Variables:**
   - Verify `.env.local` has correct Supabase keys
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Clear Browser Storage:**
   - Open DevTools → Application → Storage
   - Clear Local Storage and Session Storage
   - Try signing in again

4. **Check Middleware:**
   - Verify `middleware.ts` is not blocking sign-in
   - Check for redirect loops

