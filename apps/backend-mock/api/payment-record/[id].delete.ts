import { eventHandler, getRouterParam } from 'h3';
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

    const record = existingRecord[0];
    const customerId = record.customer_id;
    const paymentAmount = record.payment_amount;

    // 解析bill_ids数组
    let billIdsArray = [];
    try {
      billIdsArray = JSON.parse(record.bill_ids);
    } catch (e) {
      billIdsArray = record.bill_ids.split(',').map(Number);
    }

    // 开始事务
    dbManager.execute('BEGIN TRANSACTION');

    try {
      // 恢复所有关联账单的支付状态
      for (const billId of billIdsArray) {
        const bill = dbManager.query(
          'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE id = ?',
          [billId]
        );

        if (bill.length > 0) {
          const currentBill = bill[0];
          const restoredActualPay = currentBill.actual_pay - paymentAmount / billIdsArray.length;
          const restoredArrears = Math.max(0, currentBill.should_pay - restoredActualPay);
          const restoredStatus = restoredArrears === 0 ? '已缴费' : '部分缴费';

          dbManager.execute(
            'UPDATE idh_bill SET actual_pay = ?, arrears = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [restoredActualPay, restoredArrears, restoredStatus, billId]
          );
        }
      }

      // 删除收费记录
      dbManager.execute(
        'DELETE FROM idh_payment_record WHERE id = ?',
        [id]
      );

      // 更新客户的支付状态和金额
      const customerBills = dbManager.query(
        'SELECT should_pay, actual_pay, arrears FROM idh_bill WHERE customer_id = ?',
        [customerId]
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
        [totalShouldPay, totalActualPay, totalArrears, customerPaymentStatus, customerId]
      );

      // 提交事务
      dbManager.execute('COMMIT');

      return useResponseSuccess(null, 'Payment record deleted successfully');
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error deleting payment record:', error);
      return useResponseError('InternalServerError', 'Failed to delete payment record');
    }
  } catch (error) {
    console.error('Error deleting payment record:', error);
    return useResponseError('InternalServerError', 'Failed to delete payment record');
  }
});