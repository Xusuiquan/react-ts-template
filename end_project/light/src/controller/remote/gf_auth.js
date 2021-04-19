const {
  checkOaUser,
  checkPortalUser,
  checkTradeUser,
} = require('../../plugins/gf_auth');

const opts = {
  getTradeUserInfo: {
    preValidation: [checkTradeUser],
    schema: {
      summary: '获取广发通登录态的用户信息',
      tags: ['auth'],
      headers: {
        type: 'object',
        properties: {
          token: 'gf_oauth2_token#',
          gf_oauth2_sso: {
            $ref: '#/definitions/gf_oauth2_sso',
          },
        },
      },
    },
  },
  getPortalUserInfo: {
    preValidation: [checkPortalUser],
    schema: {
      summary: '获取广发通登录态的用户信息',
      tags: ['auth'],
      headers: {
        type: 'object',
        properties: {
          token: 'gf_oauth2_token#',
          gf_oauth2_sso: {
            $ref: '#/definitions/gf_oauth2_sso',
          },
        },
      },
    },
  },
  getOaUserInfo: {
    preValidation: [checkOaUser],
    schema: {
      summary: '获取广发通登录态的用户信息',
      tags: ['auth'],
      headers: {
        gf_oauth2_token: 'gf_oauth2_token#',
      },
    },
  },
  getUserInfo: {
    schema: {
      summary: '获取广发通登录态的用户信息',
      tags: ['auth'],
      headers: {
        gf_oauth2_token: 'gf_oauth2_token#',
        gf_oauth2_sso: {
          type: 'string',
          description: 'cookie, 登录态的 sso',
        },
      },
    },
  },
  resetAccessTokenBySso: {
    schema: {
      summary:
        '用 sso 重置 access_token 信息，具体是那种登录态的token，就看过来的 sso 对应的 login type 是啥',
      tags: ['auth'],
      headers: {
        gf_oauth2_sso: {
          type: 'string',
          description: 'cookie, 登录态的 sso',
        },
      },
    },
  },
};

const resetAccessTokenBySso = async (request, reply) => {
  await request.trySso();
  reply.resmsg(request.userInfo);
};

const getUserInfo = async (request, reply) => {
  const userInfo = await request.getUserInfo({});
  reply.resmsg(userInfo);
};

const getOaUserInfo = async (request, reply) => {
  const userInfo = request.oaUserInfo;
  reply.resmsg(userInfo);
};

const getPortalUserInfo = async (request, reply) => {
  const userInfo = request.portalUserInfo;
  reply.resmsg(userInfo);
};

const getTradeUserInfo = async (request, reply) => {
  const userInfo = request.tradeUserInfo;
  reply.resmsg(userInfo);
};

module.exports = {
  opts,
  resetAccessTokenBySso,
  getUserInfo,
  getOaUserInfo,
  getPortalUserInfo,
  getTradeUserInfo,
};
