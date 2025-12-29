import { defineEventHandler, getQuery } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const page = Number.parseInt((query.page as string) || '1');
  const pageSize = Number.parseInt((query.pageSize as string) || '10');

  // 获取数据库实例
  const db = await getDb();

  // 计算分页参数
  const offset = (page - 1) * pageSize;

  // 查询用户总数
  const countSql = `
    SELECT COUNT(*) as total 
    FROM sys_user u 
    WHERE u.is_deleted = 0
  `;
  const countResult = db.query(countSql);
  const total = countResult[0]?.total || 0;

  // 查询用户列表，关联部门和角色信息
  const userSql = `
    SELECT 
      u.id, 
      u.username, 
      u.real_name as realName, 
      u.email, 
      u.phone, 
      u.status, 
      u.created_at as createTime,
      
      -- 部门信息
      d.id as deptId,
      d.dept_name as deptName,
      
      -- 角色信息（使用GROUP_CONCAT获取用户的所有角色，取第一个角色作为主要角色）
      (SELECT r.id FROM sys_role r 
       JOIN sys_user_role ur ON r.id = ur.role_id 
       WHERE ur.user_id = u.id AND ur.is_deleted = 0 
       LIMIT 1) as roleId,
      
      (SELECT r.role_name FROM sys_role r 
       JOIN sys_user_role ur ON r.id = ur.role_id 
       WHERE ur.user_id = u.id AND ur.is_deleted = 0 
       LIMIT 1) as roleName
      
    FROM sys_user u
    LEFT JOIN sys_dept d ON u.dept_id = d.id AND d.is_deleted = 0
    WHERE u.is_deleted = 0
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const users = db.query(userSql, [pageSize, offset]);

  return useResponseSuccess({
    items: users,
    total,
    page,
    pageSize,
  });
});
