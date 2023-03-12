const { getClient } = require('./db');

const getTimeline = async (request, response) => {
    try {
        const { userId } = request.query;
        if (!userId) return response.sendStatus(400);

        const db = await getClient();
        const result = await db.query(
            `SELECT text, title FROM (SELECT *, UNNEST(feeds) AS feed_id FROM users) u
            INNER JOIN feeds f ON u.feed_id = f.id
            INNER JOIN posts p ON f.id = p.feed_id
            WHERE u.id = $1 ORDER BY created_at DESC LIMIT 20;`,
            [userId]
        );
        response.json(result.rows);
    } catch (error) {
        response.sendStatus(500);
        console.error(error);
    }
};

const createPost = async (request, response) => {
    try {
        const { feedId, text, tags } = request.body;
        if (!feedId || !text || !tags) return response.sendStatus(400);

        const db = await getClient();
        await db.query(`INSERT INTO posts(feed_id, text, tags) VALUES ($1, $2, $3);`, [feedId, text, tags]);
        response.sendStatus(200);
    } catch (error) {
        response.sendStatus(500);
        console.error(error);
    }
};

const searchByTag = async (request, response) => {
    try {
        const { tag } = request.query;
        if (!tag) return response.sendStatus(400);

        const db = await getClient();
        const result = await db.query(
            `SELECT title, text FROM (
                SELECT * FROM posts
                WHERE tags @> $1
            ) p
            INNER JOIN feeds f ON p.feed_id = f.id
            ORDER BY created_at DESC LIMIT 100;`,
            [[tag]]
        );
        response.json(result.rows);
    } catch (error) {
        response.sendStatus(500);
        console.error(error);
    }
};

const getHotTags = async (request, response) => {
    try {
        const db = await getClient();
        const result = await db.query(`
            WITH latest_tags AS (
                SELECT id, UNNEST(tags) AS tag FROM posts
                ORDER BY created_at DESC
                LIMIT 1000
            )
            SELECT tag, count(1) AS posts FROM latest_tags
            GROUP BY tag
            ORDER BY posts DESC
            LIMIT 10;
        `);
        response.json(result.rows.map(({ tag }) => tag));
    } catch (error) {
        response.sendStatus(500);
        console.error(error);
    }
};

module.exports = { getTimeline, createPost, searchByTag, getHotTags };
