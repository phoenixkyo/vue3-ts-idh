<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  getUserList,
  resetUserPassword,
  updateUser,
} from '#/api/system/user';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

// 定义新增用户抽屉组件
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 定义用户列表的网格组件
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: any,
        ) => {
          return await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
      // 调整响应数据格式，确保items和total字段正确映射
      response: {
        result: 'items',
        total: 'total',
      },
    },
    rowConfig: {
      keyField: 'id',
    },

    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

/**
 * 点击操作按钮
 * @description 点击编辑用户按钮，打开编辑用户的抽屉；点击删除用户按钮，确认删除用户
 * @param e 事件对象
 */
function onActionClick(e: any) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
    case 'resetPassword': {
      onResetPassword(e.row);
      break;
    }
  }
}

/**
 * 将Element Plus的ElMessageBox.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
function confirm(content: string, title: string) {
  return ElMessageBox.confirm(content, title, {
    confirmButtonText: $t('common.confirm'),
    cancelButtonText: $t('common.cancel'),
    type: 'warning',
  });
}

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(newStatus: number, row: any) {
  const status: Recordable<string> = {
    0: $t('common.disabled'),
    1: $t('common.enabled'),
  };
  try {
    await confirm(
      $t('ui.actionMessage.changeStatusConfirm', [
        row.username,
        status[newStatus.toString()],
      ]),
      $t('ui.actionTitle.changeStatus'),
    );
    await updateUser(row.id, { status: newStatus });
    return true;
  } catch {
    return false;
  }
}

/**
 * 编辑用户
 * @description 点击编辑用户按钮，打开编辑用户的抽屉
 * @param row 行数据
 */
function onEdit(row: any) {
  formDrawerApi.setData(row).open();
}

/**
 * 删除用户
 * @description 点击删除用户按钮，确认删除用户
 * @param row 行数据
 */
function onDelete(row: any) {
  // 使用ElLoading.service替代ElMessage.loading
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.username]),
    background: 'rgba(255, 255, 255, 0.7)',
  });
  deleteUser(row.id)
    .then(() => {
      loading.close();
      ElMessage.success({
        message: $t('ui.actionMessage.deleteSuccess', [row.username]),
      });
      onRefresh();
    })
    .catch(() => {
      loading.close();
    });
}

/**
 * 重置用户密码
 * @description 点击重置密码按钮，确认重置用户密码
 * @param row 行数据
 */
function onResetPassword(row: any) {
  ElMessageBox.confirm(
    $t('ui.actionMessage.resetPasswordConfirm', [row.username]),
    $t('ui.actionTitle.resetPassword', [row.username]),
    {
      confirmButtonText: $t('common.confirm'),
      cancelButtonText: $t('common.cancel'),
      type: 'warning',
    },
  )
    .then(() => {
      // 使用ElLoading.service替代ElMessage.loading
      const loading = ElLoading.service({
        lock: true,
        text: $t('ui.actionMessage.resettingPassword', [row.username]),
        background: 'rgba(255, 255, 255, 0.7)',
      });
      return resetUserPassword(row.id, '123456').finally(() => {
        loading.close();
      });
    })
    .then(() => {
      ElMessage.success({
        message: $t('ui.actionMessage.resetPasswordSuccess', [row.username]),
      });
    })
    .catch((error) => {
      if (error !== 'cancel') {
        console.error(error);
        ElMessage.error({
          message: $t('ui.actionMessage.resetPasswordFailed', [row.username]),
        });
      }
    });
}

/**
 * 刷新用户列表
 * @description 点击刷新按钮，刷新用户列表
 */
function onRefresh() {
  gridApi.query();
}

/**
 * 新增用户
 * @description 点击新增用户按钮，打开新增用户的抽屉
 */
function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.user.list')">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.user.name')]) }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
