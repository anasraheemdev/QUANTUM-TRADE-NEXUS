# Admin System Implementation Guide

## Overview
This document describes the dual-portal system (Client Portal and Admin Portal) that has been implemented.

## What Has Been Implemented

### 1. Database Setup
- **File**: `ADMIN_SYSTEM_SETUP.sql`
- Added `role` column to `users` table (admin/client)
- Created `is_admin()` function
- Updated RLS policies to allow admins to view/manage all clients
- Run this SQL script in Supabase SQL Editor

### 2. Admin Utilities
- **File**: `lib/admin.ts`
- `isAdmin()` - Check if user is admin (server-side)
- `getAdminUserId()` - Get admin user ID from request

### 3. API Routes
- **`/api/admin/check`** - Check if current user is admin
- **`/api/admin/clients`** - Get all clients (admin only)
- **`/api/admin/clients/[clientId]`** - Get/Update specific client
- **`/api/admin/trade`** - Execute trades on behalf of clients

### 4. Admin Pages
- **`/admin`** - Admin dashboard with stats
- **`/admin/clients`** - Client management list
- **`/admin/clients/[clientId]`** - Individual client management (needs to be created)

### 5. Navigation Updates
- **File**: `components/Sidebar.tsx`
- Added admin menu items (Admin Portal, Client Management)
- Admin items only visible to users with admin role

## Remaining Files to Create

### 1. Client Detail Page
**File**: `app/admin/clients/[clientId]/page.tsx`

This page should:
- Display client details (balance, portfolio, transactions)
- Allow admin to trade on behalf of client (buy/sell stocks)
- Allow admin to update client profile
- Show client's portfolio positions
- Show transaction history

### 2. Admin Trading Component
**File**: `components/AdminTradeModal.tsx`

A modal component for admins to:
- Select stock symbol
- Choose buy/sell
- Enter quantity
- Execute trade on behalf of client

## How to Make a User an Admin

Run this SQL in Supabase:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Client Portal Features

Clients can:
- View their dashboard
- Edit their profile
- View balance and portfolio
- Search for other users
- Transfer credits
- View notifications

## Admin Portal Features

Admins can:
- View all clients
- Manage client accounts
- Trade on behalf of clients (buy/sell stocks)
- Update client balances
- View all transactions
- Access client portfolios

## Security

- All admin routes check for admin role
- RLS policies enforce admin-only access
- Admin API routes verify admin status before processing
- Client routes remain protected for individual users

## Deployment Notes

- All API routes use `export const dynamic = 'force-dynamic'`
- Admin checks are performed server-side
- No client-side admin checks (security through server-side validation)
- Compatible with Vercel deployment

## Next Steps

1. Run `ADMIN_SYSTEM_SETUP.sql` in Supabase
2. Create an admin user (update role in database)
3. Create the client detail page (`app/admin/clients/[clientId]/page.tsx`)
4. Create admin trading component
5. Test admin functionality



## Overview
This document describes the dual-portal system (Client Portal and Admin Portal) that has been implemented.

## What Has Been Implemented

### 1. Database Setup
- **File**: `ADMIN_SYSTEM_SETUP.sql`
- Added `role` column to `users` table (admin/client)
- Created `is_admin()` function
- Updated RLS policies to allow admins to view/manage all clients
- Run this SQL script in Supabase SQL Editor

### 2. Admin Utilities
- **File**: `lib/admin.ts`
- `isAdmin()` - Check if user is admin (server-side)
- `getAdminUserId()` - Get admin user ID from request

### 3. API Routes
- **`/api/admin/check`** - Check if current user is admin
- **`/api/admin/clients`** - Get all clients (admin only)
- **`/api/admin/clients/[clientId]`** - Get/Update specific client
- **`/api/admin/trade`** - Execute trades on behalf of clients

### 4. Admin Pages
- **`/admin`** - Admin dashboard with stats
- **`/admin/clients`** - Client management list
- **`/admin/clients/[clientId]`** - Individual client management (needs to be created)

### 5. Navigation Updates
- **File**: `components/Sidebar.tsx`
- Added admin menu items (Admin Portal, Client Management)
- Admin items only visible to users with admin role

## Remaining Files to Create

### 1. Client Detail Page
**File**: `app/admin/clients/[clientId]/page.tsx`

This page should:
- Display client details (balance, portfolio, transactions)
- Allow admin to trade on behalf of client (buy/sell stocks)
- Allow admin to update client profile
- Show client's portfolio positions
- Show transaction history

### 2. Admin Trading Component
**File**: `components/AdminTradeModal.tsx`

A modal component for admins to:
- Select stock symbol
- Choose buy/sell
- Enter quantity
- Execute trade on behalf of client

## How to Make a User an Admin

Run this SQL in Supabase:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Client Portal Features

Clients can:
- View their dashboard
- Edit their profile
- View balance and portfolio
- Search for other users
- Transfer credits
- View notifications

## Admin Portal Features

Admins can:
- View all clients
- Manage client accounts
- Trade on behalf of clients (buy/sell stocks)
- Update client balances
- View all transactions
- Access client portfolios

## Security

- All admin routes check for admin role
- RLS policies enforce admin-only access
- Admin API routes verify admin status before processing
- Client routes remain protected for individual users

## Deployment Notes

- All API routes use `export const dynamic = 'force-dynamic'`
- Admin checks are performed server-side
- No client-side admin checks (security through server-side validation)
- Compatible with Vercel deployment

## Next Steps

1. Run `ADMIN_SYSTEM_SETUP.sql` in Supabase
2. Create an admin user (update role in database)
3. Create the client detail page (`app/admin/clients/[clientId]/page.tsx`)
4. Create admin trading component
5. Test admin functionality












