/* eslint-disable no-console */
const { nanoid } = require('nanoid');
const _ = require('lodash');
const Axios = require('axios');
const logger = require('../lib/logger');

// @ts-ignore
const axios = Axios.create({
  validateStatus: () => true,
});

// request logs
axios.interceptors.request.use((config) => {
  config.id = nanoid();
  logger.info(_.pick(config, ['id', 'baseURL', 'url', 'params']));
  return config;
});
axios.interceptors.response.use((res) => {
  logger.info(_.pick(res, ['config.id', 'status', 'headers', 'data']));
  return res;
});

module.exports = { axios };
