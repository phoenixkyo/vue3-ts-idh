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
    return useResponseError('BadRequestException', 'Workflow Record ID is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查工作流记录是否存在
    const existingRecord = dbManager.query(
      'SELECT id, ticket_id FROM idh_workflow WHERE id = ?',
      [id]
    );
    if (existingRecord.length === 0) {
      return useResponseError('NotFoundException', 'Workflow Record not found');
    }

    const ticketId = existingRecord[0].ticket_id;

    // 删除工作流记录
    dbManager.execute(
      'DELETE FROM idh_workflow WHERE id = ?',
      [id]
    );

    // 检查是否还有其他工作流记录
    const remainingWorkflow = dbManager.query(
      'SELECT status FROM idh_workflow WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1',
      [ticketId]
    );

    if (remainingWorkflow.length > 0) {
      // 如果还有其他工作流记录，将工单状态更新为最新的工作流状态
      dbManager.execute(
        'UPDATE idh_ticket SET status = ? WHERE id = ?',
        [remainingWorkflow[0].status, ticketId]
      );
    } else {
      // 如果没有其他工作流记录，将工单状态更新为初始状态
      dbManager.execute(
        'UPDATE idh_ticket SET status = ? WHERE id = ?',
        ['待处理', ticketId]
      );
    }

    return useResponseSuccess(null, 'Workflow record deleted successfully');
  } catch (error) {
    console.error('Error deleting workflow record:', error);
    return useResponseError('InternalServerError', 'Failed to delete workflow record');
  }
});
