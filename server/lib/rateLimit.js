// server/lib/rateLimit.js
// Lightweight in-memory rate limiter.
// Stores request counts per key in a Map, auto-prunes expired entries.

const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = '' } = {}) {
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}:${req.path}`;
    const now = Date.now();
    let entry = buckets.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      buckets.set(key, entry);
    }

    entry.count++;

    // Set rate-limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((entry.start + windowMs) / 1000));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.start + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

// Prune expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now - entry.start > 300_000) buckets.delete(key);
  }
}, 300_000).unref();
