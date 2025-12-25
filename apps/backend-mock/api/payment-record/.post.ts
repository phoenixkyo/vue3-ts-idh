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
  const { customer_id, bill_ids, payment_amount, payment_date, payment_method, operator, notes } = body;

  if (!customer_id || !bill_ids || !payment_amount || !payment_date || !payment_method || !operator) {
    return useResponseError('BadRequestException', 'All required fields are required');
  }

  // 确保bill_ids是数组格式
  const billIdsArray = Array.isArray(bill_ids) ? bill_ids : [bill_ids];
  const billIdsJson = JSON.stringify(billIdsArray);

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

    // 检查所有账单是否存在
    for (const billId of billIdsArray) {
      const existingBill = dbManager.query(
        'SELECT id FROM idh_bill WHERE id = ?',
        [billId]
      );
      if (existingBill.length === 0) {
        return useResponseError('NotFoundException', `Bill with ID ${billId} not found`);
      }
    }

    // 开始事务
    dbManager.execute('BEGIN TRANSACTION');

    try {
      // 插入收费记录
      dbManager.execute(
        'INSERT INTO idh_payment_record (customer_id, bill_ids, payment_amount, payment_date, payment_method, operator, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customer_id, billIdsJson, payment_amount, payment_date, payment_method, operator, notes || '']
      );

      // 获取刚插入的收费记录
      const newRecord = dbManager.query(
        'SELECT id, customer_id, bill_ids, payment_amount, payment_date, payment_method, operator, notes, created_at FROM idh_payment_record WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
        [customer_id]
      );

      // 更新相关账单的支付状态和金额
      let totalPaid = 0;
      for (const billId of billIdsArray) {
        // 获取当前账单信息
        const bill = dbManager.query(
          'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE id = ?',
          [billId]
        );

        if (bill.length > 0) {
          const currentBill = bill[0];
          const newActualPay = currentBill.actual_pay + payment_amount / billIdsArray.length;
          const newArrears = Math.max(0, currentBill.should_pay - newActualPay);
          const newStatus = newArrears === 0 ? '已缴费' : '部分缴费';

          // 更新账单
          dbManager.execute(
            'UPDATE idh_bill SET actual_pay = ?, arrears = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newActualPay, newArrears, newStatus, billId]
          );

          totalPaid += newActualPay;
        }
      }

      // 更新客户的支付状态和金额
      const customerBills = dbManager.query(
        'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE customer_id = ?',
        [customer_id]
      );

      let totalShouldPay = 0;
      let totalActualPay = 0;
      let totalArrears = 0;

      for (const bill of customerBills) {
        totalShouldPay += bill.should_pay;
        totalActualPay += bill.actual_pay;
        totalArrears += bill.arrears;
      }

      const customerPaymentStatus = totalArrears === 0 ? '已缴费' : totalArrears < totalShouldPay ? '部分缴费' : '未缴费';

      dbManager.execute(
        'UPDATE idh_customer SET should_pay = ?, actual_pay = ?, arrears = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [totalShouldPay, totalActualPay, totalArrears, customerPaymentStatus, customer_id]
      );

      // 提交事务
      dbManager.execute('COMMIT');

      // 处理返回数据的bill_ids字段
      const processedRecord = {
        ...newRecord[0],
        bill_ids: billIdsArray
      };

      return useResponseSuccess(processedRecord);
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error creating payment record:', error);
      return useResponseError('InternalServerError', 'Failed to create payment record');
    }
  } catch (error) {
    console.error('Error creating payment record:', error);
    return useResponseError('InternalServerError', 'Failed to create payment record');
  }
});
