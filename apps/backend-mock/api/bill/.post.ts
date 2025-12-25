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
  const { customer_id, heating_season, payment_status, fee_type, should_pay } = body;

  if (!customer_id || !heating_season || !payment_status || !fee_type || !should_pay) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否存在
    const existingCustomer = dbManager.query(
      'SELECT id FROM idh_customer WHERE id = ?',
      [customer_id]
    );
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 计算实际支付和欠费金额
    const actual_pay = 0;
    const arrears = should_pay;

    // 插入账单数据
    dbManager.execute(
      'INSERT INTO idh_bill (customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears]
    );

    // 获取刚插入的账单数据
    const newBill = dbManager.query(
      'SELECT id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_bill WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
      [customer_id]
    );

    return useResponseSuccess(newBill[0]);
  } catch (error) {
    console.error('Error creating bill:', error);
    return useResponseError('InternalServerError', 'Failed to create bill');
  }
});