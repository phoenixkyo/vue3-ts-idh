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
    name,
    id,
    remark,
    startTime,
    endTime,
    status,
  } = getQuery(event);

  // 构建查询条件
  const conditions: string[] = ['is_deleted = 0'];
  const params: any[] = [];

  if (name) {
    conditions.push('role_name LIKE ?');
    params.push(`%${String(name)}%`);
  }
  if (id) {
    conditions.push('id = ?');
    params.push(Number(id));
  }

  if (remark) {
    conditions.push('description LIKE ?');
    params.push(`%${String(remark)}%`);
  }
  if (startTime) {
    conditions.push('created_at >= ?');
    params.push(new Date(String(startTime)));
  }
  if (endTime) {
    conditions.push('created_at <= ?');
    params.push(new Date(String(endTime)));
  }
  if (['0', '1'].includes(status as string)) {
    conditions.push('status = ?');
    params.push(Number(status));
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查询总数
  const countResult = db.query(
    `SELECT COUNT(*) as total FROM sys_role ${whereClause}`,
    params,
  );
  const total = countResult[0]?.total || 0;

  // 计算分页参数
  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);
  const offset = (pageNum - 1) * pageSizeNum;

  // 查询角色列表，移除description和sort_order字段
  const roles = db.query(
    `SELECT id, role_key, role_name as name, status, created_at as createTime 
     FROM sys_role 
     ${whereClause} 
     ORDER BY id ASC 
     LIMIT ? OFFSET ?`,
    [...params, pageSizeNum, offset],
  );

  // 查询每个角色的权限
  const roleIds = roles.map((role: any) => role.id);
  let rolePermissions: Record<number, number[]> = {};

  if (roleIds.length > 0) {
    const permissionsResult = db.query(
      `SELECT role_id, menu_id FROM sys_role_menu 
       WHERE role_id IN (${roleIds.map(() => '?').join(',')}) AND is_deleted = 0`,
      roleIds,
    );

    // 构建角色权限映射
    rolePermissions = {};
    for (const item of permissionsResult) {
      const roleId = item.role_id;
      // 若当前角色ID还没对应的数组，初始化空数组
      if (!rolePermissions[roleId]) {
        rolePermissions[roleId] = [];
      }
      // 把menu_id加入对应角色的数组
      rolePermissions[roleId].push(item.menu_id);
    }
  }

  // 组装最终结果
  const listData = roles.map((role: any) => ({
    ...role,
    permissions: rolePermissions[role.id] || [],
  }));

  return usePageResponseSuccess(page as string, pageSize as string, listData, {
    message: 'ok',
    total,
  });
});
