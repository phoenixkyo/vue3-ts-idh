import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemPostApi {
  export interface SystemPost {
    [key: string]: any;
    code: string;
    createTime: string;
    id: string;
    name: string;
    remark?: string;
    sortOrder: number;
    status: 0 | 1;
  }
}

/**
 * 获取岗位列表数据
 */
async function getPostList(params?: Recordable<any>) {
  return requestClient.get<{
    items: Array<SystemPostApi.SystemPost>;
    total: number;
  }>('/system/post/list', { params });
}

/**
 * 创建岗位
 * @param data 岗位数据
 */
async function createPost(
  data: Omit<SystemPostApi.SystemPost, 'createTime' | 'id'>,
) {
  return requestClient.post('/system/post', data);
}

/**
 * 更新岗位
 *
 * @param id 岗位 ID
 * @param data 岗位数据
 */
async function updatePost(
  id: string,
  data: Omit<SystemPostApi.SystemPost, 'createTime' | 'id'>,
) {
  return requestClient.put(`/system/post/${id}`, data);
}

/**
 * 删除岗位
 * @param id 岗位 ID
 */
async function deletePost(id: string) {
  return requestClient.delete(`/system/post/${id}`);
}

/**
 * 获取所有岗位（用于下拉选择）
 */
async function getAllPosts(params?: Recordable<any>) {
  return requestClient.get<{
    items: Array<SystemPostApi.SystemPost>;
    total: number;
  }>('/system/post/list', {
    params: { ...params, page: 1, pageSize: 100 },
  });
}

export { createPost, deletePost, getAllPosts, getPostList, updatePost };
