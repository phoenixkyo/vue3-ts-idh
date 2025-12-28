import bcrypt from 'bcryptjs';
import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseError, useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const { username, password, nickname, email } = await readBody(event);

  // 验证必填字段
  if (!username || !password) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username and password are required',
    );
  }

  try {
    const db = await getDb();

    // 检查用户名是否已存在
    const existingUsers = db.query(
      'SELECT id FROM sys_user WHERE username = ? AND is_deleted = 0',
      [username],
    );

    if (existingUsers.length > 0) {
      setResponseStatus(event, 400);
      return useResponseError('BadRequestException', 'Username already exists');
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmails = db.query(
        'SELECT id FROM sys_user WHERE email = ? AND is_deleted = 0',
        [email],
      );

      if (existingEmails.length > 0) {
        setResponseStatus(event, 400);
        return useResponseError('BadRequestException', 'Email already exists');
      }
    }

    // 生成密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    db.execute(
      `INSERT INTO sys_user (username, nickname, email, password_hash, status, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [username, nickname || username, email || null, hashedPassword],
    );

    // 获取刚创建的用户信息
    const newUser = db.query(
      'SELECT id, username, nickname as realName, email, status FROM sys_user WHERE username = ?',
      [username],
    );

    return useResponseSuccess({
      user: newUser[0],
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('注册失败:', error);
    setResponseStatus(event, 500);
    return useResponseError(
      'ServerException',
      'Failed to create account. Please try again later.',
    );
  }
});
