import { eventHandler } from 'h3';
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

  // 获取岗位ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取数据库实例
  const db = await getDb();

  // 软删除岗位数据
  db.execute(
    `UPDATE sys_post SET 
      is_deleted = 1, 
      deleted_by = ?, 
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_deleted = 0`,
    [userinfo.id, id],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
