import { Request, Response, NextFunction } from "express";
import redis from "../config/redis";
import { ApiError } from "../utils/ApiError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  prefix?: string;
}

const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, max, prefix = "rl" } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${prefix}:${ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      if (current > max) {
        throw new ApiError(429, "Too many requests, please try again later");
      }

      next();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      next();
    }
  };
};

export default rateLimiter;
