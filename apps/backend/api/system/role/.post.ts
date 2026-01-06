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

  // 检查角色标识是否已存在（在事务外检查）
  if (roleKey) {
    const checkRoleKeySql = `
      SELECT id FROM sys_role 
      WHERE role_key = ? AND is_deleted = 0
    `;
    const roleKeyExists = db.query(checkRoleKeySql, [roleKey]);
    if (roleKeyExists.length > 0) {
      return useResponseErrorWithStatus(
        event,
        localeMessages.roleKeyAlreadyExists || 'Role key already exists',
      );
    }
  }

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
  return useResponseSuccess({
    message: localeMessages.roleCreated || 'Role created successfully',
  });
});
