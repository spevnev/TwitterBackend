const axios = require('axios');
const { PORT, FEEDS, TAGS_PER_POST, TAGS } = require('../config');
const { timeContinuously, sleep } = require('./utils');

timeContinuously(async () => {
    for (let feed = 1; feed <= FEEDS; feed++) {
        const tags = [];
        const tagsNumber = Math.random() * 2 * TAGS_PER_POST;
        for (let i = 0; i < tagsNumber; i++) tags.push(`tag #${Math.floor(Math.random() * TAGS) + 1}`);
        await axios.post(`http://localhost:${PORT}/post`, {
            feed: `feed #${feed}`,
            text: 'new post',
            tags
        });
    }
    await sleep(9500);
});
