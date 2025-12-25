import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDBManager } from '~/utils/db-manager';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = await verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 从数据库中查询菜单
  const dbManager = await getDBManager();
  const menus = dbManager.query(
    'SELECT id, parent_id as parentId, name, path, component, icon, title, order_num as orderNum, hidden FROM idh_menu ORDER BY order_num ASC'
  );
  
  // 构建树形结构
  const buildTree = (items: any[], parentId = 0) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };
  
  const treeMenus = buildTree(menus);
  
  return useResponseSuccess(treeMenus);
});
