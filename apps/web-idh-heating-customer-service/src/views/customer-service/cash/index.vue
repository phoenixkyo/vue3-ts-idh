<template>
  <div class="customer-service-cash">
    <!-- 统计数据卡片 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:chart-bar" />
          <span>缴费统计</span>
        </div>
      </template>
      <div class="stats-container">
        <div class="stat-card stat-0">
          <div class="stat-icon">
            <Icon icon="fas:map-marker-alt" />
          </div>
          <div class="stat-info">
            <h3 id="currentCommunity">未设置</h3>
            <p>当前小区</p>
          </div>
        </div>
        <div class="stat-card stat-1">
          <div class="stat-icon">
            <Icon icon="fas:home" />
          </div>
          <div class="stat-info">
            <h3 id="totalHouseholds">0</h3>
            <p>总住户数</p>
          </div>
        </div>
        <div class="stat-card stat-2">
          <div class="stat-icon">
            <Icon icon="fas:check-circle" />
          </div>
          <div class="stat-info">
            <h3 id="totalPaid">0</h3>
            <p>已缴费数</p>
          </div>
        </div>
        <div class="stat-card stat-3">
          <div class="stat-icon">
            <Icon icon="fas:money-bill-wave" />
          </div>
          <div class="stat-info">
            <h3 id="totalAmount">¥0</h3>
            <p>收费总额</p>
          </div>
        </div>
        <div class="stat-card stat-4">
          <div class="stat-icon">
            <Icon icon="fas:coins" />
          </div>
          <div class="stat-info">
            <h3 id="changeAmount">¥0</h3>
            <p>零钱总额</p>
          </div>
        </div>
        <div class="stat-card stat-5">
          <div class="stat-icon">
            <Icon icon="fas:calendar-check" />
          </div>
          <div class="stat-info">
            <h3 id="todayPaid">0</h3>
            <p>今日缴费数</p>
          </div>
        </div>
        <div class="stat-card stat-6">
          <div class="stat-icon">
            <Icon icon="fas:dollar-sign" />
          </div>
          <div class="stat-info">
            <h3 id="todayAmount">¥0</h3>
            <p>今日收费总额</p>
          </div>
        </div>
      </div>
    </VCard>

    <!-- 银行存现卡片 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:university" />
          <span>银行存现</span>
        </div>
      </template>
      <div class="card-body">
        <div class="grid grid-cols-3 gap-4">
          <VFormItem label="存现日期" prop="depositDate">
            <VInput
              type="date"
              v-model="depositForm.depositDate"
            />
          </VFormItem>
          <VFormItem label="当日缴费数" prop="depositCount">
            <VInput
              type="number"
              v-model="depositForm.depositCount"
              readonly
            />
          </VFormItem>
          <VFormItem label="当日应存金额(元)" prop="depositShouldPay">
            <VInput
              type="number"
              v-model="depositForm.depositShouldPay"
              step="0.01"
              readonly
            />
          </VFormItem>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <VFormItem label="当日实存金额(元)" prop="depositActualPay">
            <VInput
              type="number"
              v-model="depositForm.depositActualPay"
              step="0.01"
              readonly
            />
          </VFormItem>
          <VFormItem label="存现损耗(元)" prop="depositLoss">
            <VInput
              type="number"
              v-model="depositForm.depositLoss"
              step="0.01"
              readonly
            />
          </VFormItem>
          <VFormItem label="存现状态" prop="depositStatus">
            <VInput
              v-model="depositForm.depositStatus"
              readonly
            />
          </VFormItem>
        </div>
        <div class="flex justify-center mt-4">
          <VButton type="primary" prependIcon="fas:save">
            确认存现
          </VButton>
        </div>
      </div>
    </VCard>

    <!-- 功能操作区 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:cogs" />
          <span>功能操作</span>
        </div>
      </template>

      <!-- 第一行：小区选择 + 功能按钮 -->
      <div class="payment-toolbar flex justify-between items-center mb-4">
        <div class="payment-toolbar-buttons">
          <VButton type="primary" prependIcon="fas:plus-circle" @click="handleCreatePayment">
            新建
          </VButton>
          <VButton type="danger" prependIcon="fas:download">
            导出
          </VButton>
        </div>
      </div>

      <!-- 第二行查询条件 -->
      <template #header>
        <div class="card-title">
          <Icon icon="fas:search" />
          <span>收费查询</span>
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

          <VFormItem label="支付方式" prop="paymentMethod">
            <VSelect
              v-model="searchForm.paymentMethod"
              placeholder="全部"
              clearable
            >
              <VOption value="">全部</VOption>
              <VOption value="现金">现金</VOption>
              <VOption value="微信支付">微信支付</VOption>
              <VOption value="支付宝">支付宝</VOption>
              <VOption value="银行卡">银行卡</VOption>
              <VOption value="其他">其他</VOption>
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

    <!-- 收费记录列表 -->
    <VCard>
      <template #header>
        <div class="card-title">
          <Icon icon="fas:list" />
          <span>收费记录列表</span>
        </div>
      </template>

      <div class="table-container">
        <VTable
          :columns="paymentColumns"
          :data-source="paymentData"
          :pagination="tablePagination"
          @page-change="handlePageChange"
        >
          <template #operation="{ record }">
            <VButton type="primary" size="small" @click="handleEditPayment(record)">
              编辑
            </VButton>
            <VButton type="danger" size="small" @click="handleDeletePayment(record)">
              删除
            </VButton>
            <VButton type="info" size="small" @click="handleViewPayment(record)">
              详情
            </VButton>
          </template>
        </VTable>
      </div>

      <!-- 无数据提示 -->
      <div v-if="paymentData.length === 0" class="no-data text-center py-12">
        <Icon icon="fas:file-invoice-dollar" size="48" class="text-gray-300 mb-4" />
        <h3 class="text-xl font-semibold text-gray-500 mb-2">暂无收费记录</h3>
        <p class="text-gray-400">请添加第一条供暖费收费记录</p>
      </div>
    </VCard>

    <!-- 新建收费模态框 -->
    <VModal
      v-model:show="showCreatePaymentModal"
      title="新建收费"
      width="800px"
    >
      <VForm ref="paymentFormRef" :model="paymentForm" :rules="paymentRules">
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <VFormItem label="收费单号" prop="paymentNumber">
              <VInput
                v-model="paymentForm.paymentNumber"
                readonly
              />
            </VFormItem>
            <VFormItem label="收据编号" prop="receiptNumber">
              <VInput
                v-model="paymentForm.receiptNumber"
                placeholder="请输入收据编号"
              />
            </VFormItem>
            <VFormItem label="创建时间" prop="createTime">
              <VInput
                v-model="paymentForm.createTime"
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
                    v-model="paymentForm.community"
                    placeholder="请选择小区"
                  >
                    <VOption value="">请选择小区</VOption>
                    <!-- 小区选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="楼号" prop="building">
                  <VSelect
                    v-model="paymentForm.building"
                    placeholder="请选择楼号"
                  >
                    <VOption value="">请选择楼号</VOption>
                    <!-- 楼号选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="单元" prop="unit">
                  <VSelect
                    v-model="paymentForm.unit"
                    placeholder="请选择单元"
                  >
                    <VOption value="">请选择单元</VOption>
                    <!-- 单元选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
                <VFormItem label="房号" prop="room">
                  <VSelect
                    v-model="paymentForm.room"
                    placeholder="请选择房号"
                  >
                    <VOption value="">请选择房号</VOption>
                    <!-- 房号选项将通过API动态加载 -->
                  </VSelect>
                </VFormItem>
              </div>
              <div class="grid grid-cols-4 gap-4">
                <VFormItem label="供暖面积(㎡)" prop="area">
                  <VInput
                    type="number"
                    v-model="paymentForm.area"
                    step="0.01"
                    readonly
                  />
                </VFormItem>
                <VFormItem label="业主姓名" prop="owner">
                  <VInput
                    v-model="paymentForm.owner"
                    placeholder="请输入业主姓名"
                  />
                </VFormItem>
                <VFormItem label="电话" prop="phone">
                  <VInput
                    v-model="paymentForm.phone"
                    placeholder="请输入电话"
                  />
                </VFormItem>
              </div>
            </div>
          </VFormItem>

          <!-- 账单信息区域 -->
          <VFormItem label="账单信息">
            <div class="bills-container">
              <div class="bill-header">
                <div>选择</div>
                <div>供暖季</div>
                <div>缴费状态</div>
                <div>费用类型</div>
                <div>应缴(元)</div>
                <div>实缴(元)</div>
                <div>欠费(元)</div>
              </div>
              <!-- 账单行将通过API动态加载 -->
              <div class="bill-row">
                <!-- 账单内容 -->
              </div>
            </div>
          </VFormItem>

          <!-- 收费信息区域 -->
          <VFormItem label="收费信息">
            <div class="space-y-4 p-4 bg-gray-50 rounded">
              <div class="grid grid-cols-3 gap-4">
                <VFormItem label="应缴金额(元)" prop="shouldPay">
                  <VInput
                    type="number"
                    v-model="paymentForm.shouldPay"
                    step="0.01"
                    readonly
                  />
                </VFormItem>
                <VFormItem label="实收金额(元)" prop="actualPay">
                  <VInput
                    type="number"
                    v-model="paymentForm.actualPay"
                    step="0.01"
                  />
                </VFormItem>
                <VFormItem label="应找金额(元)" prop="shouldChange">
                  <VInput
                    type="number"
                    v-model="paymentForm.shouldChange"
                    step="0.01"
                    readonly
                  />
                </VFormItem>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <VFormItem label="实找金额(元)" prop="actualChange">
                  <VInput
                    type="number"
                    v-model="paymentForm.actualChange"
                    step="0.01"
                  />
                </VFormItem>
                <VFormItem label="支付方式" prop="paymentMethod">
                  <VSelect
                    v-model="paymentForm.paymentMethod"
                    placeholder="请选择支付方式"
                  >
                    <VOption value="现金">现金</VOption>
                    <VOption value="微信支付">微信支付</VOption>
                    <VOption value="支付宝">支付宝</VOption>
                    <VOption value="银行卡">银行卡</VOption>
                    <VOption value="其他">其他</VOption>
                  </VSelect>
                </VFormItem>
                <VFormItem label="收费日期" prop="paymentDate">
                  <VInput
                    type="datetime-local"
                    v-model="paymentForm.paymentDate"
                  />
                </VFormItem>
              </div>
              <VFormItem label="备注" prop="notes">
                <VInput
                  type="textarea"
                  v-model="paymentForm.notes"
                  rows="2"
                  placeholder="请输入备注"
                />
              </VFormItem>
            </div>
          </VFormItem>
        </div>
      </VForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <VButton @click="showCreatePaymentModal = false">取消</VButton>
          <VButton type="primary" @click="handleSubmitPayment">保存</VButton>
        </div>
      </template>
    </VModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { VCard, VButton, VForm, VFormItem, VInput, VSelect, VTable, VModal } from 'element-plus';
