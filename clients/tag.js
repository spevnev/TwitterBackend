const axios = require('axios');
const { TAGS, PORT } = require('../config');
const { timeContinuously } = require('./utils');

timeContinuously(async () => {
    const tag = `tag #${Math.floor(Math.random() * TAGS) + 1}`;
    await axios.get(`http://localhost:${PORT}/tag`, { params: { tag } });
});
