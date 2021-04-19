const Knex = require('knex');
const config = require('../config');
const logger = require('./logger');

const knex = Knex({
  client: 'oracledb',
  connection: {
    ...config.oracledb,
  },
});

process.on('SIGINT', async () => {
  logger.info('process exist, destroy connection');
  await knex.destroy();
  process.exit(0);
});

module.exports = { knex };
