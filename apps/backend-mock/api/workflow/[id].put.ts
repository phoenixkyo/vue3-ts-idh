import { eventHandler, getRouterParam, readBody } from 'h3';
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

  const body = await readBody(event);
  const { status, operator_id, operator_name, action, notes } = body;

  if (!status || !operator_id || !operator_name || !action) {
    return useResponseError('BadRequestException', 'All required fields are required');
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

    // 更新工作流记录
    dbManager.execute(
      'UPDATE idh_workflow SET status = ?, operator_id = ?, operator_name = ?, action = ?, notes = ? WHERE id = ?',
      [status, operator_id, operator_name, action, notes || '', id]
    );

    // 获取更新后的工作流记录
    const updatedRecord = dbManager.query(
      'SELECT id, ticket_id, status, operator_id, operator_name, action, notes, created_at FROM idh_workflow WHERE id = ?',
      [id]
    );

    // 更新工单状态为最新的工作流状态
    const latestWorkflow = dbManager.query(
      'SELECT status FROM idh_workflow WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1',
      [ticketId]
    );

    if (latestWorkflow.length > 0) {
      dbManager.execute(
        'UPDATE idh_ticket SET status = ? WHERE id = ?',
        [latestWorkflow[0].status, ticketId]
      );
    }

    return useResponseSuccess(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating workflow record:', error);
    return useResponseError('InternalServerError', 'Failed to update workflow record');
  }
});