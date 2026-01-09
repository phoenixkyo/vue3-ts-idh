<script lang="ts" setup>
import { ref, watch } from 'vue';

import { ElButton, ElOption, ElSelect, ElTree } from 'element-plus';

import { $t } from '#/locales';

interface Props {
  modelValue?: boolean;
  roleId?: string;
  roleData?: any;
  deptList?: any[];
  menuList?: any[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  roleId: '',
  roleData: null,
  deptList: () => [],
  menuList: () => [],
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', value: any): void;
}>();

const visible = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  },
  { immediate: true },
);

const dataScopeOptions = [
  { label: $t('system.role.allDataScope'), value: 1 },
  { label: $t('system.role.unitDataScope'), value: 2 },
  { label: $t('system.role.unitAndDownDataScope'), value: 3 },
  { label: $t('system.role.departmentDataScope'), value: 4 },
  { label: $t('system.role.departmentAndDownDataScope'), value: 5 },
  { label: $t('system.role.specifyDepartmentDataScope'), value: 6 },
  { label: $t('system.role.onlySelfDataScope'), value: 7 },
];

const dataScope = ref(props.roleData?.dataScope || 1);
const deptId = ref(props.roleData?.deptId || null);

const menuTreeData = ref([]);
const menuTreeRef = ref();

const selectedMenuIds = ref<string[]>([]);

const handleSave = () => {
  emit('save', {
    dataScope: dataScope.value,
    deptId: deptId.value,
    menuIds: selectedMenuIds.value,
  });
  handleClose();
};

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleMenuCheck = (data: any, checked: boolean) => {
  const node = menuTreeRef.value?.getNode(data);
  if (node) {
    const setChecked = (node: any) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => setChecked(child));
      }
      node.checked = checked;
    };
    setChecked(node);
  }
};

const handleMenuAction = (action: string, node: any) => {
  console.warn('Menu action:', action, 'Node:', node);
};

watch(
  () => props.roleData,
  (val) => {
    if (val) {
      dataScope.value = val.dataScope || 1;
      deptId.value = val.deptId || null;
      selectedMenuIds.value = val.menuIds || [];
    }
  },
  { deep: true },
);
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="$t('system.role.setPermissions')"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="role-permission-dialog">
      <div class="form-item">
        <label class="form-label">{{ $t('system.role.dataScope') }}:</label>
        <ElSelect v-model="dataScope" :placeholder="$t('common.pleaseSelect')">
          <ElOption
            v-for="item in dataScopeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </div>

      <div v-if="dataScope === 6" class="form-item">
        <label class="form-label">{{ $t('system.dept.name') }}:</label>
        <ElSelect v-model="deptId" :placeholder="$t('common.pleaseSelect')">
          <ElOption
            v-for="dept in deptList || []"
            :key="dept.id"
            :label="dept.deptName"
            :value="dept.id"
          />
        </ElSelect>
      </div>

      <div class="form-item">
        <label class="form-label">{{ $t('system.menu.name') }}:</label>
        <ElTree
          ref="menuTreeRef"
          :data="menuTreeData"
          show-checkbox
          node-key="id"
          :props="{ label: 'menuName', children: 'children' }"
          :default-checked-keys="selectedMenuIds"
          @check="handleMenuCheck($event, $event.checked)"
          class="menu-tree"
        >
          <template #default="{ node }">
            <div class="menu-node">
              <span class="menu-name">{{ node.menuName }}</span>
              <div class="menu-actions">
                <ElButton
                  size="small"
                  text
                  @click.stop="handleMenuAction('query', node)"
                >
                  {{ $t('common.query') }}
                </ElButton>
                <ElButton
                  size="small"
                  text
                  @click.stop="handleMenuAction('add', node)"
                >
                  {{ $t('common.add') }}
                </ElButton>
                <ElButton
                  size="small"
                  text
                  @click.stop="handleMenuAction('edit', node)"
                >
                  {{ $t('common.edit') }}
                </ElButton>
                <ElButton
                  size="small"
                  text
                  type="danger"
                  @click.stop="handleMenuAction('delete', node)"
                >
                  {{ $t('common.delete') }}
                </ElButton>
              </div>
            </div>
          </template>
        </ElTree>
      </div>

      <div class="dialog-footer">
        <ElButton @click="handleClose">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSave">
          {{ $t('common.confirm') }}
        </ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.role-permission-dialog {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.menu-tree {
  max-height: 400px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.menu-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.menu-node:hover {
  background-color: #f5f7fa;
}

.menu-name {
  flex: 1;
  font-size: 14px;
}

.menu-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>
