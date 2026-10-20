-- ============================================================================
-- TIZL BACKEND: DATABASE MIGRATION 08 - ATOMIC REFUND RESERVATION & CONCURRENCY
-- ============================================================================
-- Provides a PostgreSQL atomic function to lock a payment record and reserve
-- refund balance safely, preventing race conditions and double/over-refunds.
-- Restricts execution strictly to trusted server-side service_role.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reserve_refund_balance(
  p_payment_id UUID,
  p_refund_amount NUMERIC(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment RECORD;
  v_available NUMERIC(10,2);
  v_new_refunded NUMERIC(10,2);
BEGIN
  -- Strict validation of refund amount
  IF p_refund_amount IS NULL OR p_refund_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Refund amount must be strictly greater than zero'
    );
  END IF;

  -- Row-level exclusive lock on the payments row to serialize concurrent refund attempts
  SELECT id, amount, refunded_amount, status
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment record not found'
    );
  END IF;

  IF v_payment.status != 'captured' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Cannot refund a payment with status %s. Only captured payments can be refunded.', v_payment.status)
    );
  END IF;

  v_available := v_payment.amount - COALESCE(v_payment.refunded_amount, 0.00);

  IF p_refund_amount > v_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Requested refund amount ₹%s exceeds remaining refundable balance ₹%s', p_refund_amount, v_available),
      'available_balance', v_available
    );
  END IF;

  v_new_refunded := COALESCE(v_payment.refunded_amount, 0.00) + p_refund_amount;

  -- Atomically increment refunded_amount to reserve balance immediately
  UPDATE public.payments
  SET 
    refunded_amount = v_new_refunded,
    refund_status = CASE WHEN v_new_refunded >= v_payment.amount - 0.01 THEN 'full' ELSE 'partial' END,
    updated_at = NOW()
  WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'reserved_amount', p_refund_amount,
    'new_refunded_total', v_new_refunded,
    'remaining_balance', v_payment.amount - v_new_refunded,
    'is_fully_refunded', (v_new_refunded >= v_payment.amount - 0.01)
  );
END;
$$;

-- Atomic release function in case external gateway call encounters an unrecoverable failure
CREATE OR REPLACE FUNCTION public.release_refund_reservation(
  p_payment_id UUID,
  p_refund_amount NUMERIC(10,2)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment RECORD;
  v_restored_refunded NUMERIC(10,2);
BEGIN
  IF p_refund_amount IS NULL OR p_refund_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid refund amount to release');
  END IF;

  SELECT id, amount, refunded_amount, status
  INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
  END IF;

  v_restored_refunded := GREATEST(0.00, COALESCE(v_payment.refunded_amount, 0.00) - p_refund_amount);

  UPDATE public.payments
  SET 
    refunded_amount = v_restored_refunded,
    refund_status = CASE 
      WHEN v_restored_refunded = 0 THEN NULL 
      WHEN v_restored_refunded >= v_payment.amount - 0.01 THEN 'full' 
      ELSE 'partial' 
    END,
    updated_at = NOW()
  WHERE id = p_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'restored_refunded_total', v_restored_refunded,
    'remaining_balance', v_payment.amount - v_restored_refunded
  );
END;
$$;

-- Explicitly revoke public/anon/authenticated access and grant strictly to service_role
REVOKE ALL ON FUNCTION public.reserve_refund_balance(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_refund_balance(UUID, NUMERIC) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_refund_balance(UUID, NUMERIC) TO service_role;

REVOKE ALL ON FUNCTION public.release_refund_reservation(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_refund_reservation(UUID, NUMERIC) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_refund_reservation(UUID, NUMERIC) TO service_role;
