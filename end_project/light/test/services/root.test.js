const test = require('ava').default;

const { fastify: app } = require('../../app');

test('healthz route', async (t) => {
  const res = await app.inject({ url: '/healthz' });
  t.deepEqual(res.payload, 'ok');
});
