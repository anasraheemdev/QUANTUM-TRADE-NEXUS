-- Fix users table structure
-- The id column must be UUID, not bigint

-- First, drop the existing table if it has wrong structure (BE CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct UUID type
CREATE TABLE IF NOT EXISTS users (
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

-- If table already exists with wrong type, you need to:
-- 1. Drop the table (if no important data)
-- 2. Or alter the column type (if you have data to preserve)

-- To alter existing table (if you have data):
-- ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::text::uuid;

