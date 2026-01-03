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
  const { page = 1, pageSize = 20, name, id, code, status } = getQuery(event);

  // 构建查询条件
  const conditions: string[] = ['is_deleted = 0'];
  const params: any[] = [];

  if (name) {
    conditions.push('post_name LIKE ?');
    params.push(`%${String(name)}%`);
  }
  if (id) {
    conditions.push('id = ?');
    params.push(Number(id));
  }
  if (code) {
    conditions.push('post_code LIKE ?');
    params.push(`%${String(code)}%`);
  }
  if (['0', '1'].includes(status as string)) {
    conditions.push('status = ?');
    params.push(Number(status));
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查询总数
  const countResult = db.query(
    `SELECT COUNT(*) as total FROM sys_post ${whereClause}`,
    params,
  );
  const total = countResult[0]?.total || 0;

  // 计算分页参数
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  // 查询岗位列表
  const posts = db.query(
    `SELECT id, post_code as code, post_name as name, description as remark, status, sort_order as sortOrder, created_at as createTime 
     FROM sys_post 
     ${whereClause} 
     ORDER BY sort_order ASC, id ASC 
     LIMIT ? OFFSET ?`,
    [...params, pageSizeNum, offset],
  );

  return usePageResponseSuccess(page as string, pageSize as string, posts, {
    message: 'ok',
    total,
  });
});
