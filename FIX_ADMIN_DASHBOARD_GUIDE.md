# Fix Admin Dashboard and RLS Infinite Recursion

## Issues Fixed

1. **RLS Infinite Recursion Error**: The RLS policies were causing infinite recursion because admin policies were querying the `users` table, which triggered the same policies again.

2. **Admin Dashboard Not Showing**: Admin users were seeing the same dashboard as clients.

3. **Admin Check Failing**: Admin checks were failing due to RLS blocking queries.

## Solutions Implemented

### 1. Fixed RLS Policies (SQL Fix Required)

Run `FIX_RLS_INFINITE_RECURSION.sql` in Supabase SQL Editor. This updates the admin RLS policies to use the `is_admin()` function (which is `SECURITY DEFINER` and bypasses RLS) instead of directly querying the `users` table.

### 2. Updated Admin Check Function

- `lib/admin.ts` now uses `tryCreateAdminClient()` to bypass RLS when checking admin status
- This prevents infinite recursion errors

### 3. Updated API Routes

All API routes now use admin client when available to bypass RLS:
- `/api/portfolio` - Uses admin client for user data and positions
- `/api/transactions` - Uses admin client for transaction queries
- `/api/notifications` - Uses admin client for user queries
- `/api/admin/clients` - Uses admin client to fetch all users
- `/api/admin/check` - Uses updated `isAdmin()` function

### 4. Admin Dashboard Improvements

- Admin dashboard now shows all users (clients and admins)
- Stats only count clients (not admins)
- Recent clients table shows client users
- Admin users are automatically redirected from `/dashboard` to `/admin`

### 5. Client Dashboard

- Client dashboard remains unchanged
- Shows "Trading is managed by administrators" notice
- No buy/sell buttons (trading is admin-only)

## Steps to Fix

1. **Run SQL Fix**:
   ```sql
   -- Run FIX_RLS_INFINITE_RECURSION.sql in Supabase SQL Editor
   ```

2. **Restart Dev Server**:
   ```bash
   npm run dev
   ```

3. **Verify Admin Status**:
   - Make sure your user has `role = 'admin'` in the `users` table
   - Run: `UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';`

4. **Test**:
   - Sign in as admin
   - Should be redirected to `/admin` dashboard
   - Should see all users in admin dashboard
   - Should not see infinite recursion errors in console

## Admin Dashboard Features

- **Total Clients**: Count of all client users
- **Total Balance**: Sum of all client account balances
- **Total Invested**: Sum of all client investments
- **Recent Clients**: Table showing recent client users
- **Quick Actions**: Links to manage clients and browse stocks

## Client Dashboard Features

- **My Portfolio**: View account balance and investments
- **Positions**: View current stock positions
- **Trade History**: View past transactions
- **Watchlist**: Manage watchlist
- **Market Movers**: View top gainers/losers

## Notes

- Admin users are automatically redirected from `/dashboard` to `/admin`
- All admin operations use admin client to bypass RLS
- RLS policies now use `is_admin()` function to prevent recursion
- Client dashboard shows notice that trading is admin-only

