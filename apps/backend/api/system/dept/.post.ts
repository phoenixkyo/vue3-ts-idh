import { eventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  sleep,
  unAuthorizedResponse,
  useResponseSuccess,
} from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const {
    name: deptName,
    pid: parentId = 0,
    deptCode = '',
    remark: description = '',
    sortOrder = 0,
    status = 1,
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 插入部门数据
  db.execute(
    `INSERT INTO sys_dept (
      dept_code, 
      dept_name, 
      parent_id, 
      description, 
      sort_order, 
      status, 
      is_deleted, 
      created_by, 
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      deptCode,
      deptName,
      parentId,
      description,
      sortOrder,
      status,
      userinfo.id,
      userinfo.id,
    ],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
