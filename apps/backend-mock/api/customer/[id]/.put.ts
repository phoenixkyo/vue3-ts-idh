import { eventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params as { id: string };
  const body = await readBody(event);
  const { community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay } = body;

  if (!id || !community_id || !building || !unit || !room || !owner_name || !phone || !area || !heating_season || !payment_status || !fee_type || !should_pay || actual_pay === undefined) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否存在
    const existingCustomer = dbManager.query('SELECT id FROM idh_customer WHERE id = ?', [id]);
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 检查客户信息是否已被其他客户使用
    const duplicateCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE community_id = ? AND building = ? AND unit = ? AND room = ? AND id != ?',
      [community_id, building, unit, room, id]
    );
    if (duplicateCustomer.length > 0) {
      return useResponseError('ConflictException', 'Customer information already exists');
    }

    // 计算欠费金额
    const arrears = should_pay - actual_pay;

    // 更新客户数据
    dbManager.execute(
      'UPDATE idh_customer SET community_id = ?, building = ?, unit = ?, room = ?, owner_name = ?, phone = ?, area = ?, heating_season = ?, payment_status = ?, fee_type = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, id]
    );

    // 获取更新后的客户数据
    const updatedCustomer = dbManager.query(
      'SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE id = ?',
      [id]
    );

    // 更新对应的账单数据
    dbManager.execute(
      'UPDATE idh_bill SET heating_season = ?, payment_status = ?, fee_type = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?',
      [heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, id]
    );

    return useResponseSuccess(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    return useResponseError('InternalServerError', 'Failed to update customer');
  }
});