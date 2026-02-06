import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let _redis: Redis;

function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

// No-op limiter when Upstash is not configured
const noopLimit = async (_id: string) => ({ success: true, limit: 0, remaining: 0, reset: 0 });

let _generationLimiter: Ratelimit;
let _apiLimiter: Ratelimit;

// 10 generations per minute
export const generationLimiter = {
  get limit() {
    if (!isConfigured) return noopLimit;
    if (!_generationLimiter) {
      _generationLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:generation",
      });
    }
    return _generationLimiter.limit.bind(_generationLimiter);
  },
};

// 30 API requests per minute
export const apiLimiter = {
  get limit() {
    if (!isConfigured) return noopLimit;
    if (!_apiLimiter) {
      _apiLimiter = new Ratelimit({
        redis: getRedis(),
        limiter: Ratelimit.slidingWindow(30, "1 m"),
        analytics: true,
        prefix: "ratelimit:api",
      });
    }
    return _apiLimiter.limit.bind(_apiLimiter);
  },
};
