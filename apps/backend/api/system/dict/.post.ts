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

  // 插入字典数据
  db.execute(
    `INSERT INTO sys_dict (
      dict_type, 
      dict_code, 
      dict_value, 
      dict_label, 
      description, 
      sort_order, 
      is_system, 
      is_default, 
      css_class, 
      list_class, 
      status, 
      is_deleted, 
      created_by, 
      updated_by
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?)`,
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
      userinfo.id,
    ],
  );

  await sleep(300);
  return useResponseSuccess(null);
});
