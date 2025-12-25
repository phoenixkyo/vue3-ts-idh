import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params as { id: string };

  if (!id) {
    return useResponseError('BadRequestException', 'Community id is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查小区是否存在
    const existingCommunity = dbManager.query('SELECT id FROM idh_community WHERE id = ?', [id]);
    if (existingCommunity.length === 0) {
      return useResponseError('NotFoundException', 'Community not found');
    }

    // 删除小区配置
    dbManager.execute('DELETE FROM idh_community_config WHERE community_id = ?', [id]);
    
    // 删除小区
    dbManager.execute('DELETE FROM idh_community WHERE id = ?', [id]);

    return useResponseSuccess({ id });
  } catch (error) {
    console.error('Error deleting community:', error);
    return useResponseError('InternalServerError', 'Failed to delete community');
  }
});