import { Icon } from '@vben/components';

// 银行存现表单
const depositForm = reactive({
  depositDate: '',
  depositCount: 0,
  depositShouldPay: 0.00,
  depositActualPay: 0.00,
  depositLoss: 0.00,
  depositStatus: '未存现'
});

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
  paymentMethod: ''
});

const searchRules = reactive({});

// 表格分页
const tablePagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 30, 50, 100]
});

// 收费记录数据
const paymentData = ref([]);

// 收费记录列配置
const paymentColumns = [
  { title: '收费单号', dataIndex: 'paymentNumber', key: 'paymentNumber' },
  { title: '小区', dataIndex: 'community', key: 'community' },
  { title: '楼号', dataIndex: 'building', key: 'building' },
  { title: '单元', dataIndex: 'unit', key: 'unit' },
  { title: '房号', dataIndex: 'room', key: 'room' },
  { title: '业主', dataIndex: 'owner', key: 'owner' },
  { title: '电话', dataIndex: 'phone', key: 'phone' },
  { title: '应缴', dataIndex: 'shouldPay', key: 'shouldPay' },
  { title: '实收', dataIndex: 'actualPay', key: 'actualPay' },
  { title: '应找', dataIndex: 'shouldChange', key: 'shouldChange' },
  { title: '实找', dataIndex: 'actualChange', key: 'actualChange' },
  { title: '日期', dataIndex: 'paymentDate', key: 'paymentDate' },
  { title: '支付方式', dataIndex: 'paymentMethod', key: 'paymentMethod' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '操作', key: 'operation', slots: { customRender: 'operation' } }
];

