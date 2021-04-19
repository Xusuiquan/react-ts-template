/* eslint-disable no-await-in-loop */
const Boom = require('@hapi/boom');
const _ = require('lodash');
const logger = require('../lib/logger');
const { knex } = require('../lib/knex');

const T_YGZCY = knex.raw('KDEMP.T_YGZCY');
const T_YG = knex.raw('KDEMP.T_YG YG');
const T_DW = knex.raw('KDEMP.T_DW T1');

async function getFZBHByYGBH(erpId) {
  const rst = await knex(T_YGZCY).where({ YGBH: erpId });
  return rst.map((item) => item.FZBH);
}

async function getFZBHByDWBH(DWBH) {
  const rst = await knex('KDEMP.T_YGZ AS ACL').whereIn('ACL.DWBH', DWBH);
  return rst.map((item) => item.FZBH);
}

async function getDWBHByErpId(erpId) {
  const rst = await knex('KDBASE.T_USER').where({ YGBH: erpId });
  return rst.map((item) => item.DWBH);
}

// 部分业务只做到单位维度的数据权限
const genAclSqlDept = async (req) => {
  const { resource, erpId, newno } = req;

  // gfc:rdmp:sjqx:*:res
  // res取值为
  // 全公司- company，
  // 所在部门及下属 -  departmentAndSubordinate，
  // 所在部门-department
  // http://wiki.gf.com.cn/pages/viewpage.action?pageId=92931885

  // 加了个保底，如果gateway没有加上newno,去kdbase.t_user查
  let udwbh = [];
  udwbh = await getDWBHByErpId(erpId);
  // copy from rdmp/server
  if (udwbh.length === 0) {
    udwbh.push(newno);
  }
  const aclArr = {
    YGBH: [],
    FZBH: [],
    DWBH: [],
  }; // 无赋值，代表没有任何权限，
  let aclSql2 = '';
  if (resource !== '*') {
    if (resource.length === 0) {
      // donothing
    } else {
      for (let r = 0; r < resource.length; r += 1) {
        const acl = resource[r].split(':');
        // T1 T_DW
        if (acl[3] === '*') {
          // 通用权限
          if (acl[4] === 'company') {
            req.aclSql2 = '';
            return;
          }
          if (acl[4] === 'departmentAndSubordinate') {
            let rst = await knex('KDBASE.T_DW').where({ DWBH: udwbh[0] });
            const { DWJB } = rst[0];
            rst = await knex('KDBASE.T_DW')
              .select('DWBH')
              .where('DWJB', 'like', `${DWJB}%`);
            aclArr.DWBH = _.concat(
              aclArr.DWBH,
              rst.map((item) => item.DWBH),
            );
          } else if (acl[4] === 'department') {
            aclArr.DWBH.push(udwbh[0]);
          }
        } else {
          // 自定义权限
          // DWBH/111155|111154
          const customizeType = acl[3].split(';');
          for (let i = 0; i < customizeType.length; i += 1) {
            const customizeAcl = customizeType[i].split('/');
            const IDArr = customizeAcl[1].split('|');
            if (customizeAcl[0] === 'DWBH') {
              aclArr.DWBH = _.concat(aclArr.DWBH, IDArr);
            }
          }
        }
      }
    }
  } else {
    // 超级管理员
    req.aclSql2 = '';
    return;
  }

  const aclOr = [];
  if (aclArr.DWBH.length) {
    const dwbhArr = aclArr.DWBH.join(',');
    aclOr.push(` T1.DWBH in (${dwbhArr}) `);
  } else {
    aclOr.push(' T1.DWBH = 0 ');
  }

  if (aclOr.length !== 0) {
    aclSql2 += ` and ( ${aclOr.join(' or ')} )`;
  } else {
    aclSql2 += ' and (1 = 0)';
  }

  logger.info({
    msg: 'aclsql,genAclSqlDept',
    erpId,
    aclSql2,
    aclArr,
  });

  req.aclArr = aclArr;
  req.aclSql2 = aclSql2;
};

