const fp = require('fastify-plugin');
const S = require('fluent-json-schema').default;

const fluentSchemas = {
  query_where_array: S.array()
    .items(S.array())
    .raw({ example: [['METRIC_CODE', '=', 'shichangtiaojiexishunyi']] })
    .description(
      '过滤条件，一个二维数组。\n子数组第一个元素是字段名，第二个是操作符，第三个是值。\noperator，如果是要做正则匹配就是 LIKE，如果是数组就用 IN',
    ),
};

const definitions = {
  query_where_array: fluentSchemas.query_where_array.valueOf(),
  token: {
    $id: 'token',
    type: 'string',
    description: '广发通，portal，cookie, 登录态通过 sso 换到的 access token',
  },
  ttoken: {
    $id: 'ttoken',
    type: 'string',
    description: '交易账号，trade，cookie, 登录态通过 sso 换到的 access token',
  },
  mongo_created_at: {
    description: 'mongoose 数据创建时间',
    type: 'string',
    format: 'date-time',
  },
  mongo_updated_at: {
    description: 'mongoose 数据更新时间',
    type: 'string',
    format: 'date-time',
  },
  paging_page: {
    description: '分页参数，第几页',
    type: 'integer',
    minimum: 0,
    default: 0,
  },
  paging_limit: {
    description: '分页参数，每页数量',
    type: 'integer',
    default: 30,
    example: 30,
    minimum: 1,
  },
  mongo_id: {
    $id: 'mongo_id',
    type: 'string',
    pattern: '[0-9a-z]{24}',
    description: 'mongo 数据库的 id，一般是 返回数据里面的 `_id`',
  },
  gf_oauth2_sso: {
    $id: 'gf_oauth2_sso',
    type: 'string',
    description: 'cookie, 登录态的 sso',
  },
};

const schemas = [
  {
    $id: 'gf_oauth2_token',
    type: 'string',
    description: 'cookie, 登录态通过 sso 换到的 access token',
  },
  {
    $id: 'success',
    description: '后端服务业务处理成功与否',
    type: 'boolean',
    defaults: true,
  },
  {
    $id: 'gf_auth_oa_user_info',
    type: 'object',
    properties: {
      clienttype: { type: 'string', example: '0' },
      mailaddress: { type: 'string', example: 'guanxw@gf.com.cn' },
      mail: { type: 'string', example: 'guanxw@gfdev.com' },
      homephone: { type: 'string', example: '无xx' },
      dpid: { type: 'string', example: 'CA53B0F4B5DDA01048258278003C999C' },
      employeeid: { type: 'string', example: '11737' },
      uid: { type: 'string', example: 'guanxw' },
      'fdu-deptname': {
        type: 'string',
        example: '信息技术部管理中台与服务支持组',
      },
      postalcode: { type: 'string', example: '510600' },
      maildomain: { type: 'string', example: 'GFZQ' },
      'fdu-py': { type: 'string', example: 'GXW' },
      department2: { type: 'string', example: '000000235700' },
      sn: { type: 'string', example: '官雄伟' },
      newno: { type: 'string', example: '8810' },
      department: { type: 'string', example: '8810' },
      email: { type: 'string', example: 'guanxw@fdev.com' },
      parentno: { type: 'string', example: '8810' },
      createtime: { type: 'string', example: '20010115004432Z' },
      loginid: { type: 'string', example: 'guanxw' },
      mobile: { type: 'string', example: '00011737' },
      cn: { type: 'string', example: '官雄伟' },
      coemployee: { type: 'boolean', example: false },
      phone: { type: 'string', example: '020-7555888-xxxx' },
      displayname: { type: 'string', example: '官雄伟/FZQ' },
      pdenabled: { type: 'string', example: '1' },
      officestreetaddress: { type: 'string', example: '广东省广州市' },
      depttype: { type: 'string', example: '3' },
      officeresnumber: { type: 'string', example: '020-7555888-xxxx' },
    },
  },
];

const register = fp(async (fastify) => {
  schemas.forEach((schema) => fastify.addSchema(schema));
  Object.values(definitions).forEach((schema) => {
    if (schema.$id) {
      fastify.addSchema(schema);
    }
  });
});

const definitions2swagger = (swaggerOpts) => {
  swaggerOpts.swagger.definitions = { ...definitions };
  schemas.forEach((schema) => {
    swaggerOpts.swagger.definitions[schema.$id] = schema;
  });
  return swaggerOpts;
};

module.exports = {
  plugin: register,
  schemas,
  definitions2swagger,
  definitions,
  fluentSchemas,
};
