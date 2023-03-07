const { getClient } = require('./db');

const getTimeline = async (request, response) => {
    try {
        const { username } = request.query;
        if (!username) return response.sendStatus(400);

        const db = await getClient();
        const result = await db.query(
            `SELECT text, title FROM users u 
            INNER JOIN subscriptions s ON u.id = s.user_id 
            INNER JOIN feeds f ON s.feed_id = f.id 
            INNER JOIN posts p ON f.id = p.feed_id
            WHERE username = $1 ORDER BY created_at DESC LIMIT 20;`,
            [username]
        );
        response.json(result.rows);
    } catch (e) {
        response.sendStatus(500);
        console.error(e);
    }
};

const subscribeToFeed = async (request, response) => {
    try {
        const { username, feed } = request.query;
        if (!username || !feed) return response.sendStatus(400);

        const db = await getClient();
        await db.query(
            `WITH user AS (
                SELECT id FROM users WHERE username = $1::TEXT
            ), feed AS (
                SELECT id FROM feeds WHERE title = $2::TEXT
            ) INSERT INTO subscriptions(user_id, feed_id) VALUES (user, feed)
            WHERE (SELECT count(1) FROM subscriptions WHERE user_id = user.id AND feed_id = feed.id) = 0;`,
            [username, feed]
        );
        response.sendStatus(200);
    } catch (e) {
        response.sendStatus(500);
        console.error(e);
    }
};

const createPost = async (request, response) => {
    try {
        const { feed, text, tags } = request.body;
        if (!feed || !text || !tags) return response.sendStatus(400);

        const db = await getClient();
        const result = await db.query(`SELECT id FROM feeds WHERE title = $1;`, [feed]);
        if (result.rows.length != 1) return response.sendStatus(400);
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
            ) INSERT INTO post_tags(post_id, tag_id) 
            SELECT created_post.id, tags.id 
            FROM created_post, tags;`,
            [result.rows[0].id, text, tags]
        );
        response.sendStatus(200);
    } catch (e) {
        response.sendStatus(500);
        console.error(e);
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
    } catch (e) {
        response.sendStatus(500);
        console.error(e);
    }
};

const getHotTags = async (request, response) => {
    try {
        const db = await getClient();
        const result = await db.query(`
            SELECT tag, count(1) AS posts FROM tags t 
            INNER JOIN post_tags pt ON t.id = pt.tag_id 
            GROUP BY t.id, t.tag ORDER BY posts DESC LIMIT 10;
        `);
        response.json(result.rows.map(({ tag }) => tag));
    } catch (e) {
        response.sendStatus(500);
        console.error(e);
    }
};

module.exports = { getTimeline, subscribeToFeed, createPost, searchByTag, getHotTags };
