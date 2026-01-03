import fs from 'node:fs';
import path from 'node:path';

import bcrypt from 'bcryptjs';
import { defineEventHandler, readBody, setResponseStatus } from 'h3';
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
  const { username, password, nickname, email } = await readBody(event);

  // 验证必填字段
  if (!username || !password) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      localeMessages.usernamePasswordRequired ||
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
      return useResponseError(
        'BadRequestException',
        localeMessages.usernameAlreadyExists || 'Username already exists',
      );
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingEmails = db.query(
        'SELECT id FROM sys_user WHERE email = ? AND is_deleted = 0',
        [email],
      );

      if (existingEmails.length > 0) {
        setResponseStatus(event, 400);
        return useResponseError(
          'BadRequestException',
          localeMessages.emailAlreadyExists || 'Email already exists',
        );
      }
    }

    // 生成密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户，默认状态为禁用（0）
    db.execute(
      `INSERT INTO sys_user (username, nickname, email, password_hash, status, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [username, nickname || username, email || null, hashedPassword],
    );

    // 获取刚创建的用户信息
    const newUser = db.query(
      'SELECT id, username, nickname as realName, email, status FROM sys_user WHERE username = ?',
      [username],
    );

    return useResponseSuccess({
      user: newUser[0],
      message:
        localeMessages.accountCreatedDisabled ||
        'Account created successfully. Please contact the administrator to enable your account.',
    });
  } catch (error) {
    console.error('注册失败:', error);
    setResponseStatus(event, 500);
    return useResponseError(
      'ServerException',
      localeMessages.failedToCreateAccount ||
        'Failed to create account. Please try again later.',
    );
  }
});
