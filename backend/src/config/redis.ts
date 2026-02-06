import { createClient } from 'redis';
import { config } from './index';

export const redisClient = createClient({
    socket: {
        host: config.redis.host,
        port: config.redis.port,
    },
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

export const connectRedis = async (): Promise<void> => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
};
