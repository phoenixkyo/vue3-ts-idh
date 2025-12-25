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
  const { customer_id, type, description, status, creator, processor } = body;

  if (!customer_id || !type || !description || !status || !creator || !processor) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否存在
    const existingCustomer = dbManager.query('SELECT id FROM idh_customer WHERE id = ?', [customer_id]);
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 生成工单号（格式：GD+年月日+4位序号）
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const countSql = `SELECT COUNT(*) as count FROM idh_ticket WHERE ticket_number LIKE ?`;
    const countResult = dbManager.query(countSql, [`GD${dateStr}%`]);
    const seq = String(countResult[0].count + 1).padStart(4, '0');
    const ticket_number = `GD${dateStr}${seq}`;

    // 插入工单数据
    dbManager.execute(
      'INSERT INTO idh_ticket (ticket_number, customer_id, type, description, status, creator, processor) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [ticket_number, customer_id, type, description, status, creator, processor]
    );

    // 获取刚插入的工单数据
    const newTicket = dbManager.query(
      'SELECT id, ticket_number, customer_id, type, description, status, creator, processor, created_at, updated_at FROM idh_ticket WHERE ticket_number = ?',
      [ticket_number]
    );

    // 同时创建工作流记录
    dbManager.execute(
      'INSERT INTO idh_workflow (ticket_id, status, operator_id, operator_name, action, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [newTicket[0].id, status, userinfo.id, userinfo.realName, '创建工单', description]
    );

    return useResponseSuccess(newTicket[0]);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return useResponseError('InternalServerError', 'Failed to create ticket');
  }
});