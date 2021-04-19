const gfAuth = require('./controller/remote/gf_auth');
const { definitions } = require('./plugins/share_schema');
const assign = require('./controller/sleep');
const op = require('./controller/op');

const getArgs = (controller, handler) => {
  const { schema } = controller.opts[handler];
  ['headers', 'querystring', 'body', 'params'].forEach((key) => {
    if (schema[key] && schema[key].type === 'object') {
      Object.assign(schema[key], { definitions });
    }
  });
  if (schema.response) {
    Object.keys(schema.response).forEach((statusCode) => {
      if (Number.isInteger(Number(statusCode))) {
        Object.assign(schema.response[statusCode], { definitions });
      }
    });
  }

  return [controller.opts[handler], controller[handler]];
};

module.exports = async (fastify) => {
  fastify.get('/healthz', async () => 'ok');

  // gf auth
  fastify.post(
    '/auth/reset_access_token_by_sso',
    ...getArgs(gfAuth, 'resetAccessTokenBySso'),
  );
  fastify.get('/auth/user_info', ...getArgs(gfAuth, 'getUserInfo'));
  fastify.get('/auth/oa_user_info', ...getArgs(gfAuth, 'getOaUserInfo'));
  // 易淘金下面，有 sso 可以读取
  fastify.get(
    '/auth/portal_user_info',
    ...getArgs(gfAuth, 'getPortalUserInfo'),
  );
  // 易淘金下面，用交易账号数据，在网店登录会有 ttoken，在直播登录，会有 gf_oauth2_token
  fastify.get('/auth/trade_user_info', ...getArgs(gfAuth, 'getTradeUserInfo'));

  fastify.post('/sleep/query_assign', ...getArgs(assign, 'queryAssign'));
  fastify.post('/sleep/add_assign', ...getArgs(assign, 'addAssign'));

  fastify.post('/sleep/query_op', ...getArgs(op, 'queryOP'));
};
