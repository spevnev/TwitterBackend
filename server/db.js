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
    try {
        const client = await getClient();

        await client.query(`
            DROP TABLE IF EXISTS users, feeds, subscriptions, posts, post_tags, tags;
            CREATE TABLE users (
                id SERIAL NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE
            );
            CREATE TABLE feeds (
                id SERIAL NOT NULL UNIQUE,
                title TEXT NOT NULL UNIQUE
            );
            CREATE TABLE subscriptions (
                user_id INT NOT NULL,
                feed_id INT NOT NULL
            );
            CREATE TABLE posts (
                id SERIAL NOT NULL UNIQUE,
                feed_id INT NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT(NOW())
            );
            CREATE TABLE post_tags (
                post_id INT NOT NULL,
                tag_id INT NOT NULL
            );
            CREATE TABLE tags (
                id SERIAL NOT NULL UNIQUE,
                tag TEXT NOT NULL UNIQUE
            );
        `);

        await client.query(
            `INSERT INTO users(username)
            SELECT 'user #' || i
            FROM generate_series(1, $1) AS i;`,
            [USERS]
        );
        await client.query(
            `INSERT INTO feeds(title)
            SELECT 'feed #' || i
            FROM generate_series(1, $1) AS i;`,
            [FEEDS]
        );
        await client.query(
            `INSERT INTO subscriptions(user_id, feed_id)
            SELECT i, j
            FROM generate_series(1, $1) AS i, generate_series(1, $2) AS j
            WHERE RANDOM() < $3;`,
            [USERS, FEEDS, USERS_SUBSCRIPTIONS / FEEDS]
        );
        await client.query(
            `INSERT INTO posts(feed_id, text, created_at)
            SELECT (i % $1) + 1, 'post #' || i, NOW() + ((i - $2 / 2) * INTERVAL '1 millisecond')
            FROM generate_series(1, $2) AS i;`,
            [FEEDS, FEEDS * FEEDS_POSTS]
        );
        await client.query(
            `INSERT INTO tags(tag)
            SELECT 'tag #' || i
            FROM generate_series(1, $1) AS i;`,
            [TAGS]
        );
        const INSERT_INTO_POST_TAGS = `
            INSERT INTO post_tags(post_id, tag_id)
            SELECT i, j
            FROM generate_series(1, $1) AS i, generate_series($2::INT, $3::INT) AS j
            WHERE RANDOM() < $4;
        `;
        await client.query(INSERT_INTO_POST_TAGS, [FEEDS * FEEDS_POSTS, 1, HOT_TAGS, 0.5]);
        await client.query(INSERT_INTO_POST_TAGS, [FEEDS * FEEDS_POSTS, HOT_TAGS + 1, TAGS, (TAGS_PER_POST - HOT_TAGS / 2) / TAGS]);
    } catch (error) {
        console.error(error);
        console.error('An error occurred while initializing DB');
    }
};

module.exports = { getClient, initDB };
