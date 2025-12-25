import { eventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const dbManager = await getDBManager();
  const communities = dbManager.query(
    'SELECT id, name, address, building_area as buildingArea, building_count as buildingCount, unit_count as unitCount, household_count as householdCount, property_type as propertyType, created_at as createdAt, updated_at as updatedAt FROM idh_community ORDER BY id ASC'
  );

  return useResponseSuccess(communities);
});