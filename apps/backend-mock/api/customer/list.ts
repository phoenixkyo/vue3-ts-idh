import { eventHandler, getQuery } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, usePageResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const query = getQuery(event);
  const { page = 1, pageSize = 10, community_id, building, unit, room, owner_name, phone } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (community_id) {
    whereClause += ` AND community_id = ?`;
    params.push(community_id);
  }
  
  if (building) {
    whereClause += ` AND building LIKE ?`;
    params.push(`%${building}%`);
  }
  
  if (unit) {
    whereClause += ` AND unit LIKE ?`;
    params.push(`%${unit}%`);
  }
  
  if (room) {
    whereClause += ` AND room LIKE ?`;
    params.push(`%${room}%`);
  }
  
  if (owner_name) {
    whereClause += ` AND owner_name LIKE ?`;
    params.push(`%${owner_name}%`);
  }
  
  if (phone) {
    whereClause += ` AND phone LIKE ?`;
    params.push(`%${phone}%`);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_customer WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, community_id, building, unit, room, owner_name, phone, area, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_customer WHERE 1=1${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const customers = dbManager.query(dataSql, [...params, limit, offset]);
  
  return usePageResponseSuccess(page, pageSize, customers, { total });
});
