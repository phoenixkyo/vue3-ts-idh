import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { formatDate } from '@vben/utils';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
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
      label: $t('system.role.status'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
    {
      component: 'Input',
      fieldName: 'permissions',
      formItemClass: 'items-start',
      label: $t('system.role.setPermissions'),
      modelPropName: 'modelValue',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    {
      component: 'Input',
      fieldName: 'roleKey',
      label: $t('system.role.roleKey'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('system.role.allDataScope'), value: 1 },
          { label: $t('system.role.unitDataScope'), value: 2 },
          { label: $t('system.role.unitAndDownDataScope'), value: 3 },
          { label: $t('system.role.departmentDataScope'), value: 4 },
          { label: $t('system.role.departmentAndDownDataScope'), value: 5 },
          { label: $t('system.role.specifyDepartmentDataScope'), value: 6 },
          { label: $t('system.role.onlySelfDataScope'), value: 7 },
        ],
      },
      fieldName: 'dataScope',
      label: $t('system.role.dataScope'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.yes'), value: 1 },
          { label: $t('common.no'), value: 0 },
        ],
      },
      fieldName: 'isSystem',
      label: $t('system.role.isSystem'),
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
      label: $t('system.role.status'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        type: 'daterange',
      },
      fieldName: 'createTime',
      label: $t('system.role.createTime'),
    },
  ];
}

export function useColumns<T = any>(
  onActionClick: (params: any) => void,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 200,
    },
    {
      field: 'roleKey',
      title: $t('system.role.roleKey'),
      width: 150,
    },
    {
      field: 'dataScope',
      title: $t('system.role.dataScope'),
      width: 150,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('system.role.allDataScope'), value: 1 },
          { label: $t('system.role.unitDataScope'), value: 2 },
          { label: $t('system.role.unitAndDownDataScope'), value: 3 },
          { label: $t('system.role.departmentDataScope'), value: 4 },
          { label: $t('system.role.departmentAndDownDataScope'), value: 5 },
          { label: $t('system.role.specifyDepartmentDataScope'), value: 6 },
          { label: $t('system.role.onlySelfDataScope'), value: 7 },
        ],
      },
    },
    {
      field: 'isSystem',
      title: $t('system.role.isSystem'),
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: $t('common.yes'), value: 1 },
          { label: $t('common.no'), value: 0 },
        ],
      },
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 200,
      cellRender: {
        name: 'CellFormat',
        props: {
          formatter: (params: any) => {
            const { row } = params;
            return formatDate(row.createTime, 'YYYY-MM-DD HH:mm:ss');
          },
        },
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 130,
    },
  ];
}
