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

  // 获取字典ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取数据库实例
  const db = await getDb();

  // 软删除字典数据，只能删除非系统内置的字典
  db.execute(
    `UPDATE sys_dict SET 
      is_deleted = 1, 
      deleted_by = ?, 
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND is_deleted = 0 AND is_system = 0`,
    [userinfo.id, id],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
