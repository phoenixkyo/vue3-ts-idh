import { eventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  try {
    // 获取数据库实例
    const db = await getDb();

    // 根据用户ID获取角色ID列表
    const roleIdsResult = db.query(
      `SELECT role_id FROM sys_user_role WHERE user_id = ? AND is_deleted = 0`,
      [userinfo.id],
    );

    const roleIds = roleIdsResult.map((item: any) => item.role_id);

    if (roleIds.length === 0) {
      return useResponseSuccess([]);
    }

    // 根据角色ID获取菜单ID列表
    const menuIdsResult = db.query(
      `SELECT DISTINCT menu_id FROM sys_role_menu WHERE role_id IN (${roleIds.map(() => '?').join(',')}) AND is_deleted = 0`,
      roleIds,
    );

    const menuIds = menuIdsResult.map((item: any) => item.menu_id);

    if (menuIds.length === 0) {
      return useResponseSuccess([]);
    }

    // 获取菜单信息
    const menus = db.query(
      `SELECT * FROM sys_menu WHERE id IN (${menuIds.map(() => '?').join(',')}) AND status = 1 AND is_deleted = 0 ORDER BY sort_order ASC`,
      menuIds,
    );

    // 将菜单转换为树形结构
    const buildMenuTree = (menuList: any[], parentId: number = 0) => {
      return menuList
        .filter((menu) => menu.parent_id === parentId)
        .map((menu) => {
          const children = buildMenuTree(menuList, menu.id);
          const menuTypeMap = {
            1: 'catalog',
            2: 'menu',
            3: 'button',
          };

          const menuItem = {
            id: menu.id,
            name: menu.menu_name,
            path: menu.path,
            component: menu.component,
            redirect: menu.redirect,
            type: menuTypeMap[menu.menu_type],
            status: menu.status,
            meta: {
              title: menu.meta_title,
              icon: menu.icon,
              order: menu.sort_order,
              hidden: menu.hidden,
              keepAlive: menu.keep_alive,
              affix: menu.affix,
            },
          };

          if (children.length > 0) {
            (menuItem as any).children = children;
          }

          return menuItem;
        });
    };

    const menuTree = buildMenuTree(menus);

    return useResponseSuccess(menuTree);
  } catch (error) {
    console.error('获取菜单失败:', error);
    return useResponseSuccess([]);
  }
});
