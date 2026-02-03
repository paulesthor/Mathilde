-- Add columns for Two-Way Messaging
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES messages(id);

-- Add columns for Appointment Management
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT 'none'; -- 'none', 'proposed', 'accepted', 'rejected'

-- Update RLS for Messages (Allow reading received messages)
DROP POLICY IF EXISTS "Users can see own sent messages." ON messages;
DROP POLICY IF EXISTS "Users can manage own messages" ON messages;

CREATE POLICY "Users can manage own messages" ON messages
    FOR ALL USING (
        sender_email = (select email from profiles where id = auth.uid()) OR
        sender_email = auth.email() OR
        recipient_email = (select email from profiles where id = auth.uid()) OR
        recipient_email = auth.email()
    );

-- Allow Admins full access (redundant if they have a role, but good for safety)
DROP POLICY IF EXISTS "Admins have full access to messages" ON messages;
CREATE POLICY "Admins have full access to messages" ON messages
    FOR ALL USING (
        exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    );
