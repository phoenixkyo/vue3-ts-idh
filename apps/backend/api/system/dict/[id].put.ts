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

  // 获取字典ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const {
    dictType,
    dictCode,
    dictValue,
    dictLabel,
    description = '',
    sortOrder = 0,
    isDefault = 0,
    cssClass = '',
    listClass = '',
    status = 1,
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 更新字典数据
  db.execute(
    `UPDATE sys_dict SET 
      dict_type = ?, 
      dict_code = ?, 
      dict_value = ?, 
      dict_label = ?, 
      description = ?, 
      sort_order = ?, 
      is_default = ?, 
      css_class = ?, 
      list_class = ?, 
      status = ?, 
      updated_by = ?
    WHERE id = ? AND is_deleted = 0 AND is_system = 0`,
    [
      dictType,
      dictCode,
      dictValue,
      dictLabel,
      description,
      sortOrder,
      isDefault,
      cssClass,
      listClass,
      status,
      userinfo.id,
      id,
    ],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
