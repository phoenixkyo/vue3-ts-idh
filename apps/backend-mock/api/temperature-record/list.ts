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
  const { page = 1, pageSize = 10, ticket_id, staff_name } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (ticket_id) {
    whereClause += ` AND ticket_id = ?`;
    params.push(ticket_id);
  }
  
  if (staff_name) {
    whereClause += ` AND staff_name LIKE ?`;
    params.push(`%${staff_name}%`);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_temperature_record WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, ticket_id, temperature, temperature_time, customer_id, staff_name, notes, created_at FROM idh_temperature_record WHERE 1=1${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const temperatureRecords = dbManager.query(dataSql, [...params, limit, offset]);
  
  return usePageResponseSuccess(page, pageSize, temperatureRecords, { total });
});