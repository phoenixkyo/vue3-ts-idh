import { eventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params;
  const body = await readBody(event);
  const { dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin, status } = body;

  if (!id) {
    return useResponseError('BadRequestException', 'User ID is required');
  }

  const dbManager = await getDBManager();
  
  // 检查用户是否存在
  const existingUser = dbManager.query('SELECT * FROM idh_user WHERE id = ?', [id]);
  if (existingUser.length === 0) {
    return useResponseError('BadRequestException', 'User not found');
  }

  try {
    // 更新用户信息
    if (password) {
      dbManager.execute(
        'UPDATE idh_user SET dept_id = ?, post_id = ?, username = ?, nickname = ?, real_name = ?, gender = ?, phone = ?, email = ?, password = ?, is_admin = ?, status = ? WHERE id = ?',
        [dept_id, post_id, username, nickname, real_name, gender, phone, email, password, is_admin, status, id]
      );
    } else {
      dbManager.execute(
        'UPDATE idh_user SET dept_id = ?, post_id = ?, username = ?, nickname = ?, real_name = ?, gender = ?, phone = ?, email = ?, is_admin = ?, status = ? WHERE id = ?',
        [dept_id, post_id, username, nickname, real_name, gender, phone, email, is_admin, status, id]
      );
    }

    return useResponseSuccess({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Failed to update user:', error);
    return useResponseError('InternalServerError', 'Failed to update user');
  }
});