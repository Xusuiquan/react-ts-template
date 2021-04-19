const Cacher = require('interface-cacher');
const config = require('../config');

const cacher = new Cacher(config.cacher);
module.exports = cacher;
