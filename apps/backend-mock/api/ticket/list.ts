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
  const { page = 1, pageSize = 10, ticket_number, customer_id, type, status, creator, processor } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (ticket_number) {
    whereClause += ` AND ticket_number LIKE ?`;
    params.push(`%${ticket_number}%`);
  }
  
  if (customer_id) {
    whereClause += ` AND customer_id = ?`;
    params.push(customer_id);
  }
  
  if (type) {
    whereClause += ` AND type = ?`;
    params.push(type);
  }
  
  if (status) {
    whereClause += ` AND status = ?`;
    params.push(status);
  }
  
  if (creator) {
    whereClause += ` AND creator LIKE ?`;
    params.push(`%${creator}%`);
  }
  
  if (processor) {
    whereClause += ` AND processor LIKE ?`;
    params.push(`%${processor}%`);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_ticket WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, ticket_number, customer_id, type, description, status, creator, processor, created_at, updated_at FROM idh_ticket WHERE 1=1${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const tickets = dbManager.query(dataSql, [...params, limit, offset]);
  
  return usePageResponseSuccess(page, pageSize, tickets, { total });
});