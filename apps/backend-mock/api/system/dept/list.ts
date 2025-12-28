import { eventHandler } from 'h3';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { getDb } from '~/utils/db';
import { unAuthorizedResponse, useResponseSuccess } from '~/utils/response';

export default eventHandler(async (event) => {
  const userinfo = verifyAccessToken(event);
  if (!userinfo) {
    return unAuthorizedResponse(event);
  }

  // 获取数据库实例
  const db = await getDb();

  // 查询所有部门信息
  const depts = db.query(
    `SELECT id, dept_code, dept_name as name, parent_id as pid, status, description as remark, created_at as createTime 
     FROM sys_dept 
     WHERE is_deleted = 0 
     ORDER BY sort_order ASC`
  );

  // 将部门转换为树形结构
  const buildDeptTree = (deptList: any[], parentId: number = 0) => {
    return deptList
      .filter(dept => dept.pid === parentId)
      .map(dept => {
        const children = buildDeptTree(deptList, dept.id);
        const deptItem = {
          ...dept
        };

        if (children.length > 0) {
          deptItem.children = children;
        }

        return deptItem;
      });
  };

  const deptTree = buildDeptTree(depts);

  return useResponseSuccess(deptTree);
});
