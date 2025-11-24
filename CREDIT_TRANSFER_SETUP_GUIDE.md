# 💰 Credit Transfer System Setup Guide

## Overview

This guide will help you set up the new credit transfer system where:
- ✅ Users start with **$1500** (instead of $100000)
- ✅ Users can **search for other users** by name or ID
- ✅ Users can **view public profiles** of other users
- ✅ Users can **transfer credits** between accounts
- ✅ All transfers are **tracked in history**

---

## 📋 Step-by-Step Setup

### Step 1: Update Database Schema

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the **entire** SQL from `SUPABASE_CREDIT_TRANSFER_SETUP.sql`
3. Click **Run**

This will:
- ✅ Update the trigger to give new users **$1500** instead of $100000
- ✅ Create `credit_transfers` table for tracking transfers
- ✅ Create `process_credit_transfer` function (optional, for atomic transfers)
- ✅ Set up RLS policies for transfers
- ✅ Create indexes for performance

### Step 2: Update Existing Users (Optional)

If you want to update existing users' balances to $1500:

```sql
-- Update all existing users to $1500 (if you want)
UPDATE users 
SET account_balance = 1500 
WHERE account_balance = 100000;
```

**⚠️ WARNING:** This will change all existing users' balances. Only run if you want to reset everyone's balance.

### Step 3: Verify Setup

Run these queries to verify:

```sql
-- Check trigger function
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check credit_transfers table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'credit_transfers';

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'credit_transfers';
```

---

## 🎯 New Features

### 1. User Search
- **Location**: Navbar (when logged in) and `/users` page
- **How to use**: Type a user's name or ID to search
- **API**: `/api/users/search?q=searchterm`

### 2. Public User Profiles
- **URL**: `/users/[userId]`
- **Shows**: Name, email, trading level, total invested, member since
- **Privacy**: Exact balance hidden for other users (shows "Active" or "No Balance")

### 3. Credit Transfer
- **How to use**: 
  1. Go to any user's profile
  2. Click "Send Credits" button
  3. Enter amount and optional note
  4. Confirm transfer
- **API**: `/api/transfers` (POST for transfer, GET for history)

### 4. Transfer History
- **View**: Available via `/api/transfers` GET endpoint
- **Shows**: All transfers you sent or received

---

## 📊 Database Tables

### `credit_transfers` Table

```sql
CREATE TABLE credit_transfers (
  id UUID PRIMARY KEY,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Updated `users` Table

- `account_balance` default changed from `100000` to `1500`
- All new users will get $1500 on signup

---

## 🔐 Security Features

1. **RLS Policies**: Users can only view transfers they sent or received
2. **Balance Validation**: Checks sufficient balance before transfer
3. **Self-Transfer Prevention**: Cannot transfer to yourself
4. **Privacy**: Other users' exact balances are hidden

---

## 🧪 Testing

### Test User Search:
1. Sign in
2. Use search bar in navbar
3. Type a user's name or ID
4. Click on result to view profile

### Test Credit Transfer:
1. Find another user's profile
2. Click "Send Credits"
3. Enter amount (must be less than your balance)
4. Add optional note
5. Confirm transfer
6. Check your balance updated

### Test Transfer History:
1. Make a few transfers
2. Check transfer history (can be added to UI later)

---

## 📝 API Endpoints

### Search Users
```
GET /api/users/search?q=searchterm
Headers: Authorization: Bearer <token>
```

### Get User Profile
```
GET /api/users/[userId]
Headers: Authorization: Bearer <token>
```

### Transfer Credits
```
POST /api/transfers
Headers: Authorization: Bearer <token>
Body: { toUserId, amount, note? }
```

### Get Transfer History
```
GET /api/transfers
Headers: Authorization: Bearer <token>
```

---

## ⚠️ Important Notes

1. **Initial Balance**: All new users get **$1500** on signup
2. **Existing Users**: Keep their current balance (unless you update it)
3. **Transfer Limits**: No minimum/maximum set (can be added)
4. **Privacy**: Exact balances hidden from other users
5. **History**: All transfers are permanently recorded

---

## 🚀 What's New in the App

1. **Navbar**: User search bar (when logged in)
2. **Sidebar**: "Find Users" menu item
3. **New Page**: `/users` - Browse and search users
4. **New Page**: `/users/[userId]` - View user profiles
5. **New Component**: `UserSearch` - Search functionality
6. **New Component**: `TransferModal` - Send credits modal

---

## ✅ Checklist

- [ ] Run `SUPABASE_CREDIT_TRANSFER_SETUP.sql` in Supabase
- [ ] Test user search functionality
- [ ] Test viewing other user profiles
- [ ] Test credit transfer between accounts
- [ ] Verify new users get $1500 on signup
- [ ] Check transfer history is being recorded

---

## 🐛 Troubleshooting

### Issue: "Cannot find users"
**Fix**: Make sure RLS policies allow users to read from `users` table

### Issue: "Transfer failed"
**Fix**: 
- Check sender has sufficient balance
- Verify `credit_transfers` table exists
- Check RLS policies allow inserts

### Issue: "Search not working"
**Fix**: 
- Verify user is authenticated
- Check API route is accessible
- Check browser console for errors

---

## 📚 Files Created/Modified

### New Files:
- `SUPABASE_CREDIT_TRANSFER_SETUP.sql` - Database setup
- `app/api/users/search/route.ts` - User search API
- `app/api/users/[userId]/route.ts` - User profile API
- `app/api/transfers/route.ts` - Transfer API
- `app/users/page.tsx` - Users browse page
- `app/users/[userId]/page.tsx` - User profile page
- `components/UserSearch.tsx` - Search component
- `components/TransferModal.tsx` - Transfer modal

### Modified Files:
- `app/api/user/create/route.ts` - Changed balance to 1500
- `app/api/user/route.ts` - Changed balance to 1500
- `SUPABASE_DATABASE_TRIGGER.sql` - Changed balance to 1500
- `FIX_ALL_TABLES.sql` - Changed balance to 1500
- `components/Navbar.tsx` - Added user search
- `components/Sidebar.tsx` - Added "Find Users" link
- `middleware.ts` - Added /users to protected routes

---

Your credit transfer system is now ready! 🎉

