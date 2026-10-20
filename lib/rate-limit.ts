import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { TooManyRequestsError, ApiError } from '@/lib/errors';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

// In-memory store for local development and non-production testing
interface MemoryEntry {
  count: number;
  resetAt: number;
}
const localCache = new Map<string, MemoryEntry>();

/**
 * Production-ready Atomic Rate Limiter
 * - In production: Uses shared database store with atomic increment locking.
 * - Fail-closed: If the shared rate limit store is unavailable in production, fails closed
 *   by throwing a retryable ServiceUnavailableError (HTTP 503) to prevent security abuse.
 * - In development/testing: Uses local in-memory store for seamless developer experience.
 *
 * @param key Unique identifier (e.g. `rate:pay_create:${userId}`)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Time window in milliseconds (default 15 minutes)
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);

  // Fast pre-check: if local memory already indicates over limit, reject immediately
  const local = localCache.get(key);
  if (local && now < local.resetAt && local.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((local.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  const isProduction =
    process.env.NODE_ENV === 'production' &&
    Boolean(isSupabaseAdminConfigured) &&
    !key.startsWith('test_');

  if (isProduction) {
    try {
      const supabase = createAdminClient();

      // Execute atomic RPC call with timeout protection
      const rpcPromise = (supabase as any).rpc('check_and_increment_rate_limit', {
        p_key: key,
        p_limit: limit,
        p_window_seconds: windowSeconds,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Rate limit DB timeout')), 2500)
      );

      const { data: rpcRes, error: rpcErr } = await Promise.race([rpcPromise, timeoutPromise]);

      if (rpcErr || !rpcRes) {
        throw new Error(rpcErr?.message || 'Rate limit RPC failed');
      }

      const resetInSeconds = Number(rpcRes.reset_in_seconds) || windowSeconds;
      const allowed = Boolean(rpcRes.allowed);
      const remaining = Number(rpcRes.remaining) || 0;

      // Sync local cache
      if (!allowed) {
        localCache.set(key, { count: limit, resetAt: now + resetInSeconds * 1000 });
      }

      return { allowed, remaining, resetInSeconds };
    } catch (err) {
      // Production fail-closed for payment and security-sensitive operations
      console.error(`[RateLimit Error] Production rate limit store unreachable for key ${key}:`, (err as Error)?.message);
      throw new ApiError(
        'Rate limit service temporarily unavailable. Please retry your request in a few moments.',
        503,
        'SERVICE_UNAVAILABLE',
        { retryAfter: 5 }
      );
    }
  }

  // Development and test environment fallback: In-memory store
  const currentEntry = localCache.get(key);
  if (!currentEntry || now > currentEntry.resetAt) {
    localCache.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }

  if (currentEntry.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((currentEntry.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  currentEntry.count += 1;
  return {
    allowed: true,
    remaining: limit - currentEntry.count,
    resetInSeconds: Math.ceil((currentEntry.resetAt - now) / 1000),
  };
}

/**
 * Helper to extract trusted client IP
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export function resetRateLimit(key: string) {
  localCache.delete(key);
}
