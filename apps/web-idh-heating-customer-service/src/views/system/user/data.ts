import type { BasicColumn } from '@vben/core';

// 用户列表列配置
export const columns: BasicColumn[] = [
  {
    title: '用户ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    width: 120,
  },
  {
    title: '姓名',
    dataIndex: 'real_name',
    width: 100,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    width: 80,
  },
  {
    title: '电话',
    dataIndex: 'phone',
    width: 150,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    width: 200,
  },
  {
    title: '部门ID',
    dataIndex: 'dept_id',
    width: 100,
  },
  {
    title: '岗位ID',
    dataIndex: 'post_id',
    width: 100,
  },
  {
    title: '是否管理员',
    dataIndex: 'is_admin',
    width: 100,
    customRender: ({ text }) => (text ? '是' : '否'),
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 180,
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    width: 180,
  },
];

// 搜索表单配置
export const searchFormSchema = [
  {
    field: 'username',
    label: '用户名',
    component: 'Input',
    colProps: {
      span: 8,
    },
  },
  {
    field: 'real_name',
    label: '姓名',
    component: 'Input',
    colProps: {
      span: 8,
    },
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
    colProps: {
      span: 8,
    },
  },
];

// 表单验证规则
export const formRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  real_name: [
    { required: true, message: '姓名不能为空', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '电话不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  dept_id: [
    { required: true, message: '部门不能为空', trigger: 'blur' },
  ],
  post_id: [
    { required: true, message: '岗位不能为空', trigger: 'blur' },
  ],
};