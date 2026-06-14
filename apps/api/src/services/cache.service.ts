import redis from "../config/redis";

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get<T>(key);
  return data;
};

export const cacheSet = async (
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> => {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
};

export const cacheInvalidate = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await Promise.all(keys.map((key) => redis.del(key)));
  }
};

export const cacheDelete = async (key: string): Promise<void> => {
  await redis.del(key);
};
