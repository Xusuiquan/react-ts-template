const fp = require('fastify-plugin');
const _ = require('lodash');

const register = fp((fastify, opts, next) => {
  fastify.addHook('onRequest', (request, reply, done) => {
    if (request.cookies) {
      request.cookies = _.mapKeys(request.cookies, (val, key) => _.toLower(key));
    }
    done();
  });
  next();
});

module.exports = register;
