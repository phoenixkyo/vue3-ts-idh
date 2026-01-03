import { eventHandler, getQuery } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取数据库实例
  const db = await getDb();

  // 获取查询参数
  const {
    page = 1,
    pageSize = 20,
    dictType,
    dictCode,
    dictLabel,
    status,
  } = getQuery(event);

  // 构建查询条件
  const conditions: string[] = ['is_deleted = 0'];
  const params: any[] = [];

  if (dictType) {
    conditions.push('dict_type LIKE ?');
    params.push(`%${String(dictType)}%`);
  }
  if (dictCode) {
    conditions.push('dict_code LIKE ?');
    params.push(`%${String(dictCode)}%`);
  }
  if (dictLabel) {
    conditions.push('dict_label LIKE ?');
    params.push(`%${String(dictLabel)}%`);
  }
  if (['0', '1'].includes(status as string)) {
    conditions.push('status = ?');
    params.push(Number(status));
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查询总数
  const countResult = db.query(
    `SELECT COUNT(*) as total FROM sys_dict ${whereClause}`,
    params,
  );
  const total = countResult[0]?.total || 0;

  // 计算分页参数
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  // 查询字典列表
  const dicts = db.query(
    `SELECT id, dict_type, dict_code, dict_value, dict_label, description, sort_order, is_system, is_default, css_class, list_class, status, created_at as createTime 
     FROM sys_dict 
     ${whereClause} 
     ORDER BY dict_type ASC, sort_order ASC, id ASC 
     LIMIT ? OFFSET ?`,
    [...params, pageSizeNum, offset],
  );

  return usePageResponseSuccess(
    page as string,
    pageSize as string,
    dicts,
    total,
  );
});
