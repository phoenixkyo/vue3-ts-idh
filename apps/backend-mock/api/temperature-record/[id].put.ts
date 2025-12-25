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
    return useResponseError('BadRequestException', 'Temperature Record ID is required');
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
    // 检查测温记录是否存在
    const existingRecord = dbManager.query(
      'SELECT id FROM idh_temperature_record WHERE id = ?',
      [id]
    );
    if (existingRecord.length === 0) {
      return useResponseError('NotFoundException', 'Temperature Record not found');
    }

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

    // 更新测温记录
    dbManager.execute(
      `UPDATE idh_temperature_record SET 
        ticket_id = ?, customer_id = ?, customer_name = ?, customer_phone = ?, 
        community = ?, building = ?, unit = ?, room = ?, measurement_date = ?, 
        measurement_value = ?, measurement_person = ?, notes = ? 
      WHERE id = ?`,
      [
        ticket_id, customer_id, customer_name, customer_phone,
        community, building, unit, room, measurement_date,
        measurement_value, measurement_person, notes || '',
        id
      ]
    );

    // 获取更新后的测温记录
    const updatedRecord = dbManager.query(
      `SELECT id, ticket_id, customer_id, customer_name, customer_phone, 
              community, building, unit, room, measurement_date, 
              measurement_value, measurement_person, notes, created_at 
       FROM idh_temperature_record 
       WHERE id = ?`,
      [id]
    );

    return useResponseSuccess(updatedRecord[0]);
  } catch (error) {
    console.error('Error updating temperature record:', error);
    return useResponseError('InternalServerError', 'Failed to update temperature record');
  }
});