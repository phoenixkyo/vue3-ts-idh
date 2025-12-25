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
    return useResponseError('BadRequestException', 'Temperature Record ID is required');
  }

  const dbManager = await getDBManager();
  try {
    const temperatureRecord = dbManager.query(
      'SELECT id, ticket_id, customer_id, customer_name, customer_phone, community, building, unit, room, measurement_date, measurement_value, measurement_person, notes, created_at FROM idh_temperature_record WHERE id = ?',
      [id]
    );

    if (temperatureRecord.length === 0) {
      return useResponseError('NotFoundException', 'Temperature Record not found');
    }

    return useResponseSuccess(temperatureRecord[0]);
  } catch (error) {
    console.error('Error getting temperature record:', error);
    return useResponseError('InternalServerError', 'Failed to get temperature record');
  }
});