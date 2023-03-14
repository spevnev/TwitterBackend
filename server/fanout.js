const { readStream } = require('./redis');
const { getDBClient } = require('./db');

readStream('fanout', 'posts', async (redis, data) => {
    const t = Date.now();
    const db = await getDBClient();
    const posts = data[0][1].map(element => ({ post: element[1][1], feed: element[1][3] }));

    for (let i = 0; i < posts.length; i++) {
        const result = await db.query(`SELECT id FROM users WHERE feeds @> $1;`, [[posts[i].feed]]);
        const request = redis.pipeline();
        result.rows.forEach(({ id }) => {
            const key = `user_${id}`;
            request.lpush(key, posts[i].post);
            request.ltrim(key, 0, 19);
        });
        request.exec();
    }
    console.log((Date.now() - t) / posts.length);
});
