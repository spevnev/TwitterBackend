const express = require('express');
const { PORT } = require('../config');
const { initDB } = require('./db');
const { getTimeline, subscribeToFeed, createPost, searchByTag, getHotTags } = require('./main');

const app = express();
app.use(express.json());

app.get('/timeline', getTimeline);
app.get('/subscribe', subscribeToFeed);
app.post('/post', createPost);
app.get('/tag', searchByTag);
app.get('/hot', getHotTags);

initDB().then(() => app.listen(PORT, () => console.log(`Listening on port ${PORT}.`)));