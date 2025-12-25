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
  const { page = 1, pageSize = 10, customer_id, payment_date, payment_method } = query as any;

  const dbManager = await getDBManager();
  
  // 构建查询条件
  let whereClause = '';
  const params: any[] = [];
  
  if (customer_id) {
    whereClause += ` AND customer_id = ?`;
    params.push(customer_id);
  }
  
  if (payment_date) {
    whereClause += ` AND DATE(payment_date) = ?`;
    params.push(payment_date);
  }
  
  if (payment_method) {
    whereClause += ` AND payment_method = ?`;
    params.push(payment_method);
  }
  
  // 获取总数
  const countSql = `SELECT COUNT(*) as total FROM idh_payment_record WHERE 1=1${whereClause}`;
  const countResult = dbManager.query(countSql, params);
  const total = countResult[0] ? countResult[0].total : 0;
  
  // 获取分页数据
  const limit = Number(pageSize);
  const offset = (Number(page) - 1) * limit;
  const dataSql = `SELECT id, customer_id, bill_ids, total_amount, paid_amount, change_amount, payment_date, payment_method, created_at FROM idh_payment_record WHERE 1=1${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
  const paymentRecords = dbManager.query(dataSql, [...params, limit, offset]);
  
  // 处理bill_ids字段，转换为数组
  const processedRecords = paymentRecords.map(record => {
    let billIds = [];
    try {
      billIds = JSON.parse(record.bill_ids);
    } catch (e) {
      // 如果解析失败，尝试其他格式
      billIds = record.bill_ids.split(',').map(Number);
    }
    return {
      ...record,
      bill_ids: billIds
    };
  });
  
  return usePageResponseSuccess(page, pageSize, processedRecords, { total });
});