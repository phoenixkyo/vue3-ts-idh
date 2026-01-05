import fs from 'node:fs';
import path from 'node:path';

import { defineEventHandler } from 'h3';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
} from '~/utils/cookie-utils';
import { useResponseSuccess } from '~/utils/response';

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

  clearRefreshTokenCookie(event);

  if (!refreshToken) {
    return useResponseSuccess({
      message: localeMessages.logoutSuccess || 'Logout successful',
    });
  }

  return useResponseSuccess({
    message: localeMessages.logoutSuccess || 'Logout successful',
  });
});
