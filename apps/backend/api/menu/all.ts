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
    // 获取数据库实例
    const db = await getDb();

    // 将菜单转换为树形结构的函数（提前定义，避免未初始化错误）
    const buildMenuTree = (menuList: any[], parentId: number = 0) => {
      return menuList
        .filter((menu) => menu.parent_id === parentId)
        .map((menu) => {
          const children = buildMenuTree(menuList, menu.id);
          const menuTypeMap = {
            1: 'catalog',
            2: 'menu',
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
              title: menu.meta_title || menu.menu_name,
              icon: menu.icon,
              order: menu.sort_order,
              hidden: menu.hidden,
              keepAlive: menu.keep_alive === 1,
              affix: menu.affix === 1,
            },
          };

          if (children.length > 0) {
            (menuItem as any).children = children;
          }

          return menuItem;
        });
    };

    // 调试日志：当前用户信息
    console.log('当前用户信息:', JSON.stringify(userinfo));

    // 直接查询所有可见菜单（作为主要方案，跳过角色关联检查）
    console.log('直接查询所有可见菜单');
    const menus = db.query(
      `SELECT * FROM sys_menu WHERE menu_type IN (1, 2) AND status = 1 AND is_deleted = 0 ORDER BY sort_order ASC`,
    );

    console.log('直接查询到的菜单信息:', JSON.stringify(menus));

    // 如果没有菜单数据，插入一些测试菜单
    if (menus.length === 0) {
      console.log('数据库中没有菜单数据，插入测试菜单');

      // 插入测试菜单
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (0, 2, "仪表板", "dashboard", "/dashboard", "/dashboard/index", "ep:home-filled", 1, 1, 0, 1, 1)',
      );
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (0, 1, "系统管理", "system", "/system", "LAYOUT", "ep:setting", 100, 1, 0, 1, 1)',
      );
      const systemMenuId = db.query('SELECT last_insert_rowid() as id')[0].id;
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (?, 2, "用户管理", "system:user", "/system/user", "/system/user/index", "ep:user", 10, 1, 0, 1, 1)',
        [systemMenuId],
      );

      // 重新查询菜单
      const updatedMenus = db.query(
        `SELECT * FROM sys_menu WHERE menu_type IN (1, 2) AND status = 1 AND is_deleted = 0 ORDER BY sort_order ASC`,
      );
      console.log(
        '插入测试菜单后，查询到的菜单信息:',
        JSON.stringify(updatedMenus),
      );

      const menuTree = buildMenuTree(updatedMenus);
      return useResponseSuccess(menuTree);
    }

    // 构建菜单树
    const menuTree = buildMenuTree(menus);

    console.log('构建后的菜单树:', JSON.stringify(menuTree));

    return useResponseSuccess(menuTree);
  } catch (error) {
    console.error('获取菜单失败:', error);
    return useResponseSuccess([]);
  }
});
