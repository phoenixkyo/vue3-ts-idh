<script lang="ts" setup>
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDept, getDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/**
 * 编辑部门
 * @param row
 */
function onEdit(row: any) {
  formModalApi.setData(row).open();
}

/**
 * 添加下级部门
 * @param row
 */
function onAppend(row: any) {
  formModalApi.setData({ pid: row.id }).open();
}

/**
 * 创建新部门
 */
function onCreate() {
  formModalApi.setData(null).open();
}

/**
 * 删除部门
 * @param row
 */
function onDelete(row: any) {
  // 使用ElLoading.service替代message.loading
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(255, 255, 255, 0.7)',
  });
  deleteDept(row.id)
    .then(() => {
      loading.close();
      ElMessage.success({
        message: $t('ui.actionMessage.deleteSuccess', [row.name]),
      });
      refreshGrid();
    })
    .catch(() => {
      loading.close();
    });
}

/**
 * 表格操作按钮的回调函数
 */
function onActionClick({ code, row }: any) {
  switch (code) {
    case 'append': {
      onAppend(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_params: any) => {
          return await getDeptList();
        },
      },
      response: {
        // 调整响应数据格式，直接使用返回的数组作为结果
        result: '',
        list: '',
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'pid',
      rowField: 'id',
      transform: false,
    },
  },
});

/**
 * 刷新表格
 */
function refreshGrid() {
  gridApi.query();
}
</script>
<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="部门列表">
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.dept.name')]) }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
