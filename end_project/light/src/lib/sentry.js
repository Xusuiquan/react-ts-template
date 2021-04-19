const Sentry = require('@sentry/node');
const config = require('../config');

Sentry.init(config.sentry);

module.exports = Sentry;
