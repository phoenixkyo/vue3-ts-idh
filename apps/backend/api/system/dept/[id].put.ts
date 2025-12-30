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

  // 获取部门ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
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

  // 更新部门数据
  db.execute(
    `UPDATE sys_dept SET 
      dept_name = ?, 
      dept_code = ?, 
      parent_id = ?, 
      description = ?, 
      sort_order = ?, 
      status = ?, 
      updated_by = ?
    WHERE id = ? AND is_deleted = 0`,
    [
      deptName,
      deptCode,
      parentId,
      description,
      sortOrder,
      status,
      userinfo.id,
      id,
    ],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
