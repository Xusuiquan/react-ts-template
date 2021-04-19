exports.cacher = {
  redis: {
    host: 'srvredis100',
  },
};

exports.remote = {
  IAMAuth: {
    host: 'http://rdmpdev.gf.com.cn',
    getIAMAuth: '/api/iam/iam/checkAuthority',
  },
  portal: {
    clientID: 'gfwealth',
    clientSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    // testauth3 mean oa user only
    host: 'http://testauth3.gf.com.cn',
    info: '/ws/auth/user/info/default',
    getToken: '/ws/pub/token/access_token',
    getUserInfo: '/ws/auth/user/info/default',
    loginByPwd: '/ws/pub/token/access_token/ownpwd',
    internalUserInfo: '/ws/inside/user/portal/info',
    getTokenInfo: '/ws/auth/token/access_token',
  },
};

exports.sentry = {
  dsn: '',
};

exports.fastify = {
  prefix: '/api',
};

exports.fastifySwagger = {};

// https://github.com/oracle/node-oracledb/blob/master/examples/dbconfig.js
exports.oracle = {
  user: process.env.NODE_ORACLEDB_USER || 'rdmp',

  // Get the password from the environment variable
  // NODE_ORACLEDB_PASSWORD.  The password could also be a hard coded
  // string (not recommended), or it could be prompted for.
  // Alternatively use External Authentication so that no password is
  // needed.
  password: process.env.NODE_ORACLEDB_PASSWORD || 'rdmp+1s',

  // For information on connection strings see:
  // https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || '10.51.166.68:1521/jjr',

  // Setting externalAuth is optional.  It defaults to false.  See:
  // https://oracle.github.io/node-oracledb/doc/api.html#extauth
  externalAuth: !!process.env.NODE_ORACLEDB_EXTERNALAUTH,
};

exports.iamConfig = {
  productName: 'rdmp',
  SkipIAMAuth: false,
};
