const mongoose = require('mongoose');

mongoose.Promise = Promise;

const config = require('../config').mongoose;
const logger = require('./logger');

/**
 * @typedef {Object} mongodbs
 * @property {mongoose.Connection} testDB
 */

const createDb = (payload) => {
  const dbName = payload.database + (/ci/.test(process.env.NODE_ENV) ? 'ci' : '');
  const uri = payload.uri || `mongodb://${payload.hosts.join(',')}/${dbName}`;
  logger.info(`mongoose connection uri: ${uri}`);

  const db = mongoose.createConnection(uri, payload.options);
  const retry = (err) => {
    logger.error(`mongoose connection error: ${err}, retry after 5s`);
    return setTimeout(() => db.openUri(uri), 5000);
  };
  db.on('connected', () => logger.info('mongoose connected'));
  db.on('error', retry);
  db.on('disconnect', retry.bind(retry, 'disconnect'));

  return db;
};

/** @type {mongodbs} */
const dbs = new Proxy(
  {},
  {
    get(target, dbName) {
      if (dbName in target) {
        return target[dbName];
      }
      if (typeof dbName !== 'string') {
        return undefined;
      }

      const validDBName = dbName.endsWith('DB') && dbName in config;
      if (!validDBName) {
        return logger.error(`invalid ${dbName} to get db`);
      }

      const payload = config[dbName];
      payload.options = { ...config.options, ...payload.options };
      target[dbName] = createDb(payload);
      return target[dbName];
    },
  },
);

module.exports = dbs;
