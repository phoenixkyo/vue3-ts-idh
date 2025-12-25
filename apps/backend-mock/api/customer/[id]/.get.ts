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
    return useResponseError('BadRequestException', 'Customer id is required');
  }

  const dbManager = await getDBManager();
  try {
    // 查询客户详情
    const customers = dbManager.query(
      'SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE id = ?',
      [id]
    );

    if (customers.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 查询客户的账单信息
    const bills = dbManager.query(
      'SELECT id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_bill WHERE customer_id = ?',
      [id]
    );

    // 查询客户的工单信息
    const tickets = dbManager.query(
      'SELECT id, ticket_number, customer_id, type, description, status, creator, processor, created_at, updated_at FROM idh_ticket WHERE customer_id = ?',
      [id]
    );

    // 查询客户的收费记录
    const paymentRecords = dbManager.query(
      'SELECT id, payment_number, receipt_number, customer_id, bill_ids, total_amount, paid_amount, change_amount, payment_method, payment_date, created_at FROM idh_payment_record WHERE customer_id = ?',
      [id]
    );

    // 构建返回数据
    const customer = customers[0];
    customer.bills = bills;
    customer.tickets = tickets;
    customer.paymentRecords = paymentRecords;

    return useResponseSuccess(customer);
  } catch (error) {
    console.error('Error getting customer details:', error);
    return useResponseError('InternalServerError', 'Failed to get customer details');
  }
});