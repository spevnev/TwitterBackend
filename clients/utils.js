const timeContinuously = async callback => {
    try {
        let sum = 0;
        let i = 0;
        while (1) {
            const t = Date.now();
            const sleepFor = await callback();
            const cur = Date.now() - t;
            sum += cur;
            i++;
            console.log(`Current: ${cur}ms, average: ${sum / i}ms`);
            if (sleepFor) await sleep(sleepFor);
        }
    } catch (error) {
        console.error(error);
    }
};

const sleep = ms => new Promise(res => setTimeout(() => res(null), ms));

module.exports = { timeContinuously };
