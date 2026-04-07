import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';

/**
 * Simple Redis cache middleware for GET requests
 * @param duration Cache duration in seconds
 */
export const cacheMiddleware = (duration: number) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;

        try {
            const cached = await redisClient.get(key);
            if (cached) {
                console.log(`✅ Cache HIT: ${req.originalUrl}`);
                return res.json(JSON.parse(cached));
            }

            console.log(`❌ Cache MISS: ${req.originalUrl}`);

        // Override res.json to cache ONLY successful responses (2xx)
            const originalJson = res.json.bind(res);
            res.json = function (data: any) {
                // IMPORTANT: Only cache 2xx responses — never cache errors!
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(key, duration, JSON.stringify(data)).catch(err => {
                        console.error('Redis cache error:', err);
                    });
                } else {
                    console.warn(`⚠️  Not caching error response (${res.statusCode}) for: ${req.originalUrl}`);
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Redis error, bypassing cache:', error);
            next();
        }
    };
};

/**
 * Clear cache for a specific pattern
 * @param pattern Redis key pattern (e.g., 'cache:/api/acoes*')
 */
export const clearCache = async (pattern: string): Promise<void> => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            for (const key of keys) {
                await redisClient.del(key);
            }
            console.log(`🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`);
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};
