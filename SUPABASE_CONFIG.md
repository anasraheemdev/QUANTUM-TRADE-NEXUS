# Supabase Configuration Guide

## ✅ Current Configuration

Your Supabase is properly configured with the following:

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://rpmjeptoxybuimynhkhn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Client Configuration (`lib/supabase.ts`)
- ✅ Client-side Supabase client for browser use
- ✅ Server-side client for API routes (uses anon key)
- ✅ Admin client for service role operations (bypasses RLS)

### Authentication (`contexts/AuthContext.tsx`)
- ✅ Sign up with automatic user profile creation
- ✅ Sign in with password
- ✅ Sign out functionality
- ✅ Session management
- ✅ Auth state listeners

### API Routes
- ✅ `/api/user` - GET and PUT for user profile
- ✅ `/api/portfolio` - GET portfolio with Supabase positions
- ✅ `/api/transactions` - POST and GET transactions

## 📊 Database Tables Required

Make sure these tables exist in your Supabase database:

### 1. `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  account_balance NUMERIC DEFAULT 100000,
  total_invested NUMERIC DEFAULT 0,
  member_since TIMESTAMP DEFAULT NOW(),
  trading_level TEXT DEFAULT 'Beginner',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `portfolio_positions` table
```sql
CREATE TABLE portfolio_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  shares NUMERIC NOT NULL,
  avg_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);
```

### 3. `transactions` table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  shares NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. `watchlist` table (optional)
```sql
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);
```

## 🔐 Row Level Security (RLS) Policies

Enable RLS on all tables and create these policies:

### Users Table
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Portfolio Positions
```sql
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions"
  ON portfolio_positions FOR ALL
  USING (auth.uid() = user_id);
```

### Transactions
```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);
```

### Watchlist
```sql
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);
```

## ✅ Verification Checklist

- [x] Environment variables set in `.env.local`
- [x] Supabase client configured in `lib/supabase.ts`
- [x] Auth context provider in `contexts/AuthContext.tsx`
- [x] User API route created (`/api/user`)
- [x] Portfolio API route uses Supabase (`/api/portfolio`)
- [x] Transactions API route uses Supabase (`/api/transactions`)
- [x] Profile page fetches from Supabase
- [x] Dashboard fetches from Supabase
- [x] Static `user.json` file removed
- [x] All user data is dynamic from Supabase

## 🚀 Testing

1. **Sign Up**: Create a new account - should create user in `users` table
2. **Sign In**: Login with credentials - should fetch user from Supabase
3. **Profile**: View profile page - should show data from Supabase
4. **Update Profile**: Edit name/trading level - should update in Supabase
5. **Portfolio**: View dashboard - should show positions from Supabase
6. **Transactions**: Buy/sell stocks - should save to Supabase

## 📝 Notes

- All user data is now stored in Supabase (no static JSON files)
- User profiles are automatically created on signup
- All API routes require authentication
- RLS policies ensure users can only access their own data

