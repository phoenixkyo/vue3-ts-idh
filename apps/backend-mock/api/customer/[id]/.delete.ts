import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params as { id: string };

  if (!id) {
    return useResponseError('BadRequestException', 'Customer id is required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查客户是否存在
    const existingCustomer = dbManager.query('SELECT id FROM idh_customer WHERE id = ?', [id]);
    if (existingCustomer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    // 删除对应的账单
    dbManager.execute('DELETE FROM idh_bill WHERE customer_id = ?', [id]);
    
    // 删除对应的工单
    dbManager.execute('DELETE FROM idh_ticket WHERE customer_id = ?', [id]);
    
    // 删除对应的收费记录
    dbManager.execute('DELETE FROM idh_payment_record WHERE customer_id = ?', [id]);
    
    // 删除对应的测温记录
    dbManager.execute('DELETE FROM idh_temperature_record WHERE customer_id = ?', [id]);
    
    // 删除客户
    dbManager.execute('DELETE FROM idh_customer WHERE id = ?', [id]);

    return useResponseSuccess({ id });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return useResponseError('InternalServerError', 'Failed to delete customer');
  }
});