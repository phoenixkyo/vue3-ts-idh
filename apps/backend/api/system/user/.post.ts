import bcrypt from 'bcrypt';
import { defineEventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 获取数据库实例
  const db = await getDb();

  // 检查用户名是否已存在
  const checkUsernameSql = `
    SELECT id FROM sys_user 
    WHERE username = ? AND is_deleted = 0
  `;
  const usernameExists = db.query(checkUsernameSql, [body.username]);
  if (usernameExists.length > 0) {
    return useResponseSuccess({ message: '用户名已被使用' });
  }

  // 检查邮箱是否已存在
  if (body.email) {
    const checkEmailSql = `
      SELECT id FROM sys_user 
      WHERE email = ? AND is_deleted = 0
    `;
    const emailExists = db.query(checkEmailSql, [body.email]);
    if (emailExists.length > 0) {
      return useResponseSuccess({ message: '邮箱已被使用' });
    }
  }

  // 使用默认密码123456
  const defaultPassword = '123456';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 插入用户数据
  const insertUserSql = `
    INSERT INTO sys_user (
      username, 
      nickname, 
      real_name, 
      gender, 
      email, 
      phone, 
      password_hash, 
      status, 
      dept_id,
      post_id,
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;

  db.execute(insertUserSql, [
    body.username,
    body.nickname || body.username,
    body.realName || '',
    Number(body.gender || 0),
    body.email || '',
    body.phone || '',
    passwordHash,
    body.status,
    body.deptId || null,
    body.postId || null,
  ]);

  // 获取插入的用户ID
  const lastInsertIdSql = 'SELECT last_insert_rowid() as id';
  const lastInsertIdResult = db.query(lastInsertIdSql);
  const newUserId = lastInsertIdResult[0]?.id;

  // 插入用户角色关联
  if (body.roleId && newUserId) {
    const insertUserRoleSql = `
      INSERT INTO sys_user_role (user_id, role_id, created_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    db.execute(insertUserRoleSql, [newUserId, Number(body.roleId)]);
  }

  // 查询新创建的用户信息，包括部门和角色
  const newUserSql = `
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

  const newUser = db.query(newUserSql, [newUserId])[0];

  return useResponseSuccess(newUser);
});
