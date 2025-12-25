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
  const { ticket_id, status, operator_id, operator_name, action, notes } = body;

  if (!ticket_id || !status || !operator_id || !operator_name || !action) {
    return useResponseError('BadRequestException', 'All required fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查工单是否存在
    const existingTicket = dbManager.query(
      'SELECT id FROM idh_ticket WHERE id = ?',
      [ticket_id]
    );
    if (existingTicket.length === 0) {
      return useResponseError('NotFoundException', 'Ticket not found');
    }

    // 插入工作流记录
    dbManager.execute(
      'INSERT INTO idh_workflow (ticket_id, status, operator_id, operator_name, action, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [ticket_id, status, operator_id, operator_name, action, notes || '']
    );

    // 获取刚插入的工作流记录
    const newRecord = dbManager.query(
      'SELECT id, ticket_id, status, operator_id, operator_name, action, notes, created_at FROM idh_workflow WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1',
      [ticket_id]
    );

    // 更新工单状态
    dbManager.execute(
      'UPDATE idh_ticket SET status = ? WHERE id = ?',
      [status, ticket_id]
    );

    return useResponseSuccess(newRecord[0]);
  } catch (error) {
    console.error('Error creating workflow record:', error);
    return useResponseError('InternalServerError', 'Failed to create workflow record');
  }
});