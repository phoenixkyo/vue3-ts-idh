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
    const bill = dbManager.query(
      'SELECT id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_bill WHERE id = ?',
      [id]
    );

    if (bill.length === 0) {
      return useResponseError('NotFoundException', 'Bill not found');
    }

    return useResponseSuccess(bill[0]);
  } catch (error) {
    console.error('Error getting bill:', error);
    return useResponseError('InternalServerError', 'Failed to get bill');
  }
});