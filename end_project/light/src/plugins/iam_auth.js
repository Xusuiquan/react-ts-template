const fp = require('fastify-plugin');
const _ = require('lodash');
const Boom = require('@hapi/boom');
const config = require('../config').iamConfig;
const iamAuth = require('../remote/iam_auth');

/*
{"x_loginType":"oa","x_loginId":"a123456","x_action":"pullUser"}
*/
/*
%7b%22x_loginType%22%3a%22oa%22
%2c%22x_loginId%22%3a%22a123456%22%2c%22x_action%22%3a%22pullUser%22%7d
 */

const IAMUserMW = async (fastify, opts, next) => {
  fastify.decorateRequest('IAMUserInfo', undefined);
  fastify.decorateRequest('xOaId', undefined);
  fastify.decorateRequest('erpId', undefined);
  fastify.decorateRequest('dpId', undefined);
  fastify.decorateRequest('newno', undefined);
  fastify.decorateRequest('parentno', undefined);
  fastify.decorateRequest('oatoken', undefined);
  fastify.decorateRequest('action', undefined);
  fastify.decorateRequest('hasChecked', undefined);
  fastify.decorateRequest('project', undefined);
  fastify.decorateRequest('currentRole', undefined);// 可选，部分业务使用单一角色校验权限
  fastify.decorateRequest('isAllowed', undefined);
  fastify.decorateRequest('resource', undefined);
  fastify.decorateRequest('oaname', undefined);

  fastify.decorateRequest('getIAMUserInfo', function gui({ strict = true }) {
    if (this.IAMUserInfo) {
      return this.IAMUserInfo;
    }

    const xOaId = this.headers['x-oaid'];
    const xErpId = this.headers['x-erpid'];
    const xDpId = this.headers['x-dpid'];
    const xNewno = this.headers['x-newno'];
    const xParentno = this.headers['x-parentno'];
    const xOaName = this.headers['x-oaname'];
    const xOatoken = this.headers['x-oatoken'];
    const xProject = this.headers.project;
    const xCurrentRole = this.headers.currentgroupid;

    if ((xErpId === null || xErpId === undefined) && strict === true) {
      throw Boom.internal('HEADER_OAID_NOT_FOUND_404');
    }

    return {
      xOaId, xErpId, xDpId, xNewno, xParentno, xOatoken, xProject, xCurrentRole, xOaName,
    };
  });

  next();
};

const checkIAMUserAuthority = async (req) => {
  if (req.hasChecked !== true) {
    throw Boom.forbidden('IAM_CHECK_STATE_ERR');
  }

  const authResult = await iamAuth.getIAMAuth(
    {
      userOaId: req.erpId, action: req.action, project: req.project, currentRole: req.currentRole,
    },
  );

  return authResult;
};

const parseAction = (req) => {
  const { originalUrl } = req.req;
  const origAction = _.split(originalUrl.substr(1), '?', 1)[0];
  const result = (!req.project) ? `${config.productName}:${origAction}` : (`${req.project}:${origAction}`);
  return result;
};

const getCommonHeaderAndAcl = async (req, rep) => {
  const strict = rep.context.config.IAMStrict;

  const {
    xOaId: oaId,
    xErpId: erpId,
    xDpId: dpId,
    xNewno: newNo,
    xParentno: parentNo,
    xOatoken: oatoken,
    xProject: project,
    xCurrentRole: currentRole,
    xOaName: oaName,
  } = await req.getIAMUserInfo({ strict });

  if (!erpId) {
    throw Boom.forbidden('NOT_FOUND_OA_ID');
  }

  req.action = parseAction(req);
  req.xOaId = oaId;
  req.dpId = dpId;
  req.erpId = erpId;
  req.newno = newNo;
  req.parentno = parentNo;
  req.oatoken = oatoken;
  req.hasChecked = true;
  req.currentRole = currentRole;
  req.project = project;
  req.oaName = oaName;

  if (config.SkipIAMAuth) {
    req.isAllowed = true;
    req.resource = '*';
    return;
  }

  const {
    isAllowed, resource,
  } = await checkIAMUserAuthority(req);
  if (resource.length === 1 && resource[0] === '*') {
    req.resource = '*';
  } else {
    req.resource = resource.filter((element) => element.split(':')[2] === 'sjqx');
  }

  req.isAllowed = isAllowed;
};

const checkIAMUser = async (req, rep) => {
  const strict = rep.context.config.IAMStrict;

  const {
    xOaId: oaId,
    xErpId: erpId,
    xDpId: dpId,
    xNewno: newNo,
    xParentno: parentNo,
    xOatoken: oatoken,
    xProject: project,
    xCurrentRole: currentRole,
    xOaName: oaName,
  } = await req.getIAMUserInfo({ strict });

  if (!erpId) {
    throw Boom.forbidden('NOT_FOUND_OA_ID');
  }

  req.action = parseAction(req);
  req.xOaId = oaId;
  req.dpId = dpId;
  req.erpId = erpId;
  req.newno = newNo;
  req.parentno = parentNo;
  req.oatoken = oatoken;
  req.hasChecked = true;
  req.currentRole = currentRole;
  req.project = project;
  req.oaName = oaName;

  if (config.SkipIAMAuth) {
    req.isAllowed = true;
    req.resource = '*';
    return;
  }

  const {
    isAllowed, resource,
  } = await checkIAMUserAuthority(req);
  if (resource.length === 1 && resource[0] === '*') {
    req.resource = '*';
  } else {
    req.resource = resource.filter((element) => element.split(':')[2] === 'sjqx');
  }

  req.isAllowed = isAllowed;

  if (!req.isAllowed) {
    throw Boom.forbidden('NOT_ALLOW_ACTION ');
  }
};

const plugin = fp(IAMUserMW);

module.exports = {
  plugin,
  checkIAMUser,
  getCommonHeaderAndAcl,
};
