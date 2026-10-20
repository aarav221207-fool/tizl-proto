-- ============================================================================
-- TIZL BACKEND: DATABASE MIGRATION - PAYTM PAYMENT GATEWAY & DATA INTEGRITY
-- ============================================================================
-- Establishes unique constraints, indexes, and audit capabilities for Paytm PG.
-- ============================================================================

DO $$ BEGIN
  -- Ensure provider_order_id unique constraint to prevent duplicate transaction entries
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_provider_order_id_unique'
  ) THEN
    -- In case there are duplicates or nulls, create a unique index where provider_order_id is not null
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_order_id_unique 
    ON public.payments(provider_order_id) 
    WHERE provider_order_id IS NOT NULL;
  END IF;

  -- Ensure refund_id column exists for refund tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'refund_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN refund_id VARCHAR(255);
  END IF;

  -- Ensure method column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'method'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN method VARCHAR(50);
  END IF;
END $$;

-- Performance indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_provider_order_lookup ON public.payments(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_lookup ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_lookup ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status_lookup ON public.payments(status);

-- Enforce strict Row-Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own payments
DROP POLICY IF EXISTS "Customers can view own payments" ON public.payments;
CREATE POLICY "Customers can view own payments" ON public.payments
  FOR SELECT USING (customer_id = auth.uid() OR is_admin(auth.uid()));

-- Only server service-role or admin can insert/update payments
DROP POLICY IF EXISTS "Service role manages payments" ON public.payments;
CREATE POLICY "Service role manages payments" ON public.payments
  FOR ALL USING (auth.role() = 'service_role' OR is_admin(auth.uid()));
