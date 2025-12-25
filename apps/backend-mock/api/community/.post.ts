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
  const { name, address, buildingArea, buildingCount, unitCount, householdCount, propertyType } = body;

  if (!name || !address || !buildingArea || !buildingCount || !unitCount || !householdCount || !propertyType) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查小区是否已存在
    const existingCommunity = dbManager.query('SELECT id FROM idh_community WHERE name = ?', [name]);
    if (existingCommunity.length > 0) {
      return useResponseError('ConflictException', 'Community already exists');
    }

    // 插入小区数据
    dbManager.execute(
      'INSERT INTO idh_community (name, address, building_area, building_count, unit_count, household_count, property_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, address, buildingArea, buildingCount, unitCount, householdCount, propertyType]
    );

    // 获取刚插入的小区数据
    const newCommunity = dbManager.query('SELECT id, name, address, building_area as buildingArea, building_count as buildingCount, unit_count as unitCount, household_count as householdCount, property_type as propertyType, created_at as createdAt, updated_at as updatedAt FROM idh_community WHERE name = ?', [name]);

    // 插入小区配置数据
    dbManager.execute(
      'INSERT INTO idh_community_config (community_id, is_default, unit_price, change_amount) VALUES (?, ?, ?, ?)',
      [newCommunity[0].id, 0, 5.80, 0]
    );

    return useResponseSuccess(newCommunity[0]);
  } catch (error) {
    console.error('Error creating community:', error);
    return useResponseError('InternalServerError', 'Failed to create community');
  }
});