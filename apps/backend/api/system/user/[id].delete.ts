import { defineEventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  // 验证访问令牌，获取当前用户信息
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取用户ID
  const id = event.context.params.id;

  // 获取数据库实例
  const db = await getDb();

  // 软删除用户：更新is_deleted字段为1
  const deleteUserSql = `
    UPDATE sys_user
    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
    WHERE id = ?
  `;
  db.execute(deleteUserSql, [userinfo.id, id]);

  // 软删除用户角色关联
  const deleteUserRoleSql = `
    UPDATE sys_user_role
    SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `;
  db.execute(deleteUserRoleSql, [id]);

  return useResponseSuccess({ message: '删除成功' });
});
