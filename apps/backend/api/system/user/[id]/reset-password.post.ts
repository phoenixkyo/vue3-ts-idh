import bcrypt from 'bcrypt';
import { defineEventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;

  // 获取数据库实例
  const db = await getDb();

  // 检查用户是否存在
  const checkUserSql =
    'SELECT id FROM sys_user WHERE id = ? AND is_deleted = 0';
  const userExists = db.query(checkUserSql, [id]);
  if (userExists.length === 0) {
    return useResponseSuccess({ message: '用户不存在' });
  }

  // 默认密码设置为123456
  const defaultPassword = '123456';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 更新密码
  const updatePasswordSql = `
    UPDATE sys_user 
    SET 
      password_hash = ?, 
      password_changed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.execute(updatePasswordSql, [passwordHash, id]);

  return useResponseSuccess({ message: '密码重置成功，新密码为：123456' });
});
