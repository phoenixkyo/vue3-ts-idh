import { eventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  sleep,
  unAuthorizedResponse,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取角色ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const {
    name: roleName,
    roleCode: roleKey,
    remark: description = '',
    status = 1,
    sortOrder = 0,
    menuIds = [],
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 开始事务
  db.execute('BEGIN TRANSACTION;');

  try {
    // 更新角色基本信息
    db.execute(
      `UPDATE sys_role SET 
        role_name = ?, 
        role_key = ?, 
        description = ?, 
        sort_order = ?, 
        status = ?, 
        updated_by = ?
      WHERE id = ? AND is_deleted = 0`,
      [roleName, roleKey, description, sortOrder, status, userinfo.id, id],
    );

    // 删除旧的角色菜单关联
    db.execute(`DELETE FROM sys_role_menu WHERE role_id = ?`, [id]);

    // 插入新的角色菜单关联
    if (menuIds && menuIds.length > 0) {
      for (const menuId of menuIds) {
        db.execute(
          `INSERT INTO sys_role_menu (role_id, menu_id, created_by, updated_by) 
           VALUES (?, ?, ?, ?)`,
          [id, menuId, userinfo.id, userinfo.id],
        );
      }
    }

    // 提交事务
    db.execute('COMMIT;');
  } catch (error) {
    // 回滚事务
    db.execute('ROLLBACK;');
    throw error;
  }

  await sleep(300);
  return useResponseSuccess(null);
});
