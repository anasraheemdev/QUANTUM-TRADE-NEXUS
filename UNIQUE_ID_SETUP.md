# 🆔 Unique User ID System Setup

## Overview

Each user now has a **unique, shareable ID** (like `USER123456`) that:
- ✅ Shows on their profile
- ✅ Can be used to search for users
- ✅ Can be used to transfer credits
- ✅ Is easy to share and remember

---

## 📋 Setup Instructions

### Step 1: Run SQL Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `SUPABASE_CREDIT_TRANSFER_SETUP.sql`
3. **IMPORTANT**: The script now includes:
   - Adding `unique_user_id` column to `users` table
   - Generating unique IDs for existing users
   - Updating the trigger to generate IDs for new users
4. Copy and paste the **entire** SQL script
5. Click **Run**

### Step 2: Verify Setup

Run this query to check:

```sql
-- Check if unique_user_id column exists
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'unique_user_id';

-- Check if users have unique IDs
SELECT id, name, unique_user_id 
FROM users 
LIMIT 10;
```

---

## 🎯 How It Works

### Unique ID Format
- Format: `USER` + 6-digit number (e.g., `USER123456`)
- Unique: Each user gets a different number
- Shareable: Easy to copy and share

### Where It's Used

1. **User Profiles** (`/users/[userId]` and `/profile`)
   - Shows the unique ID prominently
   - Copy button to share the ID
   - Can access profile using UUID or unique ID

2. **User Search**
   - Search by name (partial match)
   - Search by unique ID (exact or partial)
   - Search by UUID (if you have it)

3. **Credit Transfers**
   - Can transfer using UUID or unique ID
   - Just enter the unique ID in the transfer form
   - System finds the user automatically

---

## 🔍 Search Functionality

### How to Search:

1. **By Name**: Type part of the user's name
   - Example: "John" finds "John Doe", "Johnny", etc.

2. **By Unique ID**: Type the unique ID
   - Example: "USER123456" or just "123456"
   - Case-insensitive

3. **By UUID**: Type the full UUID
   - Example: "735d755e-7370-45b2-a36e-b643da2ebbe2"

### Where to Search:

- **Navbar**: Search bar appears when logged in
- **Users Page**: `/users` - Browse and search all users
- **Direct URL**: `/users/USER123456` or `/users/[uuid]`

---

## 💰 Transfer Credits Using Unique ID

### Method 1: Via User Profile
1. Search for a user
2. Click on their profile
3. Click "Send Credits"
4. Enter amount and send

### Method 2: Via API (for future features)
```javascript
POST /api/transfers
{
  "toUniqueId": "USER123456",
  "amount": 100,
  "note": "Thanks!"
}
```

---

## 📱 User Interface

### Profile Page
- Shows your unique ID prominently
- Copy button to share your ID
- Message: "Share this ID with others so they can send you credits!"

### Other User's Profile
- Shows their unique ID
- "Send Credits" button
- Can copy their ID to share

### Search Results
- Shows unique ID in search results
- Click to view full profile

---

## 🔧 Technical Details

### Database Schema
```sql
ALTER TABLE users ADD COLUMN unique_user_id TEXT UNIQUE;
```

### ID Generation
- Generated automatically on user creation
- Format: `USER` + random 6-digit number
- Ensured to be unique (checks for conflicts)

### API Support
- `/api/users/search` - Searches by name, unique_id, or UUID
- `/api/users/[userId]` - Accepts UUID or unique_id
- `/api/transfers` - Accepts `toUserId` (UUID) or `toUniqueId`

---

## ✅ Testing Checklist

- [ ] Run SQL script in Supabase
- [ ] Check existing users have unique IDs
- [ ] Sign up new user - should get unique ID
- [ ] Search by name - should find users
- [ ] Search by unique ID - should find user
- [ ] View profile - should show unique ID
- [ ] Copy unique ID - should copy to clipboard
- [ ] Transfer using unique ID - should work
- [ ] Access profile via `/users/USER123456` - should work

---

## 🐛 Troubleshooting

### Issue: "unique_user_id column doesn't exist"
**Fix**: Run the SQL script from `SUPABASE_CREDIT_TRANSFER_SETUP.sql`

### Issue: "Search not finding users"
**Fix**: 
- Check RLS policies allow reading users table
- Verify users have `unique_user_id` set
- Check browser console for API errors

### Issue: "Transfer fails with unique ID"
**Fix**: 
- Verify the unique ID exists in database
- Check the ID is in uppercase format
- Verify RLS policies allow transfers

---

## 📝 Notes

- Unique IDs are **case-insensitive** (USER123 = user123)
- Existing users will get IDs when you run the SQL script
- New users automatically get IDs on signup
- IDs are permanent and cannot be changed (for security)

---

Your unique ID system is ready! Users can now easily share their IDs and transfer credits! 🎉

