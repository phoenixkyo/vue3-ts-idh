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
    return useResponseError('BadRequestException', 'Ticket ID is required');
  }

  const body = await readBody(event);
  const { customer_id, type, description, status, processor } = body;

  if (!customer_id || !type || !description || !status || !processor) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查工单是否存在
    const existingTicket = dbManager.query(
      'SELECT id, status FROM idh_ticket WHERE id = ?',
      [id]
    );
    if (existingTicket.length === 0) {
      return useResponseError('NotFoundException', 'Ticket not found');
    }

    // 检查客户是否存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE id = ?',
      [customer_id]
    );
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 更新工单数据
    dbManager.execute(
      'UPDATE idh_ticket SET customer_id = ?, type = ?, description = ?, status = ?, processor = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer_id, type, description, status, processor, id]
    );

    // 获取更新后的工单数据
    const updatedTicket = dbManager.query(
      'SELECT id, ticket_number, customer_id, type, description, status, creator, processor, created_at, updated_at FROM idh_ticket WHERE id = ?',
      [id]
    );

    // 创建工作流记录，记录状态变更
    const oldStatus = existingTicket[0].status;
    if (oldStatus !== status) {
      dbManager.execute(
        'INSERT INTO idh_workflow (ticket_id, status, operator_id, operator_name, action, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [id, status, userinfo.id, userinfo.realName, '工单状态变更', `从${oldStatus}变更为${status}`]
      );
    }

    return useResponseSuccess(updatedTicket[0]);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return useResponseError('InternalServerError', 'Failed to update ticket');
  }
});