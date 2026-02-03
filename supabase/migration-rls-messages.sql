-- Add RLS policy for Users to see their own sent messages
-- Run this in Supabase SQL Editor

-- 1. Drop the policy if it already exists (to avoid errors)
DROP POLICY IF EXISTS "Users can see own sent messages." ON messages;

-- 2. Create it again with the correct definition
CREATE POLICY "Users can see own sent messages." ON messages
    FOR SELECT USING (
        sender_email = (select email from profiles where id = auth.uid()) OR
        sender_email = auth.email()
    );

-- 3. (Optional) Ensure Auth Users have read access to Appointments too
DROP POLICY IF EXISTS "Users can see own appointments." ON appointments;

CREATE POLICY "Users can see own appointments." ON appointments
    FOR SELECT USING (
        client_email = (select email from profiles where id = auth.uid()) OR
        client_email = auth.email()
    );
