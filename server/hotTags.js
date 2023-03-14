const { readStream } = require('./redis');

const LATEST_POSTS_NUMBER = 1000;
const BATCH_SIZE = 50;

let tags = [];
readStream('hot_tags', 'tags', async (redis, data) => {
    const newTags = data[0][1].map(element => JSON.parse(element[1][3]));
    tags.unshift(...newTags);

    if (tags.length < LATEST_POSTS_NUMBER + BATCH_SIZE) return;
    tags = tags.slice(0, LATEST_POSTS_NUMBER);

    const tagCount = {};
    tags.forEach(tags =>
        tags.forEach(tag => {
            if (!tagCount[tag]) tagCount[tag] = 0;
            tagCount[tag]++;
        })
    );
    const hotTags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

    await redis.set('hot_tags', JSON.stringify(hotTags));
});
