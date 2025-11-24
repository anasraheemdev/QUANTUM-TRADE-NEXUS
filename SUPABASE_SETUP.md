# Supabase Setup Guide for QUANTUM TRADE NEXUS

This guide will help you set up Supabase for your trading platform application.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up using GitHub, Google, or email
4. Verify your email if required

## Step 2: Create a New Project

1. Once logged in, click "New Project"
2. Fill in the project details:
   - **Name**: QUANTUM TRADE NEXUS (or any name you prefer)
   - **Database Password**: Create a strong password (save this securely!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select "Free" for development
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be set up

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, click on the "Settings" icon (gear icon) in the left sidebar
2. Click on "API" in the settings menu
3. You'll see:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

## Step 4: Add Environment Variables

1. Open your `.env.local` file in the project root
2. Add the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.example
```

3. **Important**: Never commit `.env.local` to Git! It's already in `.gitignore`

## Step 5: Set Up Database Tables

### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Click on "Table Editor" in the left sidebar
3. Click "New Table"
4. Create the following tables:

#### Users Table
- Table name: `users`
- Columns:
  - `id` (uuid, primary key, default: `gen_random_uuid()`)
  - `email` (text, unique, not null)
  - `name` (text)
  - `avatar_url` (text)
  - `account_balance` (numeric, default: 100000)
  - `total_invested` (numeric, default: 0)
  - `member_since` (timestamp, default: `now()`)
  - `trading_level` (text, default: 'Beginner')
  - `created_at` (timestamp, default: `now()`)
  - `updated_at` (timestamp, default: `now()`)

#### Portfolio Positions Table
- Table name: `portfolio_positions`
- Columns:
  - `id` (uuid, primary key, default: `gen_random_uuid()`)
  - `user_id` (uuid, foreign key to `users.id`)
  - `symbol` (text, not null)
  - `shares` (numeric, not null)
  - `avg_price` (numeric, not null)
  - `created_at` (timestamp, default: `now()`)
  - `updated_at` (timestamp, default: `now()`)

#### Watchlist Table
- Table name: `watchlist`
- Columns:
  - `id` (uuid, primary key, default: `gen_random_uuid()`)
  - `user_id` (uuid, foreign key to `users.id`)
  - `symbol` (text, not null)
  - `created_at` (timestamp, default: `now()`)

#### Transactions Table
- Table name: `transactions`
- Columns:
  - `id` (uuid, primary key, default: `gen_random_uuid()`)
  - `user_id` (uuid, foreign key to `users.id`)
  - `symbol` (text, not null)
  - `type` (text, not null) - 'buy' or 'sell'
  - `shares` (numeric, not null)
  - `price` (numeric, not null)
  - `total` (numeric, not null)
  - `created_at` (timestamp, default: `now()`)

### Option B: Using SQL (Advanced)

1. Go to "SQL Editor" in Supabase dashboard
2. Run the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
-- IMPORTANT: id must reference auth.users(id) for proper integration
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

-- Portfolio positions table
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

-- Watchlist table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Transactions table
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

-- Create indexes for better performance
CREATE INDEX idx_portfolio_user_id ON portfolio_positions(user_id);
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_symbol ON transactions(symbol);
```

## Step 5.5: Create Database Trigger (Recommended)

To automatically create user profiles when users sign up, run this SQL in your Supabase SQL Editor:

```sql
-- Function to create user profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, account_balance, total_invested, trading_level, member_since)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    100000,
    0,
    'Beginner',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

This trigger will automatically create a user profile whenever someone signs up, even if email confirmation is required.

**Alternative:** If you prefer not to use triggers, the application will create the user profile via API when they first sign in.

## Step 6: Set Up Row Level Security (RLS)

1. Go to "Authentication" > "Policies" in Supabase dashboard
2. Enable Row Level Security for each table:

### For Users Table:
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### For Portfolio Positions:
```sql
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own positions"
  ON portfolio_positions FOR ALL
  USING (auth.uid() = user_id);
```

### For Watchlist:
```sql
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);
```

### For Transactions:
```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);
```

## Step 7: Set Up Authentication

1. Go to "Authentication" > "Providers" in Supabase dashboard
2. Enable the authentication methods you want:
   - **Email**: Enable email/password authentication
   - **Google**: (Optional) Enable Google OAuth
   - **GitHub**: (Optional) Enable GitHub OAuth

3. Configure email templates (optional):
   - Go to "Authentication" > "Email Templates"
   - Customize the confirmation and password reset emails

## Step 8: Test Your Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for any Supabase connection errors

3. Try signing up a test user through your sign-in page

## Step 9: Deploy Environment Variables

When deploying to Vercel or another platform:

1. Go to your project settings
2. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only for server-side operations)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## Troubleshooting

### Connection Issues
- Verify your environment variables are set correctly
- Check that your Supabase project is active
- Ensure you're using the correct project URL and keys

### RLS Policy Issues
- Make sure RLS is enabled on your tables
- Verify your policies allow the operations you're trying to perform
- Check that users are authenticated before accessing protected data

### Authentication Issues
- Verify email provider is configured in Supabase
- Check email templates are set up correctly
- Ensure redirect URLs are configured in Supabase dashboard

## Next Steps

After setup, you can:
1. Integrate authentication in your sign-in page
2. Create API routes to interact with Supabase
3. Store user portfolios and transactions
4. Implement real-time updates using Supabase subscriptions

