import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params;

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
    // 删除用户
    dbManager.execute('DELETE FROM idh_user WHERE id = ?', [id]);
    // 删除关联的角色用户关系
    dbManager.execute('DELETE FROM idh_role_user WHERE user_id = ?', [id]);

    return useResponseSuccess({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return useResponseError('InternalServerError', 'Failed to delete user');
  }
});