// 新建收费模态框
const showCreatePaymentModal = ref(false);
const paymentFormRef = ref();
const paymentForm = reactive({
  paymentNumber: '',
  receiptNumber: '',
  createTime: '',
  community: '',
  building: '',
  unit: '',
  room: '',
  area: '',
  owner: '',
  phone: '',
  shouldPay: 0.00,
  actualPay: 0.00,
  shouldChange: 0.00,
  actualChange: 0.00,
  paymentMethod: '',
  paymentDate: '',
  notes: ''
});

const paymentRules = reactive({
  receiptNumber: [{ required: true, message: '请输入收据编号', trigger: 'blur' }],
  community: [{ required: true, message: '请选择小区', trigger: 'change' }],
  building: [{ required: true, message: '请选择楼号', trigger: 'change' }],
  unit: [{ required: true, message: '请选择单元', trigger: 'change' }],
  room: [{ required: true, message: '请选择房号', trigger: 'change' }],
  owner: [{ required: true, message: '请输入业主姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  actualPay: [{ required: true, message: '请输入实收金额', trigger: 'blur' }],
  actualChange: [{ required: true, message: '请输入实找金额', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  paymentDate: [{ required: true, message: '请选择收费日期', trigger: 'change' }]
});

// 生命周期钩子
onMounted(() => {
  // 初始化数据
  initData();
});

// 初始化数据
const initData = () => {
  // 这里将通过API获取真实数据
  // 暂时使用模拟数据
  paymentData.value = [];
  tablePagination.total = 0;
};

// 生成收费单号
const generatePaymentNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  paymentForm.paymentNumber = `SF${dateStr}001`;
  paymentForm.createTime = now.toISOString().slice(0, 19).replace('T', ' ');
  paymentForm.paymentDate = now.toISOString().slice(0, 16);
};

// 处理新建收费
const handleCreatePayment = () => {
  showCreatePaymentModal.value = true;
  // 重置表单
  if (paymentFormRef.value) {
    paymentFormRef.value.resetFields();
  }
  // 重新生成收费单号和创建时间
  generatePaymentNumber();
};

// 处理提交收费
const handleSubmitPayment = () => {
  if (paymentFormRef.value) {
    paymentFormRef.value.validate((valid) => {
      if (valid) {
        // 提交表单数据
        console.log('提交收费:', paymentForm);
        // 这里将通过API提交真实数据
        // 暂时关闭模态框
        showCreatePaymentModal.value = false;
      }
    });
  }
};

// 处理编辑收费
const handleEditPayment = (record) => {
  console.log('编辑收费:', record);
};

// 处理删除收费
const handleDeletePayment = (record) => {
  console.log('删除收费:', record);
};

// 处理查看收费
const handleViewPayment = (record) => {
  console.log('查看收费:', record);
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
  margin-right: 16px;
}

.stat-card:nth-child(1) .stat-icon {
  background-color: #1890ff;
}

.stat-card:nth-child(2) .stat-icon {
  background-color: #52c41a;
}

.stat-card:nth-child(3) .stat-icon {
  background-color: #faad14;
}

.stat-card:nth-child(4) .stat-icon {
  background-color: #f5222d;
}

.stat-card:nth-child(5) .stat-icon {
  background-color: #722ed1;
}

.stat-card:nth-child(6) .stat-icon {
  background-color: #eb2f96;
}

.stat-card:nth-child(7) .stat-icon {
  background-color: #fa8c16;
}

.stat-info h3 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.stat-info p {
  margin: 4px 0 0 0;
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

.no-data {
  text-align: center;
  padding: 40px 0;
}

.bills-container {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.bill-header {
  display: grid;
  grid-template-columns: 60px 120px 100px 100px 100px 100px 100px;
  background-color: #fafafa;
  padding: 10px;
  font-weight: bold;
  border-bottom: 1px solid #e8e8e8;
}

.bill-row {
  display: grid;
  grid-template-columns: 60px 120px 100px 100px 100px 100px 100px;
  padding: 10px;
  border-bottom: 1px solid #e8e8e8;
}

.bill-row:last-child {
  border-bottom: none;
}
</style>
