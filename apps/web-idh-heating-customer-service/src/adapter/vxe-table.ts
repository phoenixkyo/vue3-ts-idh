import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import { defineAsyncComponent, h } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { setupVbenVxeTable, useVbenVxeGrid } from '@vben/plugins/vxe-table';

import { ElButton, ElImage, ElMessageBox } from 'element-plus';

import { useVbenForm } from './form';

const isString = (val: any): val is string => typeof val === 'string';
const isFunction = (val: any): val is (...args: any[]) => any =>
  typeof val === 'function';

setupVbenVxeTable({
  configVxeTable: (vxeUI) => {
    vxeUI.setConfig({
      grid: {
        align: 'center',
        border: false,
        columnConfig: {
          resizable: true,
        },
        minHeight: 180,
        formConfig: {
          // 全局禁用vxe-table的表单配置，使用formOptions
          enabled: false,
        },
        proxyConfig: {
          autoLoad: true,
          response: {
            result: 'items',
            total: 'total',
            list: 'items',
          },
          showActiveMsg: true,
          showResponseMsg: false,
        },
        round: true,
        showOverflow: true,
        size: 'small',
      } as VxeTableGridOptions,
    });

    // 表格配置项可以用 cellRender: { name: 'CellImage' },
    vxeUI.renderer.add('CellImage', {
      renderTableDefault(renderOpts, params) {
        const { props } = renderOpts;
        const { column, row } = params;
        const src = row[column.field];
        return h(ElImage, { src, previewSrcList: [src], ...props });
      },
    });

    // 表格配置项可以用 cellRender: { name: 'CellLink' },
    vxeUI.renderer.add('CellLink', {
      renderTableDefault(renderOpts) {
        const { props } = renderOpts;
        return h(
          ElButton,
          { size: 'small', link: true },
          { default: () => props?.text },
        );
      },
    });

    // 注册表格的开关渲染器
    vxeUI.renderer.add('CellSwitch', {
      renderTableDefault({ attrs, props }, { column, row }) {
        const loadingKey = `__loading_${column.field}`;
        const ElSwitch = defineAsyncComponent(() =>
          Promise.all([
            import('element-plus/es/components/switch/index'),
            import('element-plus/es/components/switch/style/css'),
          ]).then(([res]) => res.ElSwitch),
        );
        const finallyProps = {
          checkedChildren: $t('common.enabled'),
          activeValue: 1,
          unCheckedChildren: $t('common.disabled'),
          inactiveValue: 0,
          ...props,
          modelValue: row[column.field],
          loading: row[loadingKey] ?? false,
          'onUpdate:modelValue': async (newVal: any) => {
            row[loadingKey] = true;
            try {
              const result = await attrs?.beforeChange?.(newVal, row);
              if (result !== false) {
                row[column.field] = newVal;
              }
            } finally {
              row[loadingKey] = false;
            }
          },
        };
        return h(ElSwitch, finallyProps);
      },
    });

    // 注册表格的操作按钮渲染器
    vxeUI.renderer.add('CellOperation', {
      renderTableDefault({ attrs, options }, { column, row }) {
        const defaultProps = { size: 'small', type: 'link' };
        let align = 'end';
        switch (column.align) {
          case 'center': {
            align = 'center';
            break;
          }
          case 'left': {
            align = 'start';
            break;
          }
          default: {
            align = 'end';
            break;
          }
        }
        const presets: Recordable<Recordable<any>> = {
          delete: {
            danger: true,
            tooltip: $t('common.delete'),
          },
          edit: {
            tooltip: $t('common.edit'),
          },
          permission: {
            tooltip: $t('system.role.setPermissions'),
          },
          resetPassword: {
            tooltip: $t('ui.actionTitle.resetPassword', [row.realName]),
          },
        };
        const operations: Array<Recordable<any>> = (
          options || ['edit', 'delete']
        )
          .map((opt) => {
            if (isString(opt)) {
              return presets[opt]
                ? { code: opt, ...presets[opt], ...defaultProps }
                : {
                    code: opt,
                    text: opt,
                    ...defaultProps,
                  };
            } else {
              return { ...defaultProps, ...presets[opt.code], ...opt };
            }
          })
          .map((opt) => {
            const optBtn: Recordable<any> = {};
            Object.keys(opt).forEach((key) => {
              optBtn[key] = isFunction(opt[key]) ? opt[key](row) : opt[key];
            });
            return optBtn;
          })
          .filter((opt) => opt.show !== false);

        function renderBtn(opt: Recordable<any>, listen = true) {
          // 根据操作类型选择图标
          let iconName = 'carbon:document-edit'; // 默认图标

          // 直接确定按钮类型，避免TypeScript类型错误
          // 编辑按钮为蓝色，删除为红色，重置密码为黄色
          let buttonType = 'primary';
          if (opt.code === 'edit') {
            buttonType = 'primary';
          } else if (opt.code === 'resetPassword') {
            buttonType = 'warning';
          } else if (opt.danger) {
            buttonType = 'danger';
          }

          switch (opt.code) {
            case 'delete': {
              iconName = 'carbon:trash-can';
              break;
            }
            case 'edit': {
              iconName = 'carbon:edit';
              break;
            }
            case 'resetPassword': {
              iconName = 'carbon:reset';
              break;
            }
          }

          // 创建按钮元素
          return h(
            ElButton,
            {
              ...opt,
              type: buttonType as any,
              onClick: listen
                ? () =>
                    attrs?.onClick?.({
                      code: opt.code,
                      row,
                    })
                : undefined,
              // 添加title属性实现原生悬停提示
              title: opt.tooltip,
              // 移除circle属性，使用普通矩形按钮
              size: 'small',
            },
            { default: () => h(IconifyIcon, { icon: iconName }) },
          );
        }

        function renderConfirm(opt: Recordable<any>) {
          // 创建按钮元素
          return h(
            ElButton,
            {
              ...opt,
              type: 'danger',
              onClick: () => {
                ElMessageBox.confirm(
                  $t('ui.actionMessage.deleteConfirm', [
                    row[attrs?.nameField || 'name'],
                  ]),
                  $t('ui.actionTitle.delete', [attrs?.nameTitle || '']),
                  {
                    confirmButtonText: $t('common.confirm'),
                    cancelButtonText: $t('common.cancel'),
                    type: 'warning',
                  },
                ).then(() => {
                  attrs?.onClick?.({
                    code: opt.code,
                    row,
                  });
                });
              },
              // 添加title属性实现原生悬停提示
              title: opt.tooltip,
              // 移除circle属性，使用普通矩形按钮
              size: 'small',
            },
            { default: () => h(IconifyIcon, { icon: 'carbon:trash-can' }) },
          );
        }

        const btns = operations.map((opt) =>
          opt.code === 'delete' ? renderConfirm(opt) : renderBtn(opt),
        );
        return h(
          'div',
          {
            class: 'flex gap-0.5',
            style: { justifyContent: align },
          },
          btns,
        );
      },
    });

    // 注册表格的标签渲染器
    vxeUI.renderer.add('CellTag', {
      renderTableDefault({ options }, { column, row }) {
        const ElTag = defineAsyncComponent(() =>
          Promise.all([
            import('element-plus/es/components/tag/index'),
            import('element-plus/es/components/tag/style/css'),
          ]).then(([res]) => res.ElTag),
        );
        const value = row[column.field];
        const tagOptions = options ?? [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ];
        const tagItem = tagOptions.find((item) => item.value === value);
        return h(ElTag, {}, { default: () => tagItem?.label ?? value });
      },
    });

    // 注册表格的格式化渲染器，用于格式化日期时间等
    vxeUI.renderer.add('CellFormat', {
      renderTableDefault(renderOpts, params) {
        const { attrs } = renderOpts;
        const { row, column } = params;
        const value = row[column.field];
        // 如果提供了formatter函数，则使用formatter函数格式化值
        if (attrs?.formatter) {
          return attrs.formatter(params);
        }
        return value;
      },
    });

    // 这里可以自行扩展 vxe-table 的全局配置，比如自定义格式化
    // vxeUI.formats.add
  },
  useVbenForm,
});

export { useVbenVxeGrid };

export type * from '@vben/plugins/vxe-table';
