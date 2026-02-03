-- Customer Inquiries Table
-- For storing customer contact form submissions and inquiries

CREATE TABLE IF NOT EXISTS customer_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'replied', 'closed'
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies for customer_inquiries

-- Enable RLS
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Customers can create inquiries
CREATE POLICY "Customers can create inquiries"
ON customer_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Customers can read their own inquiries
CREATE POLICY "Customers can read own inquiries"
ON customer_inquiries
FOR SELECT
TO authenticated
USING (auth.uid() = customer_id);

-- Admins can read all inquiries
CREATE POLICY "Admins can read all inquiries"
ON customer_inquiries
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Admins can update inquiries
CREATE POLICY "Admins can update inquiries"
ON customer_inquiries
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON customer_inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON customer_inquiries(created_at DESC);
