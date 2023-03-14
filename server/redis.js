const { Redis } = require('ioredis');
const { v4: uuid } = require('uuid');

let client;
const getRedisClient = () => {
    if (!client) client = new Redis();
    return client;
};

const initRedis = async () => {
    const redis = getRedisClient();
    try {
        await redis.xgroup('CREATE', 'posts', 'fanout', '$', 'MKSTREAM');
        await redis.xgroup('CREATE', 'tags', 'search_by_tag', '$', 'MKSTREAM');
        await redis.xgroup('CREATE', 'tags', 'hot_tags', '$', 'MKSTREAM');
    } catch (e) {}
};

const readStream = async (group, stream, callback) => {
    const redis = getRedisClient();
    while (1) {
        const result = await redis.xreadgroup('GROUP', group, uuid(), 'BLOCK', 0, 'STREAMS', stream, '>');
        await callback(redis, result);
    }
};

module.exports = { getRedisClient, initRedis, readStream };
