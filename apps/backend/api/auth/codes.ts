import { eventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  try {
    // 查询用户的权限码
    const db = await getDb();
    const codesResult = db.query(
      `SELECT DISTINCT m.permission 
       FROM sys_menu m 
       JOIN sys_role_menu rm ON m.id = rm.menu_id 
       JOIN sys_user_role ur ON rm.role_id = ur.role_id 
       WHERE ur.user_id = ? AND m.permission IS NOT NULL AND m.permission != '' 
         AND m.status = 1 AND m.is_deleted = 0 
         AND rm.is_deleted = 0 
         AND ur.is_deleted = 0`,
      [userinfo.id],
    );

    const codes = codesResult.map((item: any) => item.permission);

    return useResponseSuccess(codes);
  } catch (error) {
    console.error('获取权限码失败:', error);
    return useResponseSuccess([]);
  }
});
