const _ = require('lodash');
const S = require('fluent-json-schema').default;
const { knex } = require('../lib/knex');
const logger = require('../lib/logger');
const { checkIAMUser } = require('../plugins/iam_auth');
// const { genAclSql } = require('../plugins/acl_sql');

const T_OP = 'RDMP.T_SLEEP_OP';

const opts = {
  queryOP: {
    preValidation: [checkIAMUser],
    schema: {
      summary: '查询操作记录',
      description: '',
      tags: ['op'],
      headers: S.object()
        .prop('x-erpid', S.string().default('34585')),
      body: S.object()
        .prop('whereArray', S.ref('#/definitions/query_where_array'))
        .prop(
          'limit',
          S.integer()
            .minimum(1)
            .maximum(2000)
            .default(100)
            .raw({ example: 100 }),
        )
        .prop(
          'page',
          S.number().minimum(0).maximum(10000).default(0)
            .description('从0开始'),
        )
        .valueOf(),
    },
  },
};

const queryOP = async (request, reply) => {
  const {
    body: {
      whereArray, limit, page, select = [],
    },
  } = request;
  const qb = knex.queryBuilder();
  _.each(whereArray, (where) => {
    where[0] = `a1.${where[0]}`;
    qb.where(...where);
  });
  qb.from(`${T_OP} as a1`).leftJoin('KDEMP.T_YG as a2', 'a1.YGBH', 'a2.YGBH').limit(limit).offset(limit * page)
    .select(select);
  logger.info({ msg: 'op, queryOP', data: { dataQueryBuilder: qb.toString() } });
  const data = await qb.debug();
  reply.resmsg({ data });
};

module.exports = {
  opts,
  queryOP,
};
