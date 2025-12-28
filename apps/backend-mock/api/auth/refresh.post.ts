import { defineEventHandler } from 'h3';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { getDb } from '~/utils/db';
import { generateAccessToken, verifyRefreshToken } from '~/utils/jwt-utils';
import { forbiddenResponse } from '~/utils/response';

export default defineEventHandler(async (event) => {
  const refreshToken = getRefreshTokenFromCookie(event);
  if (!refreshToken) {
    return forbiddenResponse(event);
  }

  clearRefreshTokenCookie(event);

  const userinfo = verifyRefreshToken(refreshToken);
  if (!userinfo) {
    return forbiddenResponse(event);
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
      return forbiddenResponse(event);
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
    return forbiddenResponse(event);
  }
});
