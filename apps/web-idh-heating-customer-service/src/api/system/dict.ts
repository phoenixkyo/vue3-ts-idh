import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemDictApi {
  export interface SystemDict {
    [key: string]: any;
    id: string;
    dictType: string;
    dictCode: string;
    dictValue: string;
    dictLabel: string;
    description?: string;
    sortOrder: number;
    isSystem: 0 | 1;
    isDefault: 0 | 1;
    cssClass: string;
    listClass: string;
    status: 0 | 1;
    createTime: string;
  }
}

/**
 * 获取字典列表数据
 */
async function getDictList(params?: Recordable<any>) {
  return requestClient.get<{
    items: Array<SystemDictApi.SystemDict>;
    total: number;
  }>('/system/dict/list', { params });
}

/**
 * 创建字典
 * @param data 字典数据
 */
async function createDict(
  data: Omit<SystemDictApi.SystemDict, 'createTime' | 'id' | 'isSystem'>,
) {
  return requestClient.post('/system/dict', data);
}

/**
 * 更新字典
 *
 * @param id 字典 ID
 * @param data 字典数据
 */
async function updateDict(
  id: string,
  data: Omit<SystemDictApi.SystemDict, 'createTime' | 'id' | 'isSystem'>,
) {
  return requestClient.put(`/system/dict/${id}`, data);
}

/**
 * 删除字典
 * @param id 字典 ID
 */
async function deleteDict(id: string) {
  return requestClient.delete(`/system/dict/${id}`);
}

export { createDict, deleteDict, getDictList, updateDict };
