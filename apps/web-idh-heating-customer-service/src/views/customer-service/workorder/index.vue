<template>
  <div class="customer-service-workorder">
    <!-- 统计卡片 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:chart-bar" />
          <span>工单统计</span>
        </div>
      </template>
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon danger">
            <Icon icon="fas:tasks" />
          </div>
          <div class="stat-value">{{ totalTickets }}</div>
          <div class="stat-label">总工单数</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <Icon icon="fas:exclamation-circle" />
          </div>
          <div class="stat-value">{{ pendingTickets }}</div>
          <div class="stat-label">未开始</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon primary">
            <Icon icon="fas:clock" />
          </div>
          <div class="stat-value">{{ inProgressTickets }}</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">
            <Icon icon="fas:check-circle" />
          </div>
          <div class="stat-value">{{ completedTickets }}</div>
          <div class="stat-label">已办结</div>
        </div>
      </div>
    </VCard>

    <!-- 功能区 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:cogs" />
          <span>功能操作</span>
        </div>
      </template>

      <!-- 第一行按钮 -->
      <div class="btn-group mb-4">
        <VButton type="primary" prependIcon="fas:plus-circle" @click="handleCreateTicket">
          新建
        </VButton>
        <VButton type="danger" prependIcon="fas:download">
          导出
        </VButton>
      </div>

      <!-- 第二行查询条件 -->
      <template #header>
        <div class="card-title">
          <Icon icon="fas:search" />
          <span>工单查询</span>
        </div>
      </template>

      <VForm class="search-form" :model="searchForm" :rules="searchRules">
        <div class="flex flex-wrap gap-4">
          <VFormItem label="小区名称" prop="community">
            <VSelect
              v-model="searchForm.community"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <!-- 小区选项将通过API动态加载 -->
            </VSelect>
          </VFormItem>

          <VFormItem label="楼号" prop="building">
            <VSelect
              v-model="searchForm.building"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <!-- 楼号选项将通过API动态加载 -->
            </VSelect>
          </VFormItem>

          <VFormItem label="单元" prop="unit">
            <VSelect
              v-model="searchForm.unit"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <!-- 单元选项将通过API动态加载 -->
            </VSelect>
          </VFormItem>

          <VFormItem label="房号" prop="room">
            <VSelect
              v-model="searchForm.room"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <!-- 房号选项将通过API动态加载 -->
            </VSelect>
          </VFormItem>

          <VFormItem label="业主姓名" prop="owner">
            <VInput
              v-model="searchForm.owner"
              placeholder="请输入业主姓名"
              clearable
            />
          </VFormItem>

          <VFormItem label="电话" prop="phone">
            <VInput
              v-model="searchForm.phone"
              placeholder="请输入电话"
              clearable
            />
          </VFormItem>

          <VFormItem label="供暖季时间" prop="heatingSeason">
            <VSelect
              v-model="searchForm.heatingSeason"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="2024-2025">2024-2025</VOption>
              <VOption value="2025-2026">2025-2026</VOption>
            </VSelect>
          </VFormItem>

          <VFormItem label="缴费状态" prop="paymentStatus">
            <VSelect
              v-model="searchForm.paymentStatus"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="已缴费">已缴费</VOption>
              <VOption value="欠费">欠费</VOption>
            </VSelect>
          </VFormItem>

          <VFormItem label="费用类型" prop="feeType">
            <VSelect
              v-model="searchForm.feeType"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="全费">全费</VOption>
              <VOption value="空置费">空置费</VOption>
            </VSelect>
          </VFormItem>

          <VFormItem label="工单类型" prop="ticketType">
            <VSelect
              v-model="searchForm.ticketType"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="咨询">咨询</VOption>
              <VOption value="缴费">缴费</VOption>
              <VOption value="报修">报修</VOption>
              <VOption value="投诉（客观）">投诉（客观）</VOption>
              <VOption value="投诉（主观）">投诉（主观）</VOption>
              <VOption value="测温">测温</VOption>
            </VSelect>
          </VFormItem>

          <VFormItem label="工单状态" prop="ticketStatus">
            <VSelect
              v-model="searchForm.ticketStatus"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="未开始">未开始</VOption>
              <VOption value="进行中">进行中</VOption>
              <VOption value="已办结">已办结</VOption>
              <VOption value="已撤销">已撤销</VOption>
              <VOption value="已删除">已删除</VOption>
              <VOption value="已关闭">已关闭</VOption>
            </VSelect>
          </VFormItem>

          <VFormItem>
            <VButton type="accent" prependIcon="fas:search" @click="handleSearch">
              查询
            </VButton>
          </VFormItem>
        </div>
      </VForm>
    </VCard>

    <!-- 工单列表 -->
    <VCard>
      <template #header>
        <div class="card-title">
          <Icon icon="fas:list" />
          <span>工单列表</span>
        </div>
      </template>

      <div class="table-container">
        <VTable
          :columns="ticketColumns"
          :data-source="ticketData"
          :pagination="tablePagination"
          @page-change="handlePageChange"
        >
          <template #operation="{ record }">
            <VButton type="primary" size="small" @click="handleEditTicket(record)">
              编辑
            </VButton>
            <VButton type="danger" size="small" @click="handleDeleteTicket(record)">
              删除
            </VButton>
            <VButton type="info" size="small" @click="handleViewTicket(record)">
              详情
            </VButton>
          </template>
        </VTable>
      </div>
    </VCard>

    <!-- 新建工单模态框 -->
    <VModal
      v-model:show="showCreateTicketModal"
      title="新建工单"
      width="800px"
    >
      <VForm ref="ticketFormRef" :model="ticketForm" :rules="ticketRules">
        <!-- 工单表单内容 -->
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <VFormItem label="工单号" prop="ticketNumber">
              <VInput
                v-model="ticketForm.ticketNumber"
                readonly
              />
            </VFormItem>
            <VFormItem label="创建时间" prop="createTime">
              <VInput
                v-model="ticketForm.createTime"
                readonly
              />
            </VFormItem>
          </div>

          <!-- 用户信息区域 -->
          <VFormItem label="用户信息">
            <div class="space-y-4 p-4 bg-gray-50 rounded">
              <div class="grid grid-cols-4 gap-4">
                <VFormItem label="小区名称" prop="community">
                  <VSelect
                    v-model="ticketForm.community"
                    placeholder="请选择小区"
                  >
                    <VOption value="">请选择小区</VOption>
                    <!-- 小区选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="楼号" prop="building">
                  <VSelect
                    v-model="ticketForm.building"
                    placeholder="请选择楼号"
                  >
                    <VOption value="">请选择楼号</VOption>
                    <!-- 楼号选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="单元" prop="unit">
                  <VSelect
                    v-model="ticketForm.unit"
                    placeholder="请选择单元"
                  >
                    <VOption value="">请选择单元</VOption>
                    <!-- 单元选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="房号" prop="room">
                  <VSelect
                    v-model="ticketForm.room"
                    placeholder="请选择房号"
                  >
                    <VOption value="">请选择房号</VOption>
                    <!-- 房号选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
              </div>
              <div class="grid grid-cols-4 gap-4">
                <VFormItem label="面积(㎡)" prop="area">
                  <VInput
                    v-model="ticketForm.area"
                    type="number"
                    step="0.01"
                    readonly
                  />
                </VFormItem>
                <VFormItem label="业主姓名" prop="owner">
                  <VInput
                    v-model="ticketForm.owner"
                    placeholder="请输入业主姓名"
                  />
                </VFormItem>
                <VFormItem label="电话" prop="phone">
                  <VInput
                    v-model="ticketForm.phone"
                    placeholder="请输入电话"
                  />
                </VFormItem>
              </div>
            </div>
          </VFormItem>

          <!-- 工单信息区域 -->
          <VFormItem label="工单信息">
            <div class="space-y-4 p-4 bg-gray-50 rounded">
              <div class="grid grid-cols-3 gap-4">
                <VFormItem label="创建人" prop="creator">
                  <VInput
                    v-model="ticketForm.creator"
                    placeholder="请输入创建人"
                  />
                </VFormItem>
                <VFormItem label="办理人" prop="processor">
                  <VInput
                    v-model="ticketForm.processor"
                    placeholder="请输入办理人"
                  />
                </VFormItem>
                <VFormItem label="缴费状态" prop="paymentStatus">
                  <VSelect
                    v-model="ticketForm.paymentStatus"
                    placeholder="请选择缴费状态"
                  >
                    <VOption value="已缴费">已缴费</VOption>
                    <VOption value="欠费">欠费</VOption>
                  </VSelect>
                </VFormItem>
              </div>
              <VFormItem label="问题描述" prop="description">
                <VInput
                  v-model="ticketForm.description"
                  type="textarea"
                  rows="4"
                  placeholder="请输入问题描述"
                />
              </VFormItem>
              <div class="grid grid-cols-2 gap-4">
                <VFormItem label="工单类型" prop="type">
                  <VSelect
                    v-model="ticketForm.type"
                    placeholder="请选择工单类型"
                  >
                    <VOption value="咨询">咨询</VOption>
                    <VOption value="缴费">缴费</VOption>
                    <VOption value="报修">报修</VOption>
                    <VOption value="投诉（客观）">投诉（客观）</VOption>
                    <VOption value="投诉（主观）">投诉（主观）</VOption>
                    <VOption value="测温">测温</VOption>
                  </VSelect>
                </VFormItem>
                <VFormItem label="工单状态" prop="status">
                  <VSelect
                    v-model="ticketForm.status"
                    placeholder="请选择工单状态"
                  >
                    <VOption value="未开始">未开始</VOption>
                    <VOption value="进行中">进行中</VOption>
                    <VOption value="已办结">已办结</VOption>
                    <VOption value="已撤销">已撤销</VOption>
                    <VOption value="已删除">已删除</VOption>
                    <VOption value="已关闭">已关闭</VOption>
                  </VSelect>
                </VFormItem>
              </div>
            </div>
          </VFormItem>
        </div>
      </VForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <VButton @click="showCreateTicketModal = false">取消</VButton>
          <VButton type="primary" @click="handleSubmitTicket">保存</VButton>
        </div>
      </template>
    </VModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { VCard, VButton, VForm, VFormItem, VInput, VSelect, VTable, VModal } from 'element-plus';
