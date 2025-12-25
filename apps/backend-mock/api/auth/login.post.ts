import { createHash } from 'node:crypto';

import { eventHandler, readBody, setResponseStatus } from 'h3';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from '~/utils/cookie-utils';
import { getDBManager } from '~/utils/db-manager';
import { generateAccessToken, generateRefreshToken } from '~/utils/jwt-utils';
import {
  forbiddenResponse,
  useResponseError,
  useResponseSuccess,
} from '~/utils/response';

// MD5哈希函数
const md5 = (str: string) => {
  return createHash('md5').update(str).digest('hex');
};

export default eventHandler(async (event) => {
  const { password, username } = await readBody(event);
  if (!password || !username) {
    setResponseStatus(event, 400);
    return useResponseError(
      'BadRequestException',
      'Username and password are required',
    );
  }

  console.log('登录请求:', { username, password });
  
  // 直接返回一个默认的用户对象，不依赖于数据库
  const findUser = {
    id: 1,
    username: 'admin',
    realName: '系统管理员',
    nickname: '管理员',
    email: 'admin@example.com',
    phone: '13800138000',
    gender: '男',
    dept_id: 1,
    post_id: 1,
    is_admin: 1,
    status: 'active',
    roles: [
      {
        id: 1,
        name: '超级管理员',
        description: '系统超级管理员',
        dataScope: '全部数据'
      }
    ],
    homePath: '/dashboard'
  };
  
  const accessToken = generateAccessToken(findUser);
  const refreshToken = generateRefreshToken(findUser);

  setRefreshTokenCookie(event, refreshToken);

  return useResponseSuccess({
    accessToken,
    userinfo: findUser,
    refreshToken,
  });
});
