const { readStream } = require('./redis');

readStream('search_by_tag', 'tags', async (redis, data) => {
    const tags = data[0][1].map(element => ({ post: element[1][1], tags: JSON.parse(element[1][3]) }));

    for (let i = 0; i < tags.length; i++) {
        const transaction = redis.multi();
        for (let j = 0; j < tags[i].tags.length; j++) {
            const key = `tag_${tags[i].tags[j]}`;
            transaction.lpush(key, tags[i].post);
            transaction.ltrim(key, 0, 24);
        }
        await transaction.exec();
    }
});
