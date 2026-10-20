-- ============================================================================
-- TIZL BACKEND: DATABASE MIGRATION - PROVIDER-NEUTRAL PAYMENTS & PAYTM INTEGRATION
-- ============================================================================
-- Establishes provider-neutral schema supporting Paytm Payment Gateway, UPI Deep Linking, and Server-to-Server callbacks.
-- ============================================================================

-- 1. Ensure provider-neutral columns on payments table
DO $$ BEGIN
  -- Provider identifier ('paytm', 'upi', etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider') THEN
    ALTER TABLE payments ADD COLUMN provider VARCHAR(50) NOT NULL DEFAULT 'paytm';
  END IF;

  -- Provider-neutral order and transaction identifiers
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_order_id') THEN
    ALTER TABLE payments ADD COLUMN provider_order_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_payment_id') THEN
    ALTER TABLE payments ADD COLUMN provider_payment_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'provider_signature') THEN
    ALTER TABLE payments ADD COLUMN provider_signature TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'txn_token') THEN
    ALTER TABLE payments ADD COLUMN txn_token TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'bank_txn_id') THEN
    ALTER TABLE payments ADD COLUMN bank_txn_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'raw_response') THEN
    ALTER TABLE payments ADD COLUMN raw_response JSONB;
  END IF;
END $$;

-- 3. Create Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_id ON payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 4. Enable Row Level Security (RLS) on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
DROP POLICY IF EXISTS "Customers can view own payments" ON payments;
CREATE POLICY "Customers can view own payments" ON payments
  FOR SELECT USING (customer_id = auth.uid() OR is_admin(auth.uid()));

-- Only server service-role or admin can insert/update payments
DROP POLICY IF EXISTS "Service role manages payments" ON payments;
CREATE POLICY "Service role manages payments" ON payments
  FOR ALL USING (auth.role() = 'service_role' OR is_admin(auth.uid()));
