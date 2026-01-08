import fs from 'node:fs';
import path from 'node:path';

import { eventHandler, readBody } from 'h3';
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

  // 获取部门ID
  const id = event.context.params?.id;
  if (!id) {
    return useResponseSuccess(null);
  }

  // 获取请求体数据
  const body = await readBody(event);
  const {
    name: deptName,
    pid: parentId = 0,
    deptCode = '',
    remark: description = '',
    sortOrder = 0,
    status = 1,
  } = body;

  // 获取数据库实例
  const db = await getDb();

  // 开始事务
  db.exec('BEGIN TRANSACTION;');

  try {
    // 更新部门数据
    db.execute(
      `UPDATE sys_dept SET 
        dept_name = ?, 
        dept_code = ?, 
        parent_id = ?, 
        description = ?, 
        sort_order = ?, 
        status = ?, 
        updated_by = ?
      WHERE id = ? AND is_deleted = 0`,
      [
        deptName,
        deptCode,
        parentId,
        description,
        sortOrder,
        status,
        userinfo.id,
        id,
      ],
      true,
    );

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
    message: localeMessages.deptUpdated || 'Department updated successfully',
  });
});
