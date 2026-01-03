import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getDeptList } from '#/api/system/dept';
import { getPostList } from '#/api/system/post';
import { getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

// 用户表单字段配置
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.userName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: $t('system.user.nickname'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('system.user.gender.unknown'), value: 0 },
          { label: $t('system.user.gender.male'), value: 1 },
          { label: $t('system.user.gender.female'), value: 2 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'gender',
      label: $t('system.user.gender.label'),
    },
    {
      component: 'Input',
      componentProps: {
        type: 'email',
      },
      fieldName: 'email',
      label: $t('system.user.email'),
    },
    {
      component: 'Input',
      componentProps: {
        type: 'tel',
      },
      fieldName: 'phone',
      label: $t('system.user.phone'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRoleList,
        class: 'w-full',
        placeholder: $t('system.user.role'),
        afterFetch: (data: any) => {
          const list = Array.isArray(data) ? data : data.items || [];
          return list.map((item: any) => ({
            label: item.role_name || item.name,
            value: item.id,
          }));
        },
      },
      fieldName: 'roleId',
      label: $t('system.user.role'),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        class: 'w-full',
        childrenField: 'children',
        placeholder: $t('system.user.dept'),
        labelField: 'name',
        valueField: 'id',
        afterFetch: (data: any) => {
          // 处理后端直接返回数组的情况
          return Array.isArray(data) ? data : data.items || [];
        },
      },
      fieldName: 'deptId',
      label: $t('system.user.dept'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getPostList,
        class: 'w-full',
        placeholder: $t('system.user.post'),
        afterFetch: (data: any) => {
          const list = Array.isArray(data) ? data : data.items || [];
          return list.map((item: any) => ({
            label: item.post_name || item.name,
            value: item.id,
          }));
        },
      },
      fieldName: 'postId',
      label: $t('system.user.post'),
    },
    {
      component: 'Switch',
      componentProps: {
        // 启用状态对应的值为1，禁用状态对应的值为0
        activeValue: 1,
        inactiveValue: 0,
      },
      // 默认为启用状态
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.user.status'),
    },
  ];
}

// 用户列表查询表单字段配置
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.userName'),
    },
    {
      component: 'Input',
      fieldName: 'realName',
      label: $t('system.user.realName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.user.status'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRoleList,
        class: 'w-full',
        placeholder: $t('system.user.role'),
        afterFetch: (data: any) => {
          const list = Array.isArray(data) ? data : data.items || [];
          return list.map((item: any) => ({
            label: item.role_name || item.name,
            value: item.id,
          }));
        },
      },
      fieldName: 'roleId',
      label: $t('system.user.role'),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getDeptList,
        class: 'w-full',
        childrenField: 'children',
        placeholder: $t('system.user.dept'),
        labelField: 'name',
        valueField: 'id',
        afterFetch: (data: any) => {
          // 处理后端直接返回数组的情况
          return Array.isArray(data) ? data : data.items || [];
        },
      },
      fieldName: 'deptId',
      label: $t('system.user.dept'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getPostList,
        class: 'w-full',
        placeholder: $t('system.user.post'),
        afterFetch: (data: any) => {
          const list = Array.isArray(data) ? data : data.items || [];
          return list.map((item: any) => ({
            label: item.post_name || item.name,
            value: item.id,
          }));
        },
      },
      fieldName: 'postId',
      label: $t('system.user.post'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        type: 'daterange',
      },
      fieldName: 'createTime',
      label: $t('system.user.createTime'),
    },
  ];
}

export function useColumns<T = any>(
  onActionClick: (params: any) => void,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'username',
      title: $t('system.user.userName'),
      width: 150,
    },
    {
      field: 'nickname',
      title: $t('system.user.nickname'),
      width: 150,
    },
    {
      field: 'realName',
      title: $t('system.user.realName'),
      width: 150,
    },
    {
      field: 'gender',
      title: $t('system.user.gender.label'),
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('system.user.gender.unknown'), value: 0 },
          { label: $t('system.user.gender.male'), value: 1 },
          { label: $t('system.user.gender.female'), value: 2 },
        ],
      },
    },
    {
      field: 'email',
      title: $t('system.user.email'),
      width: 200,
    },
    {
      field: 'phone',
      title: $t('system.user.phone'),
      width: 150,
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.user.status'),
      width: 100,
    },
    {
      field: 'roleName',
      title: $t('system.user.role'),
      width: 120,
    },
    {
      field: 'deptName',
      title: $t('system.user.dept'),
      width: 120,
    },
    {
      field: 'postName',
      title: $t('system.user.post'),
      width: 120,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'realName',
          nameTitle: $t('system.user.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'resetPassword', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 180,
    },
  ];
}
