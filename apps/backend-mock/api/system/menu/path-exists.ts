import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDb } from '~/utils/db';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id, path } = getQuery(event);
  if (!path) {
    return useResponseSuccess(false);
  }

  // 获取数据库实例
  const db = await getDb();

  // 构建查询条件
  const conditions: string[] = ['path = ?', 'is_deleted = 0'];
  const params: any[] = [String(path)];

  if (id) {
    conditions.push('id != ?');
    params.push(Number(id));
  }

  // 查询菜单路径是否存在
  const result = db.query(
    `SELECT COUNT(*) as count FROM sys_menu WHERE ${conditions.join(' AND ')}`,
    params
  );

  const exists = result[0]?.count > 0;

  return useResponseSuccess(exists);
});
