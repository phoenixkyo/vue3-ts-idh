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
    const paymentRecord = dbManager.query(
      'SELECT id, customer_id, bill_ids, payment_amount, payment_date, payment_method, operator, notes, created_at FROM idh_payment_record WHERE id = ?',
      [id]
    );

    if (paymentRecord.length === 0) {
      return useResponseError('NotFoundException', 'Payment Record not found');
    }

    // 处理bill_ids字段，转换为数组
    let billIds = [];
    try {
      billIds = JSON.parse(paymentRecord[0].bill_ids);
    } catch (e) {
      // 如果解析失败，尝试其他格式
      billIds = paymentRecord[0].bill_ids.split(',').map(Number);
    }

    const processedRecord = {
      ...paymentRecord[0],
      bill_ids: billIds
    };

    return useResponseSuccess(processedRecord);
  } catch (error) {
    console.error('Error getting payment record:', error);
    return useResponseError('InternalServerError', 'Failed to get payment record');
  }
});
