-- ============================================================================
-- TIZL BACKEND: DATABASE MIGRATION 09 - ATOMIC RATE LIMIT INCREMENT
-- ============================================================================
-- Provides a race-condition-free atomic increment function for distributed
-- rate limiting across serverless and edge instances.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key VARCHAR(255),
  p_limit INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS 919
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_reset_at TIMESTAMPTZ;
  v_record RECORD;
  v_new_count INT;
  v_allowed BOOLEAN;
  v_remaining INT;
  v_reset_in_seconds INT;
BEGIN
  -- Row-level exclusive lock on rate_limits row
  SELECT key, count, reset_at
  INTO v_record
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First hit in window
    v_reset_at := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    INSERT INTO public.rate_limits (key, count, reset_at, created_at, updated_at)
    VALUES (p_key, 1, v_reset_at, v_now, v_now);

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', GREATEST(0, p_limit - 1),
      'reset_in_seconds', p_window_seconds
    );
  END IF;

  -- Window has passed: reset
  IF v_now >= v_record.reset_at THEN
    v_reset_at := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    UPDATE public.rate_limits
    SET count = 1,
        reset_at = v_reset_at,
        updated_at = v_now
    WHERE key = p_key;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', GREATEST(0, p_limit - 1),
      'reset_in_seconds', p_window_seconds
    );
  END IF;

  -- Window active
  v_reset_in_seconds := GREATEST(1, EXTRACT(EPOCH FROM (v_record.reset_at - v_now))::INT);

  IF v_record.count >= p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_in_seconds', v_reset_in_seconds
    );
  END IF;

  v_new_count := v_record.count + 1;
  UPDATE public.rate_limits
  SET count = v_new_count,
      updated_at = v_now
  WHERE key = p_key;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', GREATEST(0, p_limit - v_new_count),
    'reset_in_seconds', v_reset_in_seconds
  );
END;
919;

-- Restrict execution to service_role only
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(VARCHAR, INT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_increment_rate_limit(VARCHAR, INT, INT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(VARCHAR, INT, INT) TO service_role;
