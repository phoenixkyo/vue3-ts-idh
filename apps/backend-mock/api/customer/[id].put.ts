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
    return useResponseError('BadRequestException', 'Customer ID is required');
  }

  const body = await readBody(event);
  const { community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay } = body;

  if (!community_id || !building || !unit || !room || !owner_name || !phone || !area || !heating_season || !payment_status || !fee_type || !should_pay) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE id = ?',
      [id]
    );
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 检查是否有其他客户使用相同的房产信息
    const duplicateCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE community_id = ? AND building = ? AND unit = ? AND room = ? AND id != ?',
      [community_id, building, unit, room, id]
    );
    if (duplicateCustomer.length > 0) {
      return useResponseError('ConflictException', 'Customer with this property already exists');
    }

    // 计算实际支付和欠费金额
    const actual_pay = 0; // 实际支付金额需要根据收费记录更新，这里简化处理
    const arrears = should_pay - actual_pay;

    // 更新客户数据
    dbManager.execute(
      'UPDATE idh_customer SET community_id = ?, building = ?, unit = ?, room = ?, owner_name = ?, phone = ?, area = ?, heating_season = ?, payment_status = ?, fee_type = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, id]
    );

    // 更新关联的账单数据
    dbManager.execute(
      'UPDATE idh_bill SET heating_season = ?, payment_status = ?, fee_type = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?',
      [heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, id]
    );

    // 获取更新后的客户数据
    const updatedCustomer = dbManager.query(
      'SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE id = ?',
      [id]
    );

    return useResponseSuccess(updatedCustomer[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    return useResponseError('InternalServerError', 'Failed to update customer');
  }
});