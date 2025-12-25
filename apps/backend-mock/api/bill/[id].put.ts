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
    return useResponseError('BadRequestException', 'Bill ID is required');
  }

  const body = await readBody(event);
  const { customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears } = body;

  if (!customer_id || !heating_season || !payment_status || !fee_type || !should_pay || actual_pay === undefined || arrears === undefined) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查账单是否存在
    const existingBill = dbManager.query(
      'SELECT id FROM idh_bill WHERE id = ?',
      [id]
    );
    if (existingBill.length === 0) {
      return useResponseError('NotFoundException', 'Bill not found');
    }

    // 检查客户是否存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE id = ?',
      [customer_id]
    );
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 更新账单数据
    dbManager.execute(
      'UPDATE idh_bill SET customer_id = ?, heating_season = ?, payment_status = ?, fee_type = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, id]
    );

    // 更新关联的客户数据
    dbManager.execute(
      'UPDATE idh_customer SET payment_status = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [payment_status, should_pay, actual_pay, arrears, customer_id]
    );

    // 获取更新后的账单数据
    const updatedBill = dbManager.query(
      'SELECT id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_bill WHERE id = ?',
      [id]
    );

    return useResponseSuccess(updatedBill[0]);
  } catch (error) {
    console.error('Error updating bill:', error);
    return useResponseError('InternalServerError', 'Failed to update bill');
  }
});