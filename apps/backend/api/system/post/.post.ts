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
    name: postName,
    code: postCode,
    remark: description = '',
    sortOrder = 0,
    status = 1,
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 插入岗位数据
  db.execute(
    `INSERT INTO sys_post (
      post_code, 
      post_name, 
      description, 
      sort_order, 
      status, 
      is_deleted, 
      created_by, 
      updated_by
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      postCode,
      postName,
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
