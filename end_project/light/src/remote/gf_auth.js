const qs = require('querystring');
const _ = require('lodash');
const Boom = require('@hapi/boom');

const cache = require('../lib/cacher');
const API = require('../config').remote.portal;
const { axios } = require('./axios');

const parseRes = (body, res) => {
  const { status } = res;
  if (status === 200) {
    return body;
  }

  const msg = _.get(
    body,
    'error_description',
    'connect gf portal from remote fail',
  );
  throw new Boom.Boom(msg, {
    data: { code: _.get(body, 'error_code', status) },
    status,
  });
};

const addClientSecret = (payload) => {
  payload.client_id = API.clientId;
  payload.client_secret = API.clientSecret;
  return payload;
};

/**
 * node -pe 'require("./app/remote/portal").userBind({ tradeID: "027001016229" }).then(console.log)'
 *
 * @param {Object} payload
 * @param {string} payload.tradeID - user client id like 027001016229
 * @param {string} payload.portalID - user portal id like 1531304
 */
exports.userBind = async ({ tradeID, portalID }) => {
  if (!(portalID || tradeID)) {
    throw Boom.badRequest('missing input ids');
  }
  const opt = {
    url: API.host + API.userBind,
    qs: portalID ? { id: portalID } : { client_id: tradeID },
    transform: parseRes,
  };

  return axios.get(opt);
};

exports.internalUserInfo = async (portalID) => {
  const url = API.host + API.internalUserInfo;
  const opt = {
    params: addClientSecret({ id: portalID }),
    transform: parseRes,
  };

  const res = await axios.get(url, opt);
  return parseRes(res.body, res);
};

/**
 *
 * @param {Object} payload
 * @param {string} payload.userID - user login name
 * @param {string} payload.password - user login password
 * @param {string} payload.loginType - user login type, link portal, oa, trade
 * @param {string} [payload.ticket] - login ticket like `a8df`
 * @param {string} [payload.cookie] - use for ticket validate
 * @example
 * return {
 * "access_token": "0c826aab-8be5-48fb-8eba-8148b5d0145f",
 * "refresh_token": "8105cdf1-0284-4ea7-98f9-845951c89f92",
 * "ttl_date": "Tue Oct 09 15:57:35 CST 2018",
 * "cookie": "1926af2a-fd78-4ebd-9a18-c5b7ac0f660a",
 * "user_id":"061500019816",
 * "login_type":"trade",
 * "user_info":{
 * "total":1,
 * "error_info":"",
 * "data":[{
 * "last_login_time":"154736",
 * "error_info":"",
 * "square_flag":"2",
 * "session_no":"0",
 * "last_op_station": "WEB|IP:192.168.253.250,MAC:,HDD:",
 * "fund_account": "8213959",
 * "remark": " ",
 * "valid_flag": "1",
 * "bank_no": "f",
 * "exchange_type": "",
 * "last_op_ip": " ",
 * "client_id": "061500019816", "
 * sysnode_id":"2",
 * "last_date":"0",
 * "product_flag":"0",
 * "client_rights":"CEWeqdt +#",
 * "account_content":"061500019816",
 * "coaxios_risk_level":"5",
 * "online_time":"0",
 * "content_type":"0",
 * "last_op_entrust_way":"7",
 * "current_balance":"1.45",
 * "fundaccount_count":"1",
 * "user_token":"l2ZtbMXxG / WmNHZSHKvChv5u3OFKQKTFL2JhYGJhYA == ",
 * "money_count":"1",
 * "client_name":"莫兔频",
 * "enable_balance":"1.45",
 * "bank_trans_flag":" ",
 * "sys_status":"1",
 * "init_date":"20180919",
 * "login_times":"99",
 * "coaxios_end_date":"20190626",
 * "money_type":"0",
 * "coaxios_client_group":"1",
 * "last_login_date":"20180919",
 * "stock_account":"",
 * "error_no":"0",
 * "branch_no":"615",
 * "uft_sysnode_id":"0",
 * "message_flag":"0",
 * "foreign_flag":" ",
 * "company_name":"广发证券",
 * "prestore_info":" ",
 * "tabconfirm_flag":" ",
 * "asset_prop":"0",
 * "initpasswd_flag": " "}],
 * "success": true,
 * "error_no": 0},
 * "scope": "pc",
 * "portal_id": 0,
 * "expires_in": 1538207855160,
 * "client_id": "gfwealth"}
 */
