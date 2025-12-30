<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUser, getUserList, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
  }
}

/**
 * 将Element Plus的ElMessageBox.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
function confirm(content: string, title: string) {
  return ElMessageBox.confirm(content, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
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
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将${row.realName}的状态切换为 【${status[newStatus.toString()]}】 吗？`,
      `切换状态`,
    );
    await updateUser(row.id, { status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onEdit(row: any) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: any) {
  // 使用ElLoading.service替代ElMessage.loading
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.realName]),
    background: 'rgba(255, 255, 255, 0.7)',
  });
  deleteUser(row.id)
    .then(() => {
      loading.close();
      ElMessage.success({
        message: $t('ui.actionMessage.deleteSuccess', [row.realName]),
      });
      onRefresh();
    })
    .catch(() => {
      loading.close();
    });
}

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
