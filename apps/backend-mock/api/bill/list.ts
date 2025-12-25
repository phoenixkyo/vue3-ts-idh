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
  const { page = 1, pageSize = 10, customer_id, heating_season, payment_status } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (customer_id) {
    whereClause += ` AND customer_id = ?`;
    params.push(customer_id);
  }
  
  if (heating_season) {
    whereClause += ` AND heating_season = ?`;
    params.push(heating_season);
  }
  
  if (payment_status) {
    whereClause += ` AND payment_status = ?`;
    params.push(payment_status);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_bill WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, customer_id, heating_season, payment_status, fee_type, should_pay, actual_pay, arrears, created_at, updated_at FROM idh_bill WHERE 1=1${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const bills = dbManager.query(dataSql, [...params, limit, offset]);
  
  return usePageResponseSuccess(page, pageSize, bills, { total });
});