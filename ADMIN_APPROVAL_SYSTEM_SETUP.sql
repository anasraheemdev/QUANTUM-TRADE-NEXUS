-- ============================================
-- ADMIN APPROVAL SYSTEM SETUP
-- ============================================
-- This script creates the admin_requests table and related functions
-- Run this in Supabase SQL Editor

-- Step 1: Create admin_requests table
CREATE TABLE IF NOT EXISTS public.admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON public.admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_user_id ON public.admin_requests(user_id);

-- Step 3: Enable RLS
ALTER TABLE public.admin_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies for admin_requests
-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own admin requests" ON public.admin_requests;
CREATE POLICY "Users can view own admin requests"
  ON public.admin_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all requests
DROP POLICY IF EXISTS "Admins can view all admin requests" ON public.admin_requests;
CREATE POLICY "Admins can view all admin requests"
  ON public.admin_requests FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can update requests (approve/reject)
DROP POLICY IF EXISTS "Admins can update admin requests" ON public.admin_requests;
CREATE POLICY "Admins can update admin requests"
  ON public.admin_requests FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Users can insert their own requests
DROP POLICY IF EXISTS "Users can insert own admin requests" ON public.admin_requests;
CREATE POLICY "Users can insert own admin requests"
  ON public.admin_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Step 5: Function to approve admin request
CREATE OR REPLACE FUNCTION approve_admin_request(p_request_id UUID, p_reviewer_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Get the user_id from the request
  SELECT user_id, email INTO v_user_id, v_email
  FROM public.admin_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Update user role to admin
  UPDATE public.users
  SET role = 'admin', updated_at = NOW()
  WHERE id = v_user_id;
  
  -- Update request status
  UPDATE public.admin_requests
  SET status = 'approved',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN json_build_object('success', true, 'user_id', v_user_id, 'email', v_email);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Function to reject admin request
CREATE OR REPLACE FUNCTION reject_admin_request(p_request_id UUID, p_reviewer_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from the request
  SELECT user_id INTO v_user_id
  FROM public.admin_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;
  
  -- Update request status
  UPDATE public.admin_requests
  SET status = 'rejected',
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      rejection_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_request_id;
  
  RETURN json_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION approve_admin_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_admin_request(UUID, UUID, TEXT) TO authenticated;

-- Step 8: Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_admin_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_requests_updated_at ON public.admin_requests;
CREATE TRIGGER update_admin_requests_updated_at
  BEFORE UPDATE ON public.admin_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_requests_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if table was created
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_requests';

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'admin_requests';

