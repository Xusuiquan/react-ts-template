const { knex } = require('../lib/knex');

const TABLE_NAME = 'T_SLEEP_ASSIGN';

// 分配记录表
const createTable = async () => knex.schema.createTable(TABLE_NAME, (table) => {
  table.integer('ID').comment('主键id');
  table.integer('ASSIGNEE').notNullable().comment('分配者员工编号');
  table.integer('ASSIGNOR').notNullable().comment('被分配员工编号');
  table.integer('CUSTOME').notNullable().comment('被分配客户号');
  table.integer('RULE').notNullable().comment('分配规则');
  table.integer('STATUS').notNullable().comment('分配状态 1 分配 0 解除分配');
  table.date('CREATEAT').notNullable().comment('分配时间');
});

const initTable = async () => {
  await knex.schema.hasTable(TABLE_NAME).then((exists) => {
    if (!exists) {
      return createTable();
    }
    return undefined;
  });
};

module.exports = { createTable, initTable };
