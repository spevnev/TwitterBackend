const { getClient } = require('./db');

const getTimeline = async (request, response) => {
    try {
        const { userId } = request.query;
        if (!userId) return response.sendStatus(400);

        const db = await getClient();
        const result = await db.query(
            `SELECT text, title FROM subscriptions s
            INNER JOIN feeds f ON s.feed_id = f.id
            INNER JOIN posts p ON f.id = p.feed_id
            WHERE s.user_id = $1 ORDER BY created_at DESC LIMIT 20;`,
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
        await db.query(
            `INSERT INTO tags(tag)
            SELECT UNNEST($1::TEXT[])
            ON CONFLICT DO NOTHING;`,
            [tags]
        );
        await db.query(
            `WITH created_post AS (
                INSERT INTO posts(feed_id, text)
                VALUES ($1, $2) RETURNING id
            ), tags AS (
                SELECT id FROM tags WHERE tag = ANY($3::TEXT[])
            )
            INSERT INTO post_tags(post_id, tag_id)
            SELECT created_post.id, tags.id
            FROM created_post, tags;`,
            [feedId, text, tags]
        );
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
            `SELECT text FROM posts p
            INNER JOIN post_tags pt ON p.id = pt.post_id
            WHERE pt.tag_id = (SELECT id FROM tags WHERE tag = $1::TEXT)
            ORDER BY created_at DESC LIMIT 100;`,
            [tag]
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
            WITH latest_posts AS (
                SELECT id FROM posts
                ORDER BY created_at DESC
                LIMIT 1000
            )
            SELECT tag, count(1) AS posts FROM latest_posts lp
            INNER JOIN post_tags pt ON lp.id = pt.post_id
            INNER JOIN tags t ON pt.tag_id = t.id
            GROUP BY t.id, tag
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