exports.loginByPwd = async (payload) => {
  const url = API.host + API.loginByPwd;
  const data = {
    client_id: API.clientId,
    client_secret: API.clientSecret,
    redirect_uri: '/',
    response_type: 'token',
    login_type: payload.loginType,
    user_id: payload.userID,
    password: payload.password,
  };
  const opt = {};
  if (payload.ticket) {
    data.ticket = payload.ticket;
    opt.headers = {
      Cookie: payload.cookie,
    };
  }

  const res = await axios.post(url, qs.stringify(data), opt);
  return parseRes(res.data, res);
};

/**
 * sso token can only get token info not user info
 * @param {string} token - GF_OAUTH2_SSO show in cookie
 * @param {string} type - GF_OAUTH2_LOGINTYPE show in cookie
 * @example
 * return {
 *   "portal": {
 *     "phone": null,
 *     "sex": null,
 *     "user_type": "2",
 *     "last_login_date": "1484544968000",
 *     "profession": null,
 *     "service_name": "wyy1",
 *     "card_expire_date": null,
 *     "cs_id": 1000001624,
 *     "id": 1041146,
 *     "user_name": null,
 *     "create_date": "2016-01-04 16:30:23.0",
 *     "card_type": null,
 *     "address": null,
 *     "email": null,
 *     "reg_flag": "1",
 *     "real_name": null,
 *     "card": null,
 *     "client_id": null,
 *     "login_count": 4682,
 *     "mobile": "18503082118",
 *     "invest_id": 0
 *   }
 * }
 */
exports.getUserInfoBySSO = (token) => exports
  .getToken(token)
  .then((body) => body.access_token)
  .then(exports.getUserInfo);

exports.getUserInfoByPwd = (playload) => exports
  .loginByPwd(playload)
  .then((body) => body.access_token)
  .then(exports.getUserInfo);

/**
 * get user token info from gf portal
 * @param {string} token - GF_OAUTH2_SSO show in cookie
 * @return {Promise.<Object>} user token info
 * @example
 * return {
 *   "cookie": "5bb7edd4-9da6-4a1c-98ab-47c238e16412",
 *   "scope": null,
 *   "portal_id": 1041146,
 *   "ttl_date": "Sun Feb 05 13:42:24 CST 2017",
 *   "expires_in": 1485409344785,
 *   "user_id": "18503082117",
 *   "refresh_token": "0fd2c101-ff69-471c-90a1-930395e78331",
 *   "client_id": "gfwealth",
 *   "access_token": "bc30e6c0-36d6-4bf2-9fb9-3f5d424c10f5",
 *   "login_type": "portal"
 * }
 */
exports.getToken = async (token, grantType = 'cookie') => {
  const url = API.host + API.getToken;

  const params = {
    client_id: API.clientId,
    client_secret: API.clientSecret,
    redirect_uri: '/',
    grant_type: grantType,
    code: token,
  };

  const res = await axios.get(url, { params });
  return parseRes(res.data, res);
};

exports.getTokenCache = async (token, grantType) => cache.get({
  key: `gfauth,sso,${token}`,
  expire: 3600,
  executor: async () => exports.getToken(token, grantType),
});

