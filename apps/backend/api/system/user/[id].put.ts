import bcrypt from 'bcrypt';
import { defineEventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const id = event.context.params.id;
  const body = await readBody(event);

  // 获取数据库实例
  const db = await getDb();

  // 检查用户是否存在
  const checkUserSql =
    'SELECT id FROM sys_user WHERE id = ? AND is_deleted = 0';
  const userExists = db.query(checkUserSql, [id]);
  if (userExists.length === 0) {
    return useResponseSuccess({ message: '用户不存在' });
  }

  // 更新用户信息
  let updateUserSql = `
    UPDATE sys_user 
    SET 
      real_name = ?, 
      email = ?, 
      phone = ?, 
      status = ?, 
      dept_id = ?, 
      updated_at = CURRENT_TIMESTAMP
  `;

  const updateParams = [
    body.realName,
    body.email,
    body.phone,
    body.status || 1,
    body.deptId,
  ];

  // 如果提供了密码，则更新密码
  if (body.password) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    updateUserSql += ', password_hash = ?';
    updateParams.push(passwordHash);
  }

  updateUserSql += ' WHERE id = ?';
  updateParams.push(id);

  db.execute(updateUserSql, updateParams);

  // 更新用户角色关联：先删除旧的关联，再添加新的
  if (body.roleId) {
    // 删除旧的角色关联
    const deleteUserRoleSql = 'DELETE FROM sys_user_role WHERE user_id = ?';
    db.execute(deleteUserRoleSql, [id]);

    // 添加新的角色关联
    const insertUserRoleSql = `
      INSERT INTO sys_user_role (user_id, role_id, created_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    db.execute(insertUserRoleSql, [id, body.roleId]);
  }

  // 查询更新后的用户信息，包括部门和角色
  const updatedUserSql = `
    SELECT 
      u.id, 
      u.username, 
      u.real_name as realName, 
      u.email, 
      u.phone, 
      u.status, 
      u.created_at as createTime,
      
      -- 部门信息
      d.id as deptId,
      d.dept_name as deptName,
      
      -- 角色信息
      r.id as roleId,
      r.role_name as roleName
      
    FROM sys_user u
    LEFT JOIN sys_dept d ON u.dept_id = d.id AND d.is_deleted = 0
    LEFT JOIN sys_user_role ur ON u.id = ur.user_id AND ur.is_deleted = 0
    LEFT JOIN sys_role r ON ur.role_id = r.id AND r.is_deleted = 0
    WHERE u.id = ? AND u.is_deleted = 0
    LIMIT 1
  `;

  const updatedUser = db.query(updatedUserSql, [id])[0];

  return useResponseSuccess(updatedUser);
});
