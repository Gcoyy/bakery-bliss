-- Create ORDER_CANCELLATIONS table to store cancellation reasons
CREATE TABLE IF NOT EXISTS ORDER_CANCELLATIONS (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    cake_name VARCHAR(255) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    cancellation_reason TEXT NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_order_cancellations_order_id 
        FOREIGN KEY (order_id) 
        REFERENCES "ORDER"(order_id) 
        ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_cancellations_order_id ON ORDER_CANCELLATIONS(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_admin_email ON ORDER_CANCELLATIONS(admin_email);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_created_at ON ORDER_CANCELLATIONS(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE ORDER_CANCELLATIONS ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all cancellations
CREATE POLICY "Admins can view all order cancellations" ON ORDER_CANCELLATIONS
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ADMIN 
            WHERE ADMIN.auth_user_id = auth.uid()
        )
    );

-- Policy for customers to view their own cancellations
CREATE POLICY "Customers can view their own order cancellations" ON ORDER_CANCELLATIONS
    FOR SELECT USING (
        customer_email = (
            SELECT email FROM auth.users 
            WHERE id = auth.uid()
        )
    );

-- Policy for inserting cancellations (only authenticated users)
CREATE POLICY "Authenticated users can insert order cancellations" ON ORDER_CANCELLATIONS
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT, INSERT ON ORDER_CANCELLATIONS TO authenticated;
GRANT USAGE ON SEQUENCE order_cancellations_id_seq TO authenticated;
