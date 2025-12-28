import { getDb } from './apps/backend/utils/db.js';

async function testMenuData() {
  try {
    const db = await getDb();
    
    // 查询菜单数据
    const menus = db.query(
      `SELECT * FROM sys_menu WHERE menu_type IN (1, 2) AND status = 1 AND is_deleted = 0 ORDER BY sort_order ASC`
    );
    
    console.log('菜单数据:', JSON.stringify(menus, null, 2));
    
    // 统计菜单数量
    console.log('菜单数量:', menus.length);
    
    // 如果没有菜单数据，插入一些测试数据
    if (menus.length === 0) {
      console.log('没有菜单数据，插入测试数据...');
      
      // 插入测试菜单
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (0, 2, "仪表板", "dashboard", "/dashboard", "/dashboard/index", "ep:home-filled", 1, 1, 0, 1, 1)'
      );
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (0, 1, "系统管理", "system", "/system", "LAYOUT", "ep:setting", 100, 1, 0, 1, 1)'
      );
      const systemMenuId = db.query('SELECT last_insert_rowid() as id')[0].id;
      db.execute(
        'INSERT INTO sys_menu (parent_id, menu_type, menu_name, permission, path, component, icon, sort_order, status, is_deleted, created_by, updated_by) VALUES (?, 2, "用户管理", "system:user", "/system/user", "/system/user/index", "ep:user", 10, 1, 0, 1, 1)',
        [systemMenuId]
      );
      
      // 重新查询
      const updatedMenus = db.query(
        `SELECT * FROM sys_menu WHERE menu_type IN (1, 2) AND status = 1 AND is_deleted = 0 ORDER BY sort_order ASC`
      );
      console.log('插入后的菜单数据:', JSON.stringify(updatedMenus, null, 2));
    }
  } catch (error) {
    console.error('测试菜单数据失败:', error);
  }
}

testMenuData();
