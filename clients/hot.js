const axios = require('axios');
const { PORT } = require('../config');
const { timeContinuously } = require('./utils');

timeContinuously(async () => {
    await axios.get(`http://localhost:${PORT}/hot`);
});
