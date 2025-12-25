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
  const {
    ticket_id,
    customer_id,
    customer_name,
    customer_phone,
    community,
    building,
    unit,
    room,
    measurement_date,
    measurement_value,
    measurement_person,
    notes
  } = body;

  if (!ticket_id || !customer_id || !customer_name || !customer_phone || !community || !building || !unit || !room || !measurement_date || !measurement_value || !measurement_person) {
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

    // 检查客户是否存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE id = ?',
      [customer_id]
    );
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 插入测温记录
    dbManager.execute(
      `INSERT INTO idh_temperature_record (
        ticket_id, customer_id, customer_name, customer_phone, 
        community, building, unit, room, measurement_date, 
        measurement_value, measurement_person, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_id, customer_id, customer_name, customer_phone,
        community, building, unit, room, measurement_date,
        measurement_value, measurement_person, notes || ''
      ]
    );

    // 获取刚插入的测温记录
    const newRecord = dbManager.query(
      `SELECT id, ticket_id, customer_id, customer_name, customer_phone, 
              community, building, unit, room, measurement_date, 
              measurement_value, measurement_person, notes, created_at 
       FROM idh_temperature_record 
       WHERE ticket_id = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [ticket_id]
    );

    return useResponseSuccess(newRecord[0]);
  } catch (error) {
    console.error('Error creating temperature record:', error);
    return useResponseError('InternalServerError', 'Failed to create temperature record');
  }
});