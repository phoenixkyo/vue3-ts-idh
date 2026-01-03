import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    [key: string]: any;
    id: string;
    username: string;
    nickname?: string;
    realName: string;
    gender?: 0 | 1 | 2;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    status: 0 | 1;
    roleId: string;
    roleName?: string;
    deptId: string;
    deptName?: string;
    postId?: string;
    postName?: string;
    createTime?: string;
  }
}

/**
 * 获取用户列表数据
 */
async function getUserList(params: Recordable<any>) {
  return requestClient.get<{
    items: Array<SystemUserApi.SystemUser>;
    total: number;
  }>('/system/user/list', { params });
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(data: Omit<SystemUserApi.SystemUser, 'id'>) {
  return requestClient.post('/system/user', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据
 */
async function updateUser(
  id: string,
  data: Omit<SystemUserApi.SystemUser, 'id'>,
) {
  return requestClient.put(`/system/user/${id}`, data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
async function deleteUser(id: string) {
  return requestClient.delete(`/system/user/${id}`);
}

/**
 * 重置用户密码
 * @param id 用户 ID
 * @param password 新密码
 */
async function resetUserPassword(id: string, password: string) {
  return requestClient.post(`/system/user/${id}/reset-password`, { password });
}

export { createUser, deleteUser, getUserList, resetUserPassword, updateUser };
