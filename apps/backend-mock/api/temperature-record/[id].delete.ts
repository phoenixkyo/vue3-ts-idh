import { eventHandler, getRouterParam } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    return useResponseError('BadRequestException', 'Temperature Record ID is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查测温记录是否存在
    const existingRecord = dbManager.query(
      'SELECT id FROM idh_temperature_record WHERE id = ?',
      [id]
    );
    if (existingRecord.length === 0) {
      return useResponseError('NotFoundException', 'Temperature Record not found');
    }

    // 删除测温记录
    dbManager.execute(
      'DELETE FROM idh_temperature_record WHERE id = ?',
      [id]
    );

    return useResponseSuccess(null, 'Temperature record deleted successfully');
  } catch (error) {
    console.error('Error deleting temperature record:', error);
    return useResponseError('InternalServerError', 'Failed to delete temperature record');
  }
});