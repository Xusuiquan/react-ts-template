const Boom = require('@hapi/boom');
const _ = require('lodash');

const { axios } = require('./axios');

const { IAMAuth: API } = require('../config').remote;

/**
 * @param {import('axios').AxiosResponse} res
 */
const parseRes = (body, res) => {
  const { status } = res;
  if (status === 200) {
    return body;
  }

  const msg = _.get(
    body,
    'error_description',
    'connect gf iam from remote fail',
  );
  throw new Boom.Boom(msg, {
    data: { code: _.get(body, 'error_code', status) },
    status,
  });
};

const getIAMAuth = async (payload) => {
  const {
    userOaId, action, currentRole,
  } = payload;

  const opt = {
    method: 'get',
    url: API.host + API.getIAMAuth,
    params: {
      ...API.eagleQuery,
      action,
      userOaId,
      currentGroupId: currentRole,
    },
  };

  const res = await axios(opt);
  return parseRes(res.data, res).data;
};

module.exports = {
  getIAMAuth,
};
