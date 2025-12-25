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
    return useResponseError('BadRequestException', 'Customer ID is required');
  }

  const dbManager = await getDBManager();
  try {
    const customer = dbManager.query(
      'SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE id = ?',
      [id]
    );

    if (customer.length === 0) {
      return useResponseError('NotFoundException', 'Customer not found');
    }

    return useResponseSuccess(customer[0]);
  } catch (error) {
    console.error('Error getting customer:', error);
    return useResponseError('InternalServerError', 'Failed to get customer');
  }
});