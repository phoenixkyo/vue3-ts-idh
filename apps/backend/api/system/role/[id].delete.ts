import fs from 'node:fs';
import path from 'node:path';

import { eventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import {
  sleep,
  unAuthorizedResponse,
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

  // 获取数据库实例
  const db = await getDb();

  // 开始事务
  db.exec('BEGIN TRANSACTION;');

  try {
    // 软删除角色基本信息
    db.execute(
      `UPDATE sys_role SET 
        is_deleted = 1, 
        deleted_by = ?, 
        deleted_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_deleted = 0`,
      [userinfo.id, id],
      true,
    );

    // 删除角色菜单关联
    db.execute(`DELETE FROM sys_role_menu WHERE role_id = ?`, [id], true);

    // 删除用户角色关联
    db.execute(`DELETE FROM sys_user_role WHERE role_id = ?`, [id], true);

    // 提交事务
    db.exec('COMMIT;');
    db.saveDB();
  } catch (error) {
    // 回滚事务
    db.exec('ROLLBACK;');
    throw error;
  }

  await sleep(300);
  return useResponseSuccess({
    message: localeMessages.roleDeleted || 'Role deleted successfully',
  });
});
