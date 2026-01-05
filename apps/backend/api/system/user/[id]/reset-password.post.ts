import fs from 'node:fs';
import path from 'node:path';

import bcrypt from 'bcrypt';
import { defineEventHandler } from 'h3';
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

  // 获取数据库实例
  const db = await getDb();

  // 检查用户是否存在
  const checkUserSql =
    'SELECT id FROM sys_user WHERE id = ? AND is_deleted = 0';
  const userExists = db.query(checkUserSql, [id]);
  if (userExists.length === 0) {
    return useResponseError(localeMessages.userNotFound || 'User not found');
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

  return useResponseSuccess({
    message:
      localeMessages.passwordResetSuccess ||
      'Password reset successfully, new password is: 123456',
  });
});
