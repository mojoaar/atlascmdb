import { NextResponse } from 'next/server';

// Lightweight in-memory fixed-window rate limiter.
//
// NOTE: state lives in the Node process. This is appropriate for the
// single-instance, single-connection deployment this app targets (see the
// WAL single-connection pool in db/knexfile.js). A horizontally-scaled
// production deployment would need a shared store (e.g. Redis) instead.

const buckets = new Map(); // key -> { count, resetAt }

// Periodically evict expired buckets so the Map can't grow unbounded.
let lastSweep = 0;
function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Derive a best-effort client identifier from the request.
 * Honors x-forwarded-for / x-real-ip (set by a reverse proxy), falling back
 * to a constant so the limiter still degrades to a global cap if no IP is seen.
 */
export function clientKey(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Check (and consume) one unit against a fixed window.
 * @param {string} key   unique bucket key (e.g. `login:1.2.3.4`)
 * @param {object} opts  { limit, windowMs }
 * @returns {{ allowed: boolean, remaining: number, retryAfter: number }}
 */
export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
  return { allowed: bucket.count <= limit, remaining, retryAfter };
}

/**
 * Convenience guard for route handlers. Returns a 429 NextResponse when the
 * caller has exceeded the window, or null when the request may proceed.
 *
 *   const limited = enforceRateLimit(request, 'login', { limit: 5, windowMs: 60000 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(request, scope, opts = {}) {
  const { allowed, retryAfter } = rateLimit(`${scope}:${clientKey(request)}`, opts);
  if (allowed) return null;
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  );
}
