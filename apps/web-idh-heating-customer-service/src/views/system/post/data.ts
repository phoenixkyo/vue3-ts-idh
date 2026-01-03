import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

/**
 * 获取编辑表单的字段配置。如果没有使用多语言，可以直接export一个数组常量
 */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.post.postName'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.post.postName'), 2]))
        .max(
          20,
          $t('ui.formRules.maxLength', [$t('system.post.postName'), 20]),
        ),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.post.postCode'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.post.postCode'), 2]))
        .max(
          20,
          $t('ui.formRules.maxLength', [$t('system.post.postCode'), 20]),
        ),
    },
    {
      component: 'Input',
      componentProps: {
        type: 'textarea',
        rows: 3,
        showWordLimit: true,
        maxlength: 200,
      },
      fieldName: 'remark',
      label: $t('system.post.remark'),
      rules: z
        .string()
        .max(200, $t('ui.formRules.maxLength', [$t('system.post.remark'), 200]))
        .optional(),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 1000,
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: $t('system.post.sortOrder'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.post.status'),
    },
  ];
}

/**
 * 获取表格列配置
 * @description 使用函数的形式返回列数据而不是直接export一个Array常量，是为了响应语言切换时重新翻译表头
 */
export function useGridSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.post.postName'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.post.postCode'),
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
      label: $t('system.post.status'),
    },
  ];
}

/**
 * 获取表格列配置
 * @description 使用函数的形式返回列数据而不是直接export一个Array常量，是为了响应语言切换时重新翻译表头
 * @param onActionClick 表格操作按钮点击事件
 */
export function useColumns(
  onActionClick?: (params: any) => void,
): VxeTableGridOptions['columns'] {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      title: $t('system.post.postName'),
      width: 150,
    },
    {
      field: 'code',
      title: $t('system.post.postCode'),
      width: 150,
    },
    {
      field: 'sortOrder',
      title: $t('system.post.sortOrder'),
      width: 100,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.post.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.post.createTime'),
      width: 180,
    },
    {
      field: 'remark',
      title: $t('system.post.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.post.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.post.operation'),
      width: 120,
    },
  ];
}
