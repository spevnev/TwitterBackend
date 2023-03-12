const axios = require('axios');
const { PORT, FEEDS, TAGS_PER_POST, TAGS, HOT_TAGS } = require('../config');
const { timeContinuously } = require('./utils');

let feed = 1;
timeContinuously(async () => {
    if (feed > FEEDS) {
        feed = 1;
        return 10000;
    }

    const tags = [];
    for (let i = 0; i < HOT_TAGS; i++) if (Math.random() < 0.5) tags.push(`t${i + 1}`);
    for (let i = 0; i < Math.random() * TAGS_PER_POST; i++) tags.push(`t${Math.floor(Math.random() * TAGS) + 1}`);
    tags.push(`new t${Math.floor(Math.random() * 10000)}`);
    await axios.post(`http://localhost:${PORT}/post`, {
        feedId: feed++,
        text: 'new post',
        tags
    });
});
