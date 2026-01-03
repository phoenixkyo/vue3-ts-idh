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
    name: roleName,
    roleCode: roleKey,
    remark: description = '',
    status = 1,
    sortOrder = 0,
    menuIds = [],
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 开始事务
  db.execute('BEGIN TRANSACTION;');

  try {
    // 插入角色基本信息
    db.execute(
      `INSERT INTO sys_role (
        role_name, 
        role_key, 
        description, 
        sort_order, 
        status, 
        is_deleted, 
        created_by, 
        updated_by
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        roleName,
        roleKey,
        description,
        sortOrder,
        status,
        userinfo.id,
        userinfo.id,
      ],
    );

    // 获取新插入角色的ID
    const roleId = db.query(`SELECT last_insert_rowid() as id`)[0].id;

    // 插入角色菜单关联
    if (menuIds && menuIds.length > 0) {
      for (const menuId of menuIds) {
        db.execute(
          `INSERT INTO sys_role_menu (role_id, menu_id, created_by, updated_by) 
           VALUES (?, ?, ?, ?)`,
          [roleId, menuId, userinfo.id, userinfo.id],
        );
      }
    }

    // 提交事务
    db.execute('COMMIT;');
  } catch (error) {
    // 回滚事务
    db.execute('ROLLBACK;');
    throw error;
  }

  await sleep(300);
  return useResponseSuccess(null);
});
