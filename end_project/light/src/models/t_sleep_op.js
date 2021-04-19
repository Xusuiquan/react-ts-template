const { knex } = require('../lib/knex');

const TABLE_NAME = 'T_SLEEP_OP';

// 操作记录表
const createTable = async () => knex.schema.createTable(TABLE_NAME, (table) => {
  table.integer('ID').comment('主键id');
  table.integer('TYPE').comment('操作类型');
  table.string('CONTENT').comment('操作内容');
  table.integer('YGBH').comment('操作员工编号');
  table.date('CREATEAT').comment('操作时间');
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
