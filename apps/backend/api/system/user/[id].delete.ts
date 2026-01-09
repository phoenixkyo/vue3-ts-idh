import fs from 'node:fs';
import path from 'node:path';

import { defineEventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

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

export default defineEventHandler(async (event) => {
  // 验证访问令牌，获取当前用户信息
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  const lang = getPreferredLanguage(event);
  const localeMessages = loadLocaleMessages(lang);

  // 获取用户ID
  const id = event.context.params.id;

  // 获取数据库实例
  const db = await getDb();

  // 事务激活标志，初始为false
  let transactionActive = false;

  try {
    // 开启事务
    db.exec('BEGIN TRANSACTION;');
    transactionActive = true; // 事务开启成功后标记

    // 软删除用户
    const deleteUserSql = `
      UPDATE sys_user
      SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
      WHERE id = ?
    `;
    db.execute(deleteUserSql, [userinfo.id, id], transactionActive);

    // 删除用户角色关联
    const deleteUserRoleSql = `DELETE FROM sys_user_role WHERE role_id = ?`;
    db.execute(deleteUserRoleSql, [id], transactionActive);

    // 提交事务
    db.exec('COMMIT;');
    transactionActive = false; // 事务提交成功后标记
    db.saveDB(); // 手动保存数据库
  } catch (error) {
    console.error('Transaction failed:', error);
    // 仅当事务已开启时才执行回滚
    if (transactionActive) {
      try {
        db.exec('ROLLBACK;'); // 回滚
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    throw error; // 抛出错误供上层处理
  }

  return useResponseSuccess({
    message: localeMessages.userDeleted || 'User deleted successfully',
  });
});