import { Icon } from '@vben/components';

// 统计数据
const totalTickets = ref(0);
const pendingTickets = ref(0);
const inProgressTickets = ref(0);
const completedTickets = ref(0);

// 查询表单
const searchForm = reactive({
  community: '',
  building: '',
  unit: '',
  room: '',
  owner: '',
  phone: '',
  heatingSeason: '',
  paymentStatus: '',
  feeType: '',
  ticketType: '',
  ticketStatus: ''
});

const searchRules = reactive({});

// 表格分页
const tablePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 30, 50, 100]
});

// 工单列表数据
const ticketData = ref([]);

// 工单列配置
const ticketColumns = [
  { title: '工单号', dataIndex: 'ticketNumber', key: 'ticketNumber' },
  { title: '小区', dataIndex: 'community', key: 'community' },
  { title: '楼号', dataIndex: 'building', key: 'building' },
  { title: '单元', dataIndex: 'unit', key: 'unit' },
  { title: '房号', dataIndex: 'room', key: 'room' },
  { title: '业主', dataIndex: 'owner', key: 'owner' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '缴费状态', dataIndex: 'paymentStatus', key: 'paymentStatus' },
  { title: '工单类型', dataIndex: 'ticketType', key: 'ticketType' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '工单状态', dataIndex: 'ticketStatus', key: 'ticketStatus' },
  { title: '操作', key: 'operation', slots: { customRender: 'operation' } }
];

