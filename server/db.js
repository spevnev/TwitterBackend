const { Pool } = require('pg');
const { FEEDS, FEEDS_POSTS, USERS, USERS_SUBSCRIPTIONS, HOT_TAGS, TAGS, TAGS_PER_POST } = require('../config');

let client;
const getClient = async () => {
    if (!client) {
        client = new Pool({ database: 'tweeter' });
        await client.connect();
    }

    return client;
};

const initDB = async () => {
    return;
    const client = await getClient();
    try {
        await client.query(`BEGIN;`);

        await client.query(`
            DROP TABLE IF EXISTS feeds, users, posts;
            CREATE TABLE feeds (
                id SERIAL NOT NULL,
                title TEXT NOT NULL
            );
            CREATE TABLE users (
                id SERIAL NOT NULL,
                username TEXT NOT NULL,
                feeds INT[] NOT NULL
            );
            CREATE TABLE posts (
                id SERIAL NOT NULL,
                feed_id INT NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT(NOW()),
                tags TEXT[] NOT NULL
            );
        `);

        await client.query(
            `INSERT INTO feeds(title)
            SELECT 'f' || i
            FROM generate_series(1, $1) i;`,
            [FEEDS]
        );
        await client.query(
            `INSERT INTO users(username, feeds)
            SELECT 'u' || i, array_agg(j)
            FROM generate_series(1, $1) i, generate_series(1, $2) j
            WHERE RANDOM() < $3 GROUP BY i;`,
            [USERS, FEEDS, USERS_SUBSCRIPTIONS / FEEDS]
        );
        let values = [];
        for (let feed = 1; feed <= FEEDS; feed++) {
            for (let post = 1; post <= FEEDS_POSTS; post++) {
                const tags = new Set();
                for (let i = 0; i < 5; i++) tags.add(`"t${Math.floor(Math.random() * HOT_TAGS) + 1}"`);
                while (tags.size < TAGS_PER_POST) tags.add(`"t${Math.floor(Math.random() * TAGS) + 1}"`);
                values.push(`(${feed},'txt','{${[...tags].join(',')}}')`);
            }
            if (values.length > 100000) {
                await client.query(`
                    INSERT INTO posts(feed_id, text, tags)
                    VALUES ${values.join(',')}
                `);
                values = [];
            }
        }
        await client.query(`
            INSERT INTO posts(feed_id, text, tags)
            VALUES ${values.join(',')}
        `);

        await client.query(`
            CREATE UNIQUE INDEX feeds_idx ON feeds (id);
            CREATE UNIQUE INDEX users_idx ON users (id);
            CREATE UNIQUE INDEX posts_idx ON posts (id);
            CREATE INDEX posts_created_at_idx ON posts (created_at DESC);
            CREATE INDEX posts_tags_idx ON posts USING GIN (tags);
        `);

        await client.query(`ANALYZE feeds, users, posts;`);
        await client.query(`COMMIT;`);
    } catch (error) {
        await client.query(`ROLLBACK;`);
        console.error(error);
        console.error('An error occurred while initializing DB');
    }
};

module.exports = { getClient, initDB };
