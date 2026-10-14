import { createClient } from "redis";

// Only the two commands we use, so the type does not depend on the client's many generics.
type RedisClient = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

const g = globalThis as unknown as {
  __redis?: Promise<RedisClient | null>;
  __rl?: Map<string, { count: number; resetAt: number }>;
};

function getRedis(): Promise<RedisClient | null> {
  if (!g.__redis) {
    const url = process.env.REDIS_URL;
    if (!url) {
      g.__redis = Promise.resolve(null);
    } else {
      const c = createClient({
        url,
        socket: { connectTimeout: 2000, reconnectStrategy: false },
      });
      c.on("error", () => {}); // connection problems are handled by the in-memory fallback below
      g.__redis = c
        .connect()
        .then(() => c as unknown as RedisClient)
        .catch((e) => {
          console.error(
            "Redis unavailable, using in-memory rate limiting:",
            (e as Error).message,
          );
          return null;
        });
    }
  }
  return g.__redis;
}

/**
 * Allows `limit` attempts per `windowSec` for a key. Uses Redis when it is reachable and falls back
 * to a per-server counter, so form spam protection never disappears if Redis is down.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  try {
    const redis = await getRedis();
    if (redis) {
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, windowSec);
      return n <= limit;
    }
  } catch (e) {
    console.error(
      "Redis rate limit failed, using in-memory fallback:",
      (e as Error).message,
    );
  }
  const map = (g.__rl ??= new Map());
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || entry.resetAt < now) {
    map.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function redisConfigured() {
  return Boolean(process.env.REDIS_URL);
}
