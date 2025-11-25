# Complete Database Setup Guide

## Quick Start

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Click "New Query"

2. **Run the Complete Setup Script**
   - Copy the entire contents of `COMPLETE_DATABASE_SETUP.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

3. **Verify Setup**
   - Check the verification queries at the end of the script
   - All should return expected results

## What This Script Includes

### ✅ Tables Created
- **users** - User profiles with admin/client roles
- **portfolio_positions** - Stock holdings
- **transactions** - Buy/sell transaction history
- **watchlist** - User watchlists
- **credit_transfers** - Credit transfer records

### ✅ Features
- **Admin/Client Role System** - Role-based access control
- **Unique User IDs** - Auto-generated USER123456 format
- **Credit Transfers** - Atomic transfer function
- **Transaction History** - Complete buy/sell records
- **Auto User Creation** - Trigger creates profile on signup
- **RLS Policies** - Row Level Security for all tables
- **Admin Access** - Admins can view/manage all client data

### ✅ Functions
- `generate_unique_user_id()` - Creates unique IDs
- `handle_new_user()` - Auto-creates user profile on signup
- `process_credit_transfer()` - Atomic credit transfer
- `is_admin()` - Check if user is admin
- `update_updated_at_column()` - Auto-updates timestamps

## Making a User an Admin

After running the setup script, make a user an admin:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## Default Values

- **Initial Balance**: $1,500 USD (for new users)
- **Default Role**: `client`
- **Default Trading Level**: `Beginner`

## Important Notes

⚠️ **WARNING**: The script includes `DROP TABLE` statements. If you have existing data:
- Comment out the DROP TABLE section (lines 12-16)
- Or backup your data first

## Testing

After setup, test these:

1. **User Signup** - Should auto-create profile with $1,500 balance
2. **Credit Transfer** - Should work between users
3. **Admin Access** - Admin should see all clients
4. **Transaction History** - Should record all trades

## Troubleshooting

### If signup fails:
- Check if trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check function: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

### If credit transfer fails:
- Check function exists: `SELECT * FROM pg_proc WHERE proname = 'process_credit_transfer';`
- Verify RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'users';`

### If admin can't see clients:
- Verify role: `SELECT id, email, role FROM users WHERE email = 'admin@example.com';`
- Check RLS policies for admin access

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify all tables exist
3. Check RLS policies are enabled
4. Ensure functions have proper permissions

