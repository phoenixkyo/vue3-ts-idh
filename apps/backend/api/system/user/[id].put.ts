import fs from 'node:fs';
import path from 'node:path';

import bcrypt from 'bcrypt';
import { defineEventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseError, useResponseSuccess } from '~/utils/response';

// 读取国际化文件
function loadLocaleMessages(locale: string) {
  const localePath = path.resolve(
    process.cwd(),
    `../../packages/locales/src/langs/${locale}/authentication.json`,
  );

  try {
    if (fs.existsSync(localePath)) {
      const data = fs.readFileSync(localePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error);
  }

  // 加载默认语言（英文）
  const defaultPath = path.resolve(
    process.cwd(),
    '../../packages/locales/src/langs/en-US/authentication.json',
  );

  try {
    if (fs.existsSync(defaultPath)) {
      const data = fs.readFileSync(defaultPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load default locale messages:', error);
  }

  return {};
}

// 根据请求头获取语言偏好
function getPreferredLanguage(event: any): string {
  const acceptLanguage = event.node.req.headers['accept-language'] || 'en-US';
  return acceptLanguage.startsWith('zh') ? 'zh-CN' : 'en-US';
}

export default defineEventHandler(async (event) => {
  const lang = getPreferredLanguage(event);
  const localeMessages = loadLocaleMessages(lang);
  const id = event.context.params.id;
  const body = await readBody(event);

  // 获取数据库实例
  const db = await getDb();

  // 检查用户是否存在
  const checkUserSql =
    'SELECT id FROM sys_user WHERE id = ? AND is_deleted = 0';
  const userExists = db.query(checkUserSql, [id]);
  if (userExists.length === 0) {
    return useResponseError(localeMessages.userNotFound || 'User not found');
  }

  // 先查询现有用户数据，以便在更新时使用现有值作为默认值
  const existingUserSql = `
    SELECT username, nickname, real_name, gender, email, phone, status, dept_id, post_id 
    FROM sys_user 
    WHERE id = ? AND is_deleted = 0
  `;
  const existingUser = db.query(existingUserSql, [id])[0];

  // 检查邮箱是否已被其他用户使用
  if (body.email && body.email !== existingUser.email) {
    const checkEmailSql = `
      SELECT id FROM sys_user 
      WHERE email = ? AND id != ?
    `;
    const emailExists = db.query(checkEmailSql, [body.email, id]);
    if (emailExists.length > 0) {
      return useResponseError(
        localeMessages.emailAlreadyExists || 'Email already exists',
      );
    }
  }

  // 检查用户名是否已被其他用户使用
  if (body.username && body.username !== existingUser.username) {
    const checkUsernameSql = `
      SELECT id FROM sys_user 
      WHERE username = ? AND id != ?
    `;
    const usernameExists = db.query(checkUsernameSql, [body.username, id]);
    if (usernameExists.length > 0) {
      return useResponseError(
        localeMessages.usernameAlreadyExists || 'Username already exists',
      );
    }
  }

  // 更新用户信息
  let updateUserSql = `
    UPDATE sys_user 
    SET 
      username = ?, 
      nickname = ?, 
      real_name = ?, 
      gender = ?, 
      email = ?, 
      phone = ?, 
      status = ?, 
      dept_id = ?, 
      post_id = ?, 
      updated_at = CURRENT_TIMESTAMP
  `;

  // 统一转换为数字：true -> 1, false -> 0，数字保持不变
  let statusValue = body.status;
  if (typeof statusValue === 'boolean') {
    statusValue = statusValue ? 1 : 0;
  } else if (statusValue === undefined) {
    statusValue = existingUser.status;
  }

  const updateParams = [
    body.username || existingUser.username,
    body.nickname || existingUser.nickname || existingUser.username,
    body.realName || existingUser.real_name,
    body.gender === undefined ? existingUser.gender : Number(body.gender),
    body.email || existingUser.email || '',
    body.phone || existingUser.phone || '',
    statusValue,
    body.deptId || existingUser.dept_id || null,
    body.postId || existingUser.post_id || null,
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
    db.execute(insertUserRoleSql, [id, Number(body.roleId)]);
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
