import { eventHandler, readBody } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseError, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const { id } = event.context.params as { id: string };
  const body = await readBody(event);
  const { name, address, buildingArea, buildingCount, unitCount, householdCount, propertyType } = body;

  if (!id || !name || !address || !buildingArea || !buildingCount || !unitCount || !householdCount || !propertyType) {
    return useResponseError('BadRequestException', 'All fields are required');
  }

  const dbManager = await getDBManager();
  try {
    // 检查小区是否存在
    const existingCommunity = dbManager.query('SELECT id FROM idh_community WHERE id = ?', [id]);
    if (existingCommunity.length === 0) {
      return useResponseError('NotFoundException', 'Community not found');
    }

    // 检查小区名称是否已被其他小区使用
    const duplicateCommunity = dbManager.query('SELECT id FROM idh_community WHERE name = ? AND id != ?', [name, id]);
    if (duplicateCommunity.length > 0) {
      return useResponseError('ConflictException', 'Community name already exists');
    }

    // 更新小区数据
    dbManager.execute(
      'UPDATE idh_community SET name = ?, address = ?, building_area = ?, building_count = ?, unit_count = ?, household_count = ?, property_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, address, buildingArea, buildingCount, unitCount, householdCount, propertyType, id]
    );

    // 获取更新后的小区数据
    const updatedCommunity = dbManager.query('SELECT id, name, address, building_area as buildingArea, building_count as buildingCount, unit_count as unitCount, household_count as householdCount, property_type as propertyType, created_at as createdAt, updated_at as updatedAt FROM idh_community WHERE id = ?', [id]);

    return useResponseSuccess(updatedCommunity[0]);
  } catch (error) {
    console.error('Error updating community:', error);
    return useResponseError('InternalServerError', 'Failed to update community');
  }
});