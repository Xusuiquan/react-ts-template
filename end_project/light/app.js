const fastifySwagger = require('fastify-swagger');
const fud = require('fastify-url-data');
const fastifyCookie = require('fastify-cookie');

const routes = require('./src/routes');

const config = require('./src/config');
const { plugin: gfAuthMW } = require('./src/plugins/gf_auth');
const { plugin: IAMUserMW } = require('./src/plugins/iam_auth');
const resmsgMW = require('./src/plugins/resmsg');
const cookieLowercase = require('./src/plugins/cookie_lowercase');
const {
  plugin: shareSchemaMW,
  definitions2swagger,
} = require('./src/plugins/share_schema');

// eslint-disable-next-line import/order
const fastify = require('fastify')(config.fastify);

fastify.register(fud);
fastify.register(fastifyCookie);
fastify.register(cookieLowercase);
fastify.register(shareSchemaMW);
fastify.register(gfAuthMW);
fastify.register(resmsgMW);
fastify.register(IAMUserMW);

// for tencent cloud k8s ingress health check
// it just head request every url define in the rules
fastify.register((app, opts, next) => {
  app.head('/', async () => ({ success: true }));
  return next();
});

if (!/prod/.test(process.env.NODE_ENV)) {
  fastify.register(fastifySwagger, definitions2swagger(config.fastifySwagger));
}
fastify.register(routes);

if (!module.parent) {
  fastify.listen(3000, '0.0.0.0', (err) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  });
}

exports.fastify = fastify;
