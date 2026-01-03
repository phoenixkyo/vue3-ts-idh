import { defineEventHandler, getQuery } from 'h3';
import { getDb } from '~/utils/db';
import { useResponseSuccess } from '~/utils/response';

export default defineEventHandler(async (event) => {
  // 获取查询参数
  const query = getQuery(event);
  const page = Number.parseInt((query.page as string) || '1');
  const pageSize = Number.parseInt((query.pageSize as string) || '10');
  const {
    username,
    realName,
    status,
    roleId,
    deptId,
    postId,
    startTime,
    endTime,
  } = query;

  // 获取数据库实例
  const db = await getDb();

  // 计算分页参数
  const offset = (page - 1) * pageSize;

  // 构建查询条件
  const whereConditions: string[] = ['u.is_deleted = 0'];
  const queryParams: any[] = [];

  // 添加查询条件
  if (username) {
    whereConditions.push('u.username LIKE ?');
    queryParams.push(`%${username}%`);
  }

  if (realName) {
    whereConditions.push('u.real_name LIKE ?');
    queryParams.push(`%${realName}%`);
  }

  if (status !== undefined) {
    whereConditions.push('u.status = ?');
    queryParams.push(Number(status));
  }

  if (roleId) {
    whereConditions.push(
      'EXISTS (SELECT 1 FROM sys_user_role ur WHERE ur.user_id = u.id AND ur.role_id = ? AND ur.is_deleted = 0)',
    );
    queryParams.push(roleId);
  }

  if (deptId) {
    whereConditions.push('u.dept_id = ?');
    queryParams.push(deptId);
  }

  if (postId) {
    whereConditions.push('u.post_id = ?');
    queryParams.push(postId);
  }

  if (startTime) {
    whereConditions.push('u.created_at >= ?');
    queryParams.push(startTime);
  }

  if (endTime) {
    whereConditions.push('u.created_at <= ?');
    queryParams.push(endTime);
  }

  // 查询用户总数
  const countSql = `
    SELECT COUNT(*) as total 
    FROM sys_user u 
    WHERE ${whereConditions.join(' AND ')}
  `;
  const countResult = db.query(countSql, queryParams);
  const total = countResult[0]?.total || 0;

  // 查询用户列表，关联部门和角色信息
  const userSql = `
    SELECT 
      u.id, 
      u.username, 
      u.nickname, 
      u.real_name as realName, 
      u.gender, 
      u.email, 
      u.phone, 
      u.status, 
      u.created_at as createTime,
      
      -- 部门信息
      d.id as deptId,
      d.dept_name as deptName,
      
      -- 岗位信息
      p.id as postId,
      p.post_name as postName,
      
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
    LEFT JOIN sys_post p ON u.post_id = p.id AND p.is_deleted = 0
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // 添加分页参数
  const finalParams = [...queryParams, pageSize, offset];
  const users = db.query(userSql, finalParams);

  return useResponseSuccess({
    items: users,
    total,
    page,
    pageSize,
  });
});
