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
    return useResponseError('BadRequestException', 'Payment Record ID is required');
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
    // 检查收费记录是否存在
    const existingRecord = dbManager.query(
      'SELECT id, customer_id, bill_ids, payment_amount FROM idh_payment_record WHERE id = ?',
      [id]
    );
    if (existingRecord.length === 0) {
      return useResponseError('NotFoundException', 'Payment Record not found');
    }

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
      // 保存旧的支付信息，用于后续恢复
      const oldRecord = existingRecord[0];
      let oldBillIdsArray = [];
      try {
        oldBillIdsArray = JSON.parse(oldRecord.bill_ids);
      } catch (e) {
        oldBillIdsArray = oldRecord.bill_ids.split(',').map(Number);
      }
      const oldPaymentAmount = oldRecord.payment_amount;

      // 首先恢复所有关联账单的支付状态
      for (const billId of oldBillIdsArray) {
        const bill = dbManager.query(
          'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE id = ?',
          [billId]
        );

        if (bill.length > 0) {
          const currentBill = bill[0];
          const restoredActualPay = currentBill.actual_pay - oldPaymentAmount / oldBillIdsArray.length;
          const restoredArrears = Math.max(0, currentBill.should_pay - restoredActualPay);
          const restoredStatus = restoredArrears === 0 ? '已缴费' : '部分缴费';

          dbManager.execute(
            'UPDATE idh_bill SET actual_pay = ?, arrears = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [restoredActualPay, restoredArrears, restoredStatus, billId]
          );
        }
      }

      // 更新收费记录
      dbManager.execute(
        'UPDATE idh_payment_record SET customer_id = ?, bill_ids = ?, payment_amount = ?, payment_date = ?, payment_method = ?, operator = ?, notes = ? WHERE id = ?',
        [customer_id, billIdsJson, payment_amount, payment_date, payment_method, operator, notes || '', id]
      );

      // 更新新的关联账单的支付状态和金额
      for (const billId of billIdsArray) {
        const bill = dbManager.query(
          'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE id = ?',
          [billId]
        );

        if (bill.length > 0) {
          const currentBill = bill[0];
          const newActualPay = currentBill.actual_pay + payment_amount / billIdsArray.length;
          const newArrears = Math.max(0, currentBill.should_pay - newActualPay);
          const newStatus = newArrears === 0 ? '已缴费' : '部分缴费';

          dbManager.execute(
            'UPDATE idh_bill SET actual_pay = ?, arrears = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newActualPay, newArrears, newStatus, billId]
          );
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

      // 获取更新后的收费记录
      const updatedRecord = dbManager.query(
        'SELECT id, customer_id, bill_ids, payment_amount, payment_date, payment_method, operator, notes, created_at FROM idh_payment_record WHERE id = ?',
        [id]
      );

      // 处理返回数据的bill_ids字段
      const processedRecord = {
        ...updatedRecord[0],
        bill_ids: billIdsArray
      };

      return useResponseSuccess(processedRecord);
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error updating payment record:', error);
      return useResponseError('InternalServerError', 'Failed to update payment record');
    }
  } catch (error) {
    console.error('Error updating payment record:', error);
    return useResponseError('InternalServerError', 'Failed to update payment record');
  }
});