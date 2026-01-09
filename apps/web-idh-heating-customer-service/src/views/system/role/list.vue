<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDeptList, getMenuList } from '#/api/system';
import { deleteRole, getRoleList, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import PermissionDialogComponent from './modules/permission-dialog.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [permissionDialogApi] = useVbenDrawer({
  connectedComponent: PermissionDialogComponent,
});

const deptList = ref([]);
const menuList = ref([]);

const loadDeptList = async () => {
  const result = await getDeptList();
  deptList.value = result?.items || [];
};

const loadMenuList = async () => {
  menuList.value = await getMenuList();
};

loadDeptList();
loadMenuList();

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
          return await getRoleList({
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
    case 'permission': {
      onPermission(e.row);
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
        row.name,
        status[newStatus.toString()],
      ]),
      $t('ui.actionTitle.changeStatus'),
    );
    await updateRole(row.id, { status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onEdit(row: any) {
  formDrawerApi.setData(row).open();
}

function onPermission(row: any) {
  permissionDialogApi
    .setData({
      ...row,
      deptList: deptList.value,
      menuList: menuList.value,
    })
    .open();
}

function onDelete(row: any) {
  // 使用ElLoading.service替代ElMessage.loading
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(255, 255, 255, 0.7)',
  });
  deleteRole(row.id)
    .then(() => {
      loading.close();
      ElMessage.success({
        message: $t('ui.actionMessage.deleteSuccess', [row.name]),
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

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
        </ElButton>
        <ElButton type="primary" @click="onPermission">
          <Lock class="size-5" />
          {{ $t('system.role.setPermissions') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
