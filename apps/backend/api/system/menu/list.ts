import { eventHandler } from 'h3';
import { getDb } from '~/utils/db';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取数据库实例
  const db = await getDb();

  // 查询所有菜单信息
  const menus = db.query(
    `SELECT id, parent_id as pid, menu_type as type, menu_name as name, permission as authCode, 
            path, component, redirect, external_link as link, icon, sort_order, hidden, 
            hide_children, keep_alive, affix, status, 
            meta_title, meta_ignore_auth, meta_hide_menu, meta_order_no as order, 
            meta_frame_src as iframeSrc
     FROM sys_menu 
     WHERE is_deleted = 0 
     ORDER BY sort_order ASC`,
  );

  // 将菜单转换为树形结构
  const buildMenuTree = (menuList: any[], parentId: number = 0) => {
    return menuList
      .filter((menu) => menu.pid === parentId)
      .map((menu) => {
        const children = buildMenuTree(menuList, menu.id);

        // 构建菜单对象
        const menuItem: any = {
          id: menu.id,
          name: menu.name,
          status: menu.status,
          type:
            menu.type === 1 ? 'catalog' : menu.type === 2 ? 'menu' : 'button',
          path: menu.path,
          authCode: menu.authCode,
          meta: {
            icon: menu.icon,
            title: menu.meta_title,
            order: menu.order,
          },
        };

        // 添加组件信息
        if (menu.component) {
          menuItem.component = menu.component;
        }

        // 添加重定向信息
        if (menu.redirect) {
          menuItem.redirect = menu.redirect;
        }

        // 添加外部链接信息
        if (menu.link) {
          menuItem.meta.link = menu.link;
        }

        // 添加内嵌iframe信息
        if (menu.iframeSrc) {
          menuItem.meta.iframeSrc = menu.iframeSrc;
        }

        // 添加子菜单
        if (children.length > 0) {
          menuItem.children = children;
        }

        return menuItem;
      });
  };

  const menuTree = buildMenuTree(menus);

  return useResponseSuccess(menuTree);
});
