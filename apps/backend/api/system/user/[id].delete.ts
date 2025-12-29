import { defineEventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  // 获取用户ID
  const id = event.context.params.id;

  // 获取数据库实例
  const db = await getDb();

  // 软删除用户：更新is_deleted字段为1
  const deleteUserSql = `
    UPDATE sys_user 
    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  db.execute(deleteUserSql, [id]);

  // 软删除用户角色关联
  const deleteUserRoleSql = `
    UPDATE sys_user_role 
    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP 
    WHERE user_id = ?
  `;
  db.execute(deleteUserRoleSql, [id]);

  return useResponseSuccess({ message: '删除成功' });
});