/**
 * get user info by access_token from gf portal
 * @param {string} token - gf portal access token
 * @return {Promise.<Object>} user info by user login type
 * @example
 * type oa return {
 *   "portal": {
 *     "phone": null,
 *     "sex": null,
 *     "user_type": "2",
 *     "last_login_date": "1484544968000",
 *     "profession": null,
 *     "service_name": "wyy1",
 *     "card_expire_date": null,
 *     "cs_id": 1000001624,
 *     "id": 1041146,
 *     "user_name": null,
 *     "create_date": "2016-01-04 16:30:23.0",
 *     "card_type": null,
 *     "address": null,
 *     "email": null,
 *     "reg_flag": "1",
 *     "real_name": null,
 *     "card": null,
 *     "client_id": null,
 *     "login_count": 4682,
 *     "mobile": "18503082118",
 *     "invest_id": 0
 *   }
 * }
 *
 * type trade return {
 *
 * {
 *   hs_trade:
 *   {
 *     total: 1,
 *     error_info: '',
 *     data: [{
 *       last_login_time: '102424',
 *       error_info: '',
 *       square_flag: '2',
 *       session_no: '0',
 *       last_op_station: 'WEB|IP:192.168.253.88,MAC:,HDD:',
 *       fund_account: '8213959',
 *       remark: ' ',
 *       valid_flag: '1',
 *       bank_no: 'f',
 *       exchange_type: '',
 *       last_op_ip: ' ',
 *       client_id: '061500019816',
 *       sysnode_id: '2',
 *       last_date: '0',
 *       product_flag: '0',
 *       client_rights: 'CEWeqdt+#',
 *       account_content: '061500019816',
 *       coaxios_risk_level: '5',
 *       online_time: '0',
 *       content_type: '0',
 *       last_op_entrust_way: '7',
 *       current_balance: '1.45',
 *       fundaccount_count: '1',
 *       user_token: '+RiKOhBsblSmNHZSHKvChv5u3OFKQKTFL2JhYGJhYA==',
 *       money_count: '1',
 *       client_name: '莫兔频',
 *       enable_balance: '1.45',
 *       bank_trans_flag: ' ',
 *       sys_status: '1',
 *       init_date: '20180920',
 *       login_times: '113',
 *       coaxios_end_date: '20190626',
 *       money_type: '0',
 *       coaxios_client_group: '1',
 *       last_login_date: '20180920',
 *       stock_account: '',
 *       error_no: '0',
 *       branch_no: '615',
 *       uft_sysnode_id: '0',
 *       message_flag: '0',
 *       foreign_flag: ' ',
 *       company_name: '广发证券',
 *       prestore_info: ' ',
 *       tabconfirm_flag: ' ',
 *       asset_prop: '0',
 *       initpasswd_flag: ' '
 *     }],
 *   success: true,
 *   error_no: 0 } }
 * }
 */
exports.getUserInfo = async (token) => {
  const url = API.host + API.getUserInfo;
  const params = { access_token: token };

  const res = await axios.get(url, {
    params,
  });
  return parseRes(res.data, res);
};

exports.getUserInfoCache = async (token) => cache.get({
  key: `gfauth,accesstoken,${token}`,
  expire: 1800,
  executor: async () => exports.getUserInfo(token),
});

/**
 * get token info
 * @param {string} token - clickeggsToken show in cookie
 * @return Object
 * @example {
 *  "access_token": "03f9eb83-37ff-459e-81e2-395ac2345399",
 *  "refresh_token": "3bfd3a53-3ab6-45f8-ada4-4da5de147435",
 *  "ttl_date": "Wed Jun 06 14:18:39 CST 2018",
 *  "cookie": "62367f58-7bbf-4a8b-b2f5-56d0c3c613bc",
 *  "login_type": "oa",
 *  "user_id": "xule",
 *  "scope": "pc",
 *  "portal_id": 1040233,
 *  "expires_in": 1527401919447,
 *  "client_id": "clickeggs"
 * }
 */
exports.getTokenInfoByAccessToken = async (token) => {
  const url = API.host + API.getTokenInfo;

  const res = await axios.get(url, { params: { access_token: token } });
  return parseRes(res.data, res);
};
