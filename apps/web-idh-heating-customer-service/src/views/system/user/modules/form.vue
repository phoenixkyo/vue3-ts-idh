<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import { computed, nextTick } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';
import { getDeptList } from '#/api/system/dept';
import { getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<any>();
const roles = ref<any[]>([]);
const depts = ref<any[]>([]);
const loadingRoles = ref(false);
const loadingDepts = ref(false);

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    (id.value ? updateUser(id.value, values) : createUser(values))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<any>();
      formApi.resetForm();

      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }

      // 加载角色和部门数据
      if (roles.value.length === 0) {
        await loadRoles();
      }
      if (depts.value.length === 0) {
        await loadDepts();
      }
      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

async function loadRoles() {
  loadingRoles.value = true;
  try {
    const res = await getRoleList({ page: 1, pageSize: 100 });
    roles.value = res.items || [];
    // 更新表单中角色选择的选项
    const roleField = formApi.getField('roleId');
    if (roleField) {
      roleField.setProps({
        options: roles.value.map(role => ({
          label: role.name,
          value: role.id,
        })),
      });
    }
  } finally {
    loadingRoles.value = false;
  }
}

async function loadDepts() {
  loadingDepts.value = true;
  try {
    const res = await getDeptList({ page: 1, pageSize: 100 });
    depts.value = res.items || [];
    // 更新表单中部门选择的选项
    const deptField = formApi.getField('deptId');
    if (deptField) {
      deptField.setProps({
        options: depts.value.map(dept => ({
          label: dept.deptName,
          value: dept.id,
        })),
      });
    }
  } finally {
    loadingDepts.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.user.name'))
    : $t('common.create', $t('system.user.name'));
});
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
