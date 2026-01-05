import fs from 'node:fs';
import path from 'node:path';

import { defineEventHandler } from 'h3';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { getDb } from '~/utils/db';
import { generateAccessToken, verifyRefreshToken } from '~/utils/jwt-utils';
import { forbiddenResponse } from '~/utils/response';

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
  const refreshToken = getRefreshTokenFromCookie(event);
  if (!refreshToken) {
    return forbiddenResponse(
      event,
      localeMessages.invalidToken || 'Invalid token',
    );
  }

  clearRefreshTokenCookie(event);

  const userinfo = await verifyRefreshToken(refreshToken);
  if (!userinfo) {
    return forbiddenResponse(
      event,
      localeMessages.invalidToken || 'Invalid token',
    );
  }

  try {
    // 从数据库查询用户
    const db = await getDb();
    const users = db.query(
      'SELECT id, username, nickname as realName, password_hash as password FROM sys_user WHERE username = ? AND status = 1 AND is_deleted = 0',
      [userinfo.username],
    );

    const findUser = users[0];
    if (!findUser) {
      return forbiddenResponse(
        event,
        localeMessages.userNotFound || 'User not found',
      );
    }

    // 获取用户角色
    const rolesResult = db.query(
      `SELECT r.role_key 
       FROM sys_role r 
       JOIN sys_user_role ur ON r.id = ur.role_id 
       WHERE ur.user_id = ? AND r.status = 1 AND r.is_deleted = 0`,
      [findUser.id],
    );

    const roles = rolesResult.map((item: any) => item.role_key);

    const userInfo = {
      ...findUser,
      roles,
    };

    const accessToken = generateAccessToken(userInfo);

    setRefreshTokenCookie(event, refreshToken);

    return accessToken;
  } catch (error) {
    console.error('刷新Token失败:', error);
    return forbiddenResponse(
      event,
      localeMessages.refreshTokenFailed || 'Failed to refresh token',
    );
  }
});
