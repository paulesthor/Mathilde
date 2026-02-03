-- Migration: Add Customer Profile Fields, Email, and Update Role
-- Run this in Supabase SQL Editor

-- 1. Drop existing check constraint on 'role'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add new check constraint permitting 'customer'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'client', 'customer'));

-- 3. Add column fields including EMAIL
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- 4. Update existing 'client' roles to 'customer'
UPDATE profiles SET role = 'customer' WHERE role = 'client';

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 6. Update the trigger function to use 'customer' and copy EMAIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email)
  VALUES (new.id, 'customer', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. (Optional) Backfill email for existing profiles from auth.users
-- This attempts to update profiles that have a matching ID in auth.users
-- Note: You might need to run this part separately if permissions deny cross-schema access in strict mode
UPDATE profiles
SET email = users.email
FROM auth.users
WHERE profiles.id = users.id AND profiles.email IS NULL;
