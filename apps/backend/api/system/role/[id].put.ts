import fs from 'node:fs';
import path from 'node:path';

import { eventHandler, readBody } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  sleep,
  unAuthorizedResponse,
  useResponseErrorWithStatus,
  useResponseSuccess,
} from '~/utils/response';

// 读取国际化文件
function loadLocaleMessages(locale: string) {
  const localePath = path.resolve(
    process.cwd(),
    `../../packages/locales/src/langs/${locale}/authentication.json`,
  );

  try {
    if (fs.existsSync(localePath)) {
      const data = fs.readFileSync(localePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error);
  }

  // 加载默认语言（英文）
  const defaultPath = path.resolve(
    process.cwd(),
    '../../packages/locales/src/langs/en-US/authentication.json',
  );

  try {
    if (fs.existsSync(defaultPath)) {
      const data = fs.readFileSync(defaultPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load default locale messages:', error);
  }

  return {};
}

// 根据请求头获取语言偏好
function getPreferredLanguage(event: any): string {
  const acceptLanguage = event.node.req.headers['accept-language'] || 'en-US';
  return acceptLanguage.startsWith('zh') ? 'zh-CN' : 'en-US';
}

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const lang = getPreferredLanguage(event);
  const localeMessages = loadLocaleMessages(lang);

  // 获取角色ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const {
    name: roleName,
    roleKey,
    description = '',
    status = 1,
    sortOrder = 0,
    menuIds = [],
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 检查角色是否存在
  const checkRoleSql =
    'SELECT id FROM sys_role WHERE id = ? AND is_deleted = 0';
  const roleExists = db.query(checkRoleSql, [id]);
  if (roleExists.length === 0) {
    return useResponseSuccess(null);
  }

  // 先查询现有角色信息，用于处理部分更新
  const existingRoleSql =
    'SELECT role_name, role_key FROM sys_role WHERE id = ? AND is_deleted = 0';
  const existingRole = db.query(existingRoleSql, [id])[0];

  // 统一处理状态值
  let statusValue = status;
  if (typeof statusValue === 'boolean') {
    statusValue = statusValue ? 1 : 0;
  }

  // 使用现有值或新值
  const finalRoleName = roleName || existingRole?.role_name;
  const finalRoleKey = roleKey || existingRole?.role_key;

  // 检查角色标识是否已被其他角色使用
  if (roleKey && roleKey !== existingRole?.role_key) {
    const checkRoleKeySql = `
      SELECT id FROM sys_role 
      WHERE role_key = ? AND id != ? AND is_deleted = 0
    `;
    const roleKeyExists = db.query(checkRoleKeySql, [roleKey, id]);
    if (roleKeyExists.length > 0) {
      return useResponseErrorWithStatus(
        event,
        localeMessages.roleKeyAlreadyExists || 'Role key already exists',
      );
    }
  }

  // 更新角色基本信息
  db.execute(
    `UPDATE sys_role SET
      role_name = ?,
      role_key = ?,
      description = ?,
      sort_order = ?,
      status = ?,
      updated_by = ?
    WHERE id = ? AND is_deleted = 0`,
    [
      finalRoleName,
      finalRoleKey,
      description,
      sortOrder,
      statusValue,
      userinfo.id,
      id,
    ],
  );

  // 只有在提供了menuIds时才更新角色菜单关联
  if (menuIds !== undefined) {
    // 删除旧的角色菜单关联
    db.execute(`DELETE FROM sys_role_menu WHERE role_id = ?`, [id]);

    // 插入新的角色菜单关联
    if (menuIds.length > 0) {
      for (const menuId of menuIds) {
        db.execute(
          `INSERT INTO sys_role_menu (role_id, menu_id, created_by, updated_by)
           VALUES (?, ?, ?, ?)`,
          [id, menuId, userinfo.id, userinfo.id],
        );
      }
    }
  }

  await sleep(300);
  return useResponseSuccess({
    message: localeMessages.roleUpdated || 'Role updated successfully',
  });
});
