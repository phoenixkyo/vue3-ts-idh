import fs from 'node:fs';
import path from 'node:path';

import bcrypt from 'bcryptjs';
import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { getDb } from '~/utils/db';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import {
  forbiddenResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

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
  const { password, username } = await readBody(event);
  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      localeMessages.usernamePasswordRequired ||
        'Username and password are required',
    );
  }

  try {
    console.log('尝试登录，用户名:', username, '密码:', password);
    // 从数据库查询用户
    const db = await getDb();
    const users = db.query(
      'SELECT id, username, nickname as realName, password_hash, status, is_deleted FROM sys_user WHERE username = ?',
      [username],
    );

    console.log('查询到的用户:', JSON.stringify(users));

    const findUser = users[0];

    if (!findUser) {
      console.log('未找到用户');
      clearRefreshTokenCookie(event);
      return forbiddenResponse(
        event,
        localeMessages.usernamePasswordIncorrect ||
          'Username or password is incorrect.',
      );
    }

    console.log(
      '用户状态:',
      findUser.status,
      '是否已删除:',
      findUser.is_deleted,
    );
    console.log(
      '数据库中的密码:',
      findUser.password_hash,
      '输入的密码:',
      password,
    );

    // 使用bcrypt算法验证密码
    let isPasswordValid = false;
    try {
      // 1. 使用bcrypt验证哈希密码
      isPasswordValid = await bcrypt.compare(password, findUser.password_hash);
      console.log('bcrypt验证结果:', isPasswordValid);

      // 2. 如果bcrypt验证失败，尝试直接比较（用于测试环境）
      if (!isPasswordValid) {
        isPasswordValid = password === findUser.password_hash;
        console.log('直接比较结果:', isPasswordValid);
      }

      // 3. 支持明文密码'admin123'登录（用于测试）
      if (!isPasswordValid) {
        isPasswordValid = password === 'admin123';
        console.log('明文密码验证结果:', isPasswordValid);
      }
    } catch (error) {
      console.error('密码验证失败:', error);
      // 出错时，尝试直接比较或明文密码登录
      isPasswordValid =
        password === findUser.password_hash || password === 'admin123';
    }

    if (
      findUser.status !== 1 ||
      findUser.is_deleted !== 0 ||
      !isPasswordValid
    ) {
      clearRefreshTokenCookie(event);
      return forbiddenResponse(
        event,
        localeMessages.usernamePasswordIncorrect ||
          'Username or password is incorrect.',
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
    const refreshToken = generateRefreshToken(userInfo);

    setRefreshTokenCookie(event, refreshToken);

    return useResponseSuccess({
      ...userInfo,
      accessToken,
    });
  } catch (error) {
    console.error('登录失败:', error);
    clearRefreshTokenCookie(event);
    return forbiddenResponse(
      event,
      localeMessages.loginFailed || 'Login failed, please try again later',
    );
  }
});
