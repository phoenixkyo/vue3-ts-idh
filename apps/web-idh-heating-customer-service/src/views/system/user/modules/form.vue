<template>
  <VbenForm
    :model="formData"
    :rules="formRules"
    :schemas="formSchema"
    :label-width="120"
    @finish="handleSubmit"
  >
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" native-type="submit">提交</el-button>
    </template>
  </VbenForm>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useFormModal } from '@vben/core';
import { formRules } from '../data';

const emit = defineEmits(['submit', 'cancel']);
const props = defineProps<{
  type: 'create' | 'update';
  formData: any;
}>();

const { modalInstance } = useFormModal();

const formData = ref({ ...props.formData });

// 监听外部formData变化，用于编辑时
watch(() => props.formData, (newVal) => {
  formData.value = { ...newVal };
}, { deep: true });

const formSchema = [
  {
    field: 'username',
    label: '用户名',
    component: 'Input',
    required: true,
  },
  {
    field: 'password',
    label: '密码',
    component: 'InputPassword',
    required: props.type === 'create',
    helpMessage: props.type === 'update' ? '不填则不修改密码' : '',
  },
  {
    field: 'nickname',
    label: '昵称',
    component: 'Input',
    required: true,
  },
  {
    field: 'real_name',
    label: '姓名',
    component: 'Input',
    required: true,
  },
  {
    field: 'gender',
    label: '性别',
    component: 'Select',
    componentProps: {
      options: [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
      ],
    },
    required: true,
  },
  {
    field: 'phone',
    label: '电话',
    component: 'Input',
    required: true,
  },
  {
    field: 'email',
    label: '邮箱',
    component: 'Input',
    required: true,
  },
  {
    field: 'dept_id',
    label: '部门ID',
    component: 'InputNumber',
    required: true,
  },
  {
    field: 'post_id',
    label: '岗位ID',
    component: 'InputNumber',
    required: true,
  },
  {
    field: 'is_admin',
    label: '是否管理员',
    component: 'Switch',
    defaultValue: 0,
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '激活', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
    },
    required: true,
  },
];

const handleSubmit = () => {
  emit('submit', formData.value);
};

const handleCancel = () => {
  emit('cancel');
};
</script>