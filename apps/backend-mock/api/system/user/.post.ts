import { eventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const body = await readBody(event);
  const { dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin = 0, status = 'active' } = body;

  if (!username || !password || !dept_id || !post_id) {
    return useResponseError('BadRequestException', 'Username, password, dept_id and post_id are required');
  }

  const dbManager = await getDBManager();
  
  // 检查用户名是否已存在
  const existingUser = dbManager.query('SELECT * FROM idh_user WHERE username = ?', [username]);
  if (existingUser.length > 0) {
    return useResponseError('BadRequestException', 'Username already exists');
  }

  try {
    dbManager.execute(
      'INSERT INTO idh_user (dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin, status]
    );

    return useResponseSuccess({ message: 'User created successfully' });
  } catch (error) {
    console.error('Failed to create user:', error);
    return useResponseError('InternalServerError', 'Failed to create user');
  }
});