import { eventHandler } from 'h3';
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

  // 获取数据库实例
  const db = await getDb();

  // 开始事务
  db.execute('BEGIN TRANSACTION;');

  try {
    // 软删除角色基本信息
    db.execute(
      `UPDATE sys_role SET 
        is_deleted = 1, 
        deleted_by = ?, 
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0`,
      [userinfo.id, id],
    );

    // 删除角色菜单关联
    db.execute(`DELETE FROM sys_role_menu WHERE role_id = ?`, [id]);

    // 删除用户角色关联
    db.execute(`DELETE FROM sys_user_role WHERE role_id = ?`, [id]);

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
