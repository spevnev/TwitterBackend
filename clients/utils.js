const timeContinuously = async callback => {
    try {
        let sum = 0;
        let i = 0;
        while (1) {
            const t = Date.now();
            await callback();
            const cur = Date.now() - t;
            sum += cur;
            i++;
            console.log(`Current: ${cur}ms, average: ${sum / i}ms`);
        }
    } catch (e) {
        console.error(e);
    }
};

const sleep = ms => new Promise(res => setTimeout(() => res(null), ms));

module.exports = { timeContinuously, sleep };
