-- ============================================================================
-- TIZL BACKEND: DATABASE MIGRATION 07 - PRODUCTION-READINESS SAFEGUARDS
-- ============================================================================
-- Enforces:
-- 1. Payment refund tracking (refunded_amount, refund_status)
-- 2. Audit logs for financial & administrative events
-- 3. Distributed rate limiting store for serverless/edge instances
-- 4. Payment refunds ledger table for tracking partial & full refunds
-- 5. Hardened Row-Level Security (RLS) policies
-- ============================================================================

DO $$ BEGIN
  -- 1. Ensure refunded_amount column on payments table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'refunded_amount'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN refunded_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00;
  END IF;

  -- 2. Ensure refund_status column on payments table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'refund_status'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN refund_status VARCHAR(50) DEFAULT NULL;
  END IF;

  -- 3. Ensure provider_payment_id unique index where not null (prevents duplicate capture recording)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_provider_payment_id_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_payments_provider_payment_id_unique 
    ON public.payments(provider_payment_id) 
    WHERE provider_payment_id IS NOT NULL;
  END IF;
END $$;

-- 4. Create payment_refunds ledger table to track every refund request idempotently
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  refund_ref_id VARCHAR(255) NOT NULL UNIQUE,
  paytm_refund_id VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, successful, failed
  reason TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment ON public.payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_booking ON public.payment_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_ref ON public.payment_refunds(refund_ref_id);

-- Enable RLS on payment_refunds
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and manage refunds" ON public.payment_refunds;
CREATE POLICY "Admins can view and manage refunds" ON public.payment_refunds
  FOR ALL USING (auth.role() = 'service_role' OR is_admin(auth.uid()));

-- 5. Create distributed rate_limits table for multi-instance serverless deployments
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key VARCHAR(255) PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON public.rate_limits(reset_at);

-- Rate limits table is strictly server-only
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limits;
CREATE POLICY "Service role manages rate limits" ON public.rate_limits
  FOR ALL USING (auth.role() = 'service_role');