const genAclSql = async (req) => {
  const { resource, erpId, newno } = req;
  // gfc:rdmp:sjqx:*:res
  // res取值为
  // 全公司- company，
  // 所在部门及下属 -  departmentAndSubordinate，
  // 所在部门-department ，
  // 所在团队- team，
  // 仅自己 -  self
  // http://wiki.gf.com.cn/pages/viewpage.action?pageId=92931885

  // 加了个保底，如果gateway没有加上newno,去kdbase.t_user查
  let udwbh = [];
  udwbh = await getDWBHByErpId(erpId);
  // copy from rdmp/server
  if (udwbh.length === 0) {
    udwbh.push(newno);
  }
  const aclArr = {
    YGBH: [],
    FZBH: [],
    DWBH: [],
  }; // 无赋值，代表没有任何权限，
  let aclSql = '';
  let aclSql2 = '';
  if (resource !== '*') {
    req.aclSql = ' and ( 1=0 ';
    if (resource.length === 0) {
      aclArr.YGBH.push(erpId);
      aclSql += ` or a.YGBH = ${erpId} `; // 没有配置数据权限，默认self
    } else {
      for (let r = 0; r < resource.length; r += 1) {
        const acl = resource[r].split(':');
        // a T_YG, b T_DW, c T_YGZ，d T_USER, e T_YG_OA
        if (acl[3] === '*') {
          // 通用权限
          if (acl[4] === 'company') {
            req.aclSql = '';
            req.aclSql2 = '';
            return;
          }
          if (acl[4] === 'departmentAndSubordinate') {
            let rst = await knex('KDBASE.T_DW').where({ DWBH: udwbh[0] });
            const { DWJB } = rst[0];
            rst = await knex('KDBASE.T_DW')
              .select('DWBH')
              .where('DWJB', 'like', `${DWJB}%`);
            const dwbhArr = rst.map((item) => item.DWBH).join(',');
            aclSql += ` or b.DWBH in (${dwbhArr})`;
            aclArr.DWBH = _.concat(
              aclArr.DWBH,
              rst.map((item) => item.DWBH),
            );
          } else if (acl[4] === 'department') {
            aclSql += ` or b.DWBH = ${udwbh[0]}`;
            aclArr.DWBH.push(udwbh[0]);
          } else if (acl[4] === 'team') {
            const FZBH = await getFZBHByYGBH(erpId);
            if (FZBH.length !== 0) {
              aclSql += ` or c.FZBH in (${FZBH.join(',')})`;
            } else {
              aclSql += ' or c.FZBH = 0';
            }
            aclArr.FZBH = _.concat(aclArr.FZBH, FZBH);
          } else if (acl[4] === 'self') {
            const FZBH = await getFZBHByYGBH(erpId);
            if (FZBH.length !== 0) {
              aclSql += ` or c.FZBH in (${FZBH.join(',')})`;
            } else {
              aclSql += ' or c.FZBH = 0';
            }
            aclArr.YGBH.push(erpId);
            aclArr.FZBH = _.concat(aclArr.FZBH, FZBH);
            aclSql += ` or (a.YGBH = ${erpId} and c.FZBH=${FZBH} )`; // 不允许查任何组信息
          } else {
            const FZBH = await getFZBHByYGBH(erpId);
            aclArr.YGBH.push(erpId);
            aclArr.FZBH = _.concat(aclArr.FZBH, FZBH);
            aclSql += ` or (a.YGBH = ${erpId} and c.FZBH=${FZBH} )`; // 默认self权限
          }
        } else {
          // 自定义权限
          // YGBH/1000048|1000049;FZBH/100000772|100000773;DWBH/111155|111154
          const customizeType = acl[3].split(';');
          for (let i = 0; i < customizeType.length; i += 1) {
            const customizeAcl = customizeType[i].split('/');
            const IDArr = customizeAcl[1].split('|');
            if (customizeAcl[0] === 'YGBH') {
              aclSql += ` or (a.YGBH in (${IDArr}) `; // 不允许查任何组信息
              aclArr.YGBH = _.concat(aclArr.YGBH, IDArr);
            } else if (customizeAcl[0] === 'DWBH') {
              aclSql += ` or b.DWBH in (${IDArr}) `;
              aclArr.DWBH = _.concat(aclArr.DWBH, IDArr);
            } else if (customizeAcl[0] === 'FZBH') {
              aclSql += ` or c.FZBH in (${IDArr}) `;
              aclArr.FZBH = _.concat(aclArr.FZBH, IDArr);
            }
          }
        }
      }
    }
    aclSql += ' ) ';
    req.aclSql += aclSql;
  } else {
    // 超级管理员
    req.aclSql = '';
    req.aclSql2 = '';
    return;
  }
  // acl2 cancat
  if (aclArr.DWBH.length !== 0) {
    const fzbhArr = await getFZBHByDWBH(aclArr.DWBH);
    aclArr.FZBH = _.concat(aclArr.FZBH, fzbhArr);
  }
  const aclOr = [];
  if (aclArr.YGBH.length !== 0) {
    const ygbhArr = aclArr.YGBH.join(',');
    aclOr.push(` a.YGBH in (${ygbhArr}) `);
  } else {
    aclOr.push(' a.YGBH = 0 ');
  }

  if (aclArr.FZBH.length !== 0) {
    const fzbhArr = aclArr.FZBH.join(',');
    aclOr.push(` c.FZBH in (${fzbhArr}) `);
  } else {
    aclOr.push(' c.FZBH = 0 ');
  }

  if (aclArr.DWBH.length) {
    const dwbhArr = aclArr.DWBH.join(',');
    aclOr.push(` b.DWBH in (${dwbhArr}) `);
  } else {
    aclOr.push(' b.DWBH = 0 ');
  }

  if (aclOr.length !== 0) {
    aclSql2 += ` and ( ${aclOr.join(' or ')} )`;
  }

  logger.info({
    msg: 'aclsql,genAclSql',
    erpId,
    aclSql2,
    aclArr,
  });

  req.aclArr = aclArr;
  req.aclSql2 = aclSql2;
};

const checkAclFn = ({
  empIdPath = 'body.empId',
  orgIdPath = 'body.orgId',
}) => async (request) => {
  const { aclSql2: aclSql } = request;
  const empId = _.get(request, empIdPath, '');
  const orgId = _.get(request, orgIdPath, '');
  const sqlRunner = knex(T_YG)
    .leftJoin(T_DW, 'YG.DWBH', 'T1.DWBH')
    .select(1)
    .where('YG.YGBH', empId)
    .orWhere('YG.DWBH', orgId)
    .whereRaw(`1=1 ${aclSql}`)
    .limit(1);

  const result = await sqlRunner;
  logger.info({ msg: 'acl_sql,checkAclFn', sql: sqlRunner.toString(), result });
  if (result.length === 0) {
    throw Boom.forbidden('没有目标的数据权限');
  }
};

module.exports = {
  genAclSql,
  genAclSqlDept,
  checkAclFn,
};
