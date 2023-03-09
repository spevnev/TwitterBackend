const axios = require('axios');
const { PORT, FEEDS, TAGS_PER_POST, TAGS } = require('../config');
const { timeContinuously } = require('./utils');

let feed = 1;
timeContinuously(async () => {
    if (feed > FEEDS) {
        feed = 1;
        return 10000;
    }

    const tags = [];
    const tagsNumber = Math.random() * 2 * TAGS_PER_POST;
    for (let i = 0; i < tagsNumber; i++) tags.push(`tag #${Math.floor(Math.random() * TAGS) + 1}`);
    tags.push(`new tag #${Math.floor(Math.random() * 10000)}`);
    await axios.post(`http://localhost:${PORT}/post`, {
        feed: feed++,
        text: 'new post',
        tags
    });
});
