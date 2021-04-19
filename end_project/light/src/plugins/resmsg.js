/* eslint-disable no-param-reassign */
const fp = require('fastify-plugin');
const resMsg = require('ding-res-msg');
const _ = require('lodash');

/**
 * @param {Object} error
 * @param {boolean=} error.isBoom
 * @param {Object=} error.output
 * @param {Array=} error.validation
 */
const getStatusCode = (error) => {
  let status;
  if (error.isBoom) {
    status = error.output.statusCode;
  } else if (Array.isArray(error.validation)) {
    // ajv request param validation faild
    status = 400;
  } else {
    const statusKey = ['status', 'code', 'statusCode'].find(_.isNumber);
    status = error[statusKey];
  }

  const isOutRange = status === undefined || status > 600 || status < 200;

  return isOutRange === true ? 500 : status;
};

const resmsg = (fastify, opts, next) => {
  fastify.decorateReply('resmsg', function replyresmsg(data) {
    this.send(resMsg({ data }));
  });
  fastify.setErrorHandler((error, request, reply) => {
    const code = getStatusCode(error);
    reply.code(code);
    error.code = error.isBoom && _.get(error, 'data.code', code);

    reply.send(resMsg({ error }));
  });
  next();
};

module.exports = fp(resmsg);
