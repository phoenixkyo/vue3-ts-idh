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
  const { page = 1, pageSize = 10, ticket_id, status, operator_name, action } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (ticket_id) {
    whereClause += ` AND ticket_id = ?`;
    params.push(ticket_id);
  }
  
  if (status) {
    whereClause += ` AND status = ?`;
    params.push(status);
  }
  
  if (operator_name) {
    whereClause += ` AND operator_name LIKE ?`;
    params.push(`%${operator_name}%`);
  }
  
  if (action) {
    whereClause += ` AND action LIKE ?`;
    params.push(`%${action}%`);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_workflow WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, ticket_id, status, operator_id, operator_name, action, notes, created_at FROM idh_workflow WHERE 1=1${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const workflowRecords = dbManager.query(dataSql, [...params, limit, offset]);
  
  return usePageResponseSuccess(page, pageSize, workflowRecords, { total });
});