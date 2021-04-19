const _ = require('lodash');
const fp = require('fastify-plugin');
const Boom = require('@hapi/boom');

const gfAuth = require('../remote/gf_auth');
const { const: C } = require('../config');

const tryAccessToken = async (accessToken) => {
  if (!accessToken) {
    return undefined;
  }

  try {
    const userInfo = await gfAuth.getUserInfoCache(accessToken);
    return userInfo;
  } catch (e) {
    // {"error_no":-400,"error_code":12029,"error":"invalid_grant","error_description":"提供的令牌已经过期"}
    // 过期的token，就留给 sso 去处理
    if (_.get(e, 'data.code') === 12029) {
      return undefined;
    }

    throw e;
  }
};

const trySso = async (sso) => {
  if (!sso) {
    return undefined;
  }

  // hard code for internal project
  const tokenInfo = await gfAuth.getTokenCache(sso);
  const userInfo = await gfAuth.getUserInfoCache(tokenInfo.access_token);
  return { tokenInfo, userInfo };
};

const getAccessToken = (headers, cookies) => {
  const accessToken = _.get(
    headers,
    C.cookie.sso.tokenKey,
    _.get(cookies, C.cookie.sso.tokenKey),
  );
  return accessToken;
};

// http://wiki.gf.com.cn/pages/viewpage.action?pageId=70214390
const gfAuthMW = (fastify, opts, next) => {
  fastify.decorateRequest('userInfo', undefined);
  fastify.decorateRequest('tokenInfo', undefined);
  // seperate different user type
  fastify.decorateRequest('oaUserInfo', undefined);
  fastify.decorateRequest('oaId', undefined);
  fastify.decorateRequest('oaName', undefined);
  fastify.decorateRequest('portalUserInfo', undefined);
  fastify.decorateRequest('portalId', undefined);
  fastify.decorateRequest('portalName', undefined);
  fastify.decorateRequest('tradeUserInfo', undefined);
  fastify.decorateRequest('tradeId', undefined);
  fastify.decorateRequest('tradeName', undefined);

  fastify.decorateRequest('getUserInfoCalled', false);
  fastify.decorateRequest('getUserInfo', async function gui({ strict = true }) {
    if (this.userInfo || this.getUserInfoCalled) {
      return this.userInfo;
    }

    const accessToken = getAccessToken(this.headers, this.cookies);
    const tokenUserInfo = await tryAccessToken(accessToken);
    if (!_.isEmpty(tokenUserInfo)) {
      this.userInfo = tokenUserInfo;
      if (tokenUserInfo.oa) {
        this.getUserInfoCalled = true;
        return this.userInfo;
      }
    }

    const portalUserInfo = await tryAccessToken(
      this.cookies[C.cookie.portal.key],
    );
    if (!_.isEmpty(portalUserInfo)) {
      this.userInfo = { ...this.userInfo, ...portalUserInfo };
      this.portalUserInfo = portalUserInfo;
    }

    const tradeUserInfo = await tryAccessToken(
      this.cookies[C.cookie.trade.key],
    );
    if (!_.isEmpty(tradeUserInfo)) {
      this.userInfo = {
        ...this.userInfo,
        // ignore trade user binded portal info
        ..._.pick(tradeUserInfo, ['hs_trade']),
      };
      this.tradeUserInfo = tradeUserInfo;
    }

    const loginType = this.cookies[C.cookie.sso.typeKey];
    if (
      (this.tradeUserInfo && this.portalUserInfo)
      || (loginType && this[`${loginType}UserInfo`])
    ) {
      this.getUserInfoCalled = true;
      return this.userInfo;
    }

    const isSuccess = await this.trySso();
    if (isSuccess) {
      return this.userInfo;
    }

    if (!_.isEmpty(this.userInfo)) {
      this.getUserInfoCalled = true;
      return this.userInfo;
    }

    if (strict) {
      throw Boom.unauthorized('TOKEN_NOT_FOUND');
    }

    this.getUserInfoCalled = true;
    return undefined;
  });

  fastify.decorateRequest('trySso', async function ts() {
    const sso = _.get(
      this.headers,
      C.cookie.sso.ssoKey,
      _.get(this.cookies, C.cookie.sso.ssoKey),
    );
    const ssoData = await trySso(sso);
    if (_.isEmpty(ssoData)) {
      return false;
    }

    const { userInfo: ssoUserInfo, tokenInfo } = ssoData;
    this.userInfo = { ...this.userInfo, ...ssoUserInfo };
    this.tokenInfo = tokenInfo;
    this.getUserInfoCalled = true;
    return true;
  });

  fastify.addHook('onSend', async (req, rep) => {
    const { tokenInfo } = req;
    if (!tokenInfo) {
      return;
    }

    const { login_type: type, access_token: token, ttl_date: ttl } = tokenInfo;
    if (C.cookie.loginTypes.includes(type)) {
      rep.setCookie(C.cookie[type].key, token, {
        ...C.cookie[type].opt,
        expires: new Date(ttl),
      });
    }
  });

  next();
};

const checkUser = async (req) => {
  await req.getUserInfo();
};

const checkOaUser = async (req) => {
  const userInfo = await req.getUserInfo({});
  req.oaId = _.get(userInfo, 'oa.uid');
  if (!req.oaId) {
    throw Boom.forbidden('NOT_OA_ID');
  }

  req.oaName = _.get(userInfo, 'oa.cn');
  req.oaUserInfo = userInfo.oa;
};

const checkPortalUser = async (req, rep) => {
  const strict = rep.context.config.portalStrict;
  try {
    const userInfo = await req.getUserInfo({ strict });
    req.portalId = _.get(userInfo, 'portal.id');
    if (!req.portalId) {
      if (strict) {
        throw Boom.forbidden('NOT_PORTAL_ID');
      }
      return;
    }

    req.portalName = _.get(userInfo, 'portal.service_name');
    req.portalUserInfo = userInfo.portal;
  } catch (e) {
    if (strict !== false) {
      throw e;
    }
  }
};

const checkTradeUser = async (req, rep) => {
  const strict = rep.context.config.tradeStrict;
  try {
    const userInfo = await req.getUserInfo({ strict });
    req.tradeId = _.get(userInfo, 'hs_trade.data.0.client_id');
    if (!req.tradeId) {
      if (strict) {
        throw Boom.forbidden('NOT_TRADE_ID');
      }
      return;
    }

    req.tradeName = _.get(userInfo, 'hs_trade.data.0.client_name');
    // eslint-disable-next-line prefer-destructuring
    req.tradeUserInfo = userInfo.hs_trade.data[0];
  } catch (e) {
    if (strict !== false) {
      throw e;
    }
  }
};

const plugin = fp(gfAuthMW);

module.exports = {
  plugin,
  checkUser,
  checkOaUser,
  checkPortalUser,
  checkTradeUser,
};
