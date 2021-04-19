const pino = require('pino');

const logger = pino({ useLevelLabels: true });

module.exports = logger;
