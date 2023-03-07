const axios = require('axios');
const { PORT, USERS } = require('../config');
const { timeContinuously } = require('./utils');

timeContinuously(async () => {
    const username = `user #${Math.floor(Math.random() * USERS) + 1}`;
    await axios.get(`http://localhost:${PORT}/timeline`, { params: { username } });
});