// 新建工单模态框
const showCreateTicketModal = ref(false);
const ticketFormRef = ref();
const ticketForm = reactive({
  ticketNumber: '',
  createTime: '',
  community: '',
  building: '',
  unit: '',
  room: '',
  area: '',
  owner: '',
  phone: '',
  creator: '',
  processor: '',
  paymentStatus: '',
  description: '',
  type: '',
  status: ''
});

const ticketRules = reactive({
  ticketNumber: [{ required: true, message: '工单号不能为空', trigger: 'blur' }],
  community: [{ required: true, message: '请选择小区', trigger: 'change' }],
  building: [{ required: true, message: '请选择楼号', trigger: 'change' }],
  unit: [{ required: true, message: '请选择单元', trigger: 'change' }],
  room: [{ required: true, message: '请选择房号', trigger: 'change' }],
  owner: [{ required: true, message: '请输入业主姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  creator: [{ required: true, message: '请输入创建人', trigger: 'blur' }],
  processor: [{ required: true, message: '请输入办理人', trigger: 'blur' }],
  paymentStatus: [{ required: true, message: '请选择缴费状态', trigger: 'change' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择工单状态', trigger: 'change' }]
});

// 生命周期钩子
onMounted(() => {
  // 初始化数据
  initData();
  // 生成默认工单号和创建时间
  generateTicketNumber();
});

// 初始化数据
const initData = () => {
  // 这里将通过API获取真实数据
  // 暂时使用模拟数据
  ticketData.value = [];
  tablePagination.total = 0;
};

// 生成工单号
const generateTicketNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  ticketForm.ticketNumber = `GD${dateStr}001`;
  ticketForm.createTime = now.toISOString().slice(0, 19).replace('T', ' ');
};

// 处理新建工单
const handleCreateTicket = () => {
  showCreateTicketModal.value = true;
  // 重置表单
  if (ticketFormRef.value) {
    ticketFormRef.value.resetFields();
  }
  // 重新生成工单号和创建时间
  generateTicketNumber();
};

// 处理提交工单
const handleSubmitTicket = () => {
  if (ticketFormRef.value) {
    ticketFormRef.value.validate((valid) => {
      if (valid) {
        // 提交表单数据
        console.log('提交工单:', ticketForm);
        // 这里将通过API提交真实数据
        // 暂时关闭模态框
        showCreateTicketModal.value = false;
      }
    });
  }
};

// 处理编辑工单
const handleEditTicket = (record) => {
  console.log('编辑工单:', record);
};

// 处理删除工单
const handleDeleteTicket = (record) => {
  console.log('删除工单:', record);
};

// 处理查看工单
const handleViewTicket = (record) => {
  console.log('查看工单:', record);
};

// 处理搜索
const handleSearch = () => {
  console.log('搜索条件:', searchForm);
  // 这里将通过API获取真实数据
};

// 处理分页变化
const handlePageChange = (pagination) => {
  tablePagination.current = pagination.current;
  tablePagination.pageSize = pagination.pageSize;
  // 重新获取数据
  initData();
};
</script>

<style scoped>
/* 自定义样式 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  border-radius: 50%;
  margin-bottom: 10px;
}

.stat-icon.danger {
  background-color: #ff4d4f;
}

.stat-icon.warning {
  background-color: #faad14;
}

.stat-icon.primary {
  background-color: #1890ff;
}

.stat-icon.success {
  background-color: #52c41a;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
}

.search-form {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.table-container {
  overflow-x: auto;
}
</style>