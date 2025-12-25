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
    return useResponseError('BadRequestException', 'Ticket ID is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查工单是否存在
    const existingTicket = dbManager.query(
      'SELECT id FROM idh_ticket WHERE id = ?',
      [id]
    );
    if (existingTicket.length === 0) {
      return useResponseError('NotFoundException', 'Ticket not found');
    }

    // 开始事务
    dbManager.execute('BEGIN TRANSACTION');

    try {
      // 删除关联的测温记录
      dbManager.execute(
        'DELETE FROM idh_temperature_record WHERE ticket_id = ?',
        [id]
      );

      // 删除关联的工作流记录
      dbManager.execute(
        'DELETE FROM idh_workflow WHERE ticket_id = ?',
        [id]
      );

      // 删除工单
      dbManager.execute(
        'DELETE FROM idh_ticket WHERE id = ?',
        [id]
      );

      // 提交事务
      dbManager.execute('COMMIT');

      return useResponseSuccess(null, 'Ticket deleted successfully');
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error deleting ticket:', error);
      return useResponseError('InternalServerError', 'Failed to delete ticket');
    }
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return useResponseError('InternalServerError', 'Failed to delete ticket');
  }
});