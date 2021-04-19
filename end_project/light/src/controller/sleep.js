const _ = require('lodash');
const S = require('fluent-json-schema').default;
const { knex } = require('../lib/knex');
const logger = require('../lib/logger');
const { checkIAMUser } = require('../plugins/iam_auth');
// const { genAclSql } = require('../plugins/acl_sql');

const T_ASSIGN = 'RDMP.T_SLEEP_ASSIGN';
const T_OP = 'RDMP.T_SLEEP_OP';

const opts = {
  queryAssign: {
    preValidation: [checkIAMUser],
    schema: {
      summary: '查询分配记录',
      description: '',
      tags: ['sleep'],
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
  addAssign: {
    preValidation: [checkIAMUser],
    schema: {
      summary: '指定分配',
      description: '',
      tags: ['sleep'],
      headers: S.object()
        .prop('x-erpid', S.string().default('34585')),
      body: S.object()
        .prop('assignee', S.integer().description('被分配人员工编号'))
        .prop('custom', S.integer().description('分配客户号'))
        .valueOf(),
    },
  },
};

const queryAssign = async (request, reply) => {
  const {
    body: {
      whereArray, limit, page, select = [],
    },
  } = request;
  const qb = knex.queryBuilder();
  _.each(whereArray, (where) => {
    qb.where(...where);
  });
  qb.from(T_ASSIGN).limit(limit).offset(limit * page)
    .select(select);
  logger.info({ msg: 'sleep, queryAssign', data: { dataQueryBuilder: qb.toString() } });
  const data = await qb.debug();
  reply.resmsg({ data });
};

const addAssign = async (request, reply) => {
  const {
    body: {
      assignee, custom,
    },
    erpId,
  } = request;
  const id = await knex.raw('select RDMP.SEQ_SLEEP.NEXTVAL from dual');
  const qb = knex.queryBuilder();
  qb.from(T_ASSIGN).insert({
    ID: id[0].NEXTVAL,
    ASSIGNOR: erpId,
    ASSIGNEE: assignee,
    CREATEAT: new Date(),
    CUSTOM: custom,
    RULE: 4,
    STATUS: 1,
  });

  const id2 = await knex.raw('select RDMP.SEQ_SLEEP.NEXTVAL from dual');

  await knex(T_OP).insert({
    ID: id2[0].NEXTVAL,
    YGBH: erpId,
    TYPE: 0,
    CONTENT: '分配',
    CREATEAT: new Date(),
  });
  logger.info({ msg: 'sleep, addAssign', data: { dataQueryBuilder: qb.toString() } });
  const data = await qb.debug();
  reply.resmsg({ data });
};

module.exports = {
  opts,
  queryAssign,
  addAssign,
};
