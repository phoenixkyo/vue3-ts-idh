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
    return useResponseError('BadRequestException', 'Bill ID is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查账单是否存在
    const existingBill = dbManager.query(
      'SELECT id, customer_id FROM idh_bill WHERE id = ?',
      [id]
    );
    if (existingBill.length === 0) {
      return useResponseError('NotFoundException', 'Bill not found');
    }

    const customerId = existingBill[0].customer_id;

    // 开始事务
    dbManager.execute('BEGIN TRANSACTION');

    try {
      // 删除关联的收费记录（这里需要注意，收费记录的bill_ids是数组，需要处理）
      // 先查询所有包含该账单ID的收费记录
      const paymentRecords = dbManager.query(
        'SELECT id, bill_ids FROM idh_payment_record WHERE bill_ids LIKE ?',
        [`%${id}%`]
      );

      for (const record of paymentRecords) {
        // 解析bill_ids数组
        let billIds = [];
        try {
          billIds = JSON.parse(record.bill_ids);
        } catch (e) {
          // 如果解析失败，尝试其他格式
          billIds = record.bill_ids.split(',').map(Number);
        }

        // 移除要删除的账单ID
        const updatedBillIds = billIds.filter(billId => billId !== Number(id));

        if (updatedBillIds.length > 0) {
          // 如果还有其他账单ID，更新收费记录
          dbManager.execute(
            'UPDATE idh_payment_record SET bill_ids = ? WHERE id = ?',
            [JSON.stringify(updatedBillIds), record.id]
          );
        } else {
          // 如果没有其他账单ID，删除收费记录
          dbManager.execute(
            'DELETE FROM idh_payment_record WHERE id = ?',
            [record.id]
          );
        }
      }

      // 删除账单
      dbManager.execute(
        'DELETE FROM idh_bill WHERE id = ?',
        [id]
      );

      // 更新客户的默认账单状态（如果有其他账单）
      const remainingBills = dbManager.query(
        'SELECT * FROM idh_bill WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
        [customerId]
      );

      if (remainingBills.length > 0) {
        const latestBill = remainingBills[0];
        // 更新客户信息为最新账单的状态
        dbManager.execute(
          'UPDATE idh_customer SET payment_status = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [latestBill.payment_status, latestBill.should_pay, latestBill.actual_pay, latestBill.arrears, customerId]
        );
      } else {
        // 如果没有其他账单，重置客户的账单状态
        dbManager.execute(
          'UPDATE idh_customer SET payment_status = ?, should_pay = ?, actual_pay = ?, arrears = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['未缴费', 0, 0, 0, customerId]
        );
      }

      // 提交事务
      dbManager.execute('COMMIT');

      return useResponseSuccess(null, 'Bill deleted successfully');
    } catch (error) {
      // 回滚事务
      dbManager.execute('ROLLBACK');
      console.error('Error deleting bill:', error);
      return useResponseError('InternalServerError', 'Failed to delete bill');
    }
  } catch (error) {
    console.error('Error deleting bill:', error);
    return useResponseError('InternalServerError', 'Failed to delete bill');
  }
});