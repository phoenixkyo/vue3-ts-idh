<script lang="ts" setup>
import { Page, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';
import { $t } from '@vben/locales';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenu, getMenuList } from '#/api/system/menu';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
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
          return await getMenuList();
        },
      },
      response: {
        // 调整响应数据格式，直接使用返回的数组作为结果
        result: '',
        list: '',
      },
    },
    rowConfig: {
      keyField: 'id',
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
    default: {
      break;
    }
  }
}

function onRefresh() {
  gridApi.query();
}
function onEdit(row: any) {
  formDrawerApi.setData(row).open();
}
function onCreate() {
  formDrawerApi.setData({}).open();
}
function onAppend(row: any) {
  formDrawerApi.setData({ pid: row.id }).open();
}

function onDelete(row: any) {
  // 使用ElLoading.service替代message.loading
  const loading = ElLoading.service({
    lock: true,
    text: $t('ui.actionMessage.deleting', [row.name]),
    background: 'rgba(255, 255, 255, 0.7)',
  });
  deleteMenu(row.id)
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
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.menu.name')]) }}
        </ElButton>
      </template>
      <template #title="{ row }">
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon
              v-if="row.type === 'button'"
              icon="carbon:security"
              class="size-full"
            />
            <IconifyIcon
              v-else-if="row.meta?.icon"
              :icon="row.meta?.icon || 'carbon:circle-dash'"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ $t(row.meta?.title) }}</span>
          <div class="items-center justify-end"></div>
        </div>
        <!-- 移除不存在的MenuBadge组件 -->
        <el-badge
          v-if="row.meta?.badgeType"
          class="menu-badge"
          :value="row.meta.badge"
          :type="row.meta.badgeType"
        />
      </template>
    </Grid>
  </Page>
</template>
<style lang="scss" scoped>
.menu-badge {
  top: 50%;
  right: 0;
  transform: translateY(-50%);

  & > :deep(div) {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
