import "server-only";

/**
 * In-memory sliding-window rate limiter, suitable for a single-node deploy.
 * Multi-node setups should swap in a shared store (e.g. Redis) behind the
 * same interface.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      retryAfterSec: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  // Opportunistic cleanup to bound memory
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.timestamps.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}
