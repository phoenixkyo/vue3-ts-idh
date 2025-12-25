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
  const { community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay } = body;

  if (!community_id || !building || !unit || !room || !owner_name || !phone || !area || !heating_season || !payment_status || !fee_type || !should_pay) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否已存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE community_id = ? AND building = ? AND unit = ? AND room = ?',
      [community_id, building, unit, room]
    );
    if (existingCustomer.length > 0) {
      return useResponseError('ConflictException', 'Customer already exists');
    }

    // 计算实际支付和欠费金额
    const actual_pay = 0;
    const arrears = should_pay;

    // 插入客户数据
    dbManager.execute(
      'INSERT INTO idh_customer (community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears]
    );

    // 获取刚插入的客户数据
    const newCustomer = dbManager.query(
      'SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE community_id = ? AND building = ? AND unit = ? AND room = ?',
      [community_id, building, unit, room]
    );

    // 同时创建账单数据
    dbManager.execute(
      'INSERT INTO idh_bill (customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newCustomer[0].id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears]
    );

    return useResponseSuccess(newCustomer[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    return useResponseError('InternalServerError', 'Failed to create customer');
  }
});