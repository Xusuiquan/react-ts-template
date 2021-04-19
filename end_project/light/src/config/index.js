const _ = require('lodash');
const envConfig = require('ding-env-config');

const defaultConf = require('./default');

const nodeEnv = process.env.NODE_ENV || 'local';
// @ts-ignore
const nodeEnvConf = module.require(`./${nodeEnv}`);
const config = envConfig({ config: nodeEnvConf });

module.exports = _.defaultsDeep(config, defaultConf);
