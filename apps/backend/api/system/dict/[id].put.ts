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

  // 开始事务
  db.exec('BEGIN TRANSACTION;');

  try {
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
    message: localeMessages.dictUpdated || 'Dictionary updated successfully',
  });
});
