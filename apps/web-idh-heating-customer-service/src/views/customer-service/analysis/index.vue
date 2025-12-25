<template>
  <div class="customer-service-analysis">
    <!-- 系统概览 -->
    <section id="dashboard">
      <!-- 工单统计卡片 -->
      <VCard class="mb-4">
        <template #header>
          <div class="card-title">
            <Icon icon="fas:chart-bar" />
            <span>工单统计</span>
          </div>
        </template>
        <!-- 统计数据 -->
        <div class="stats-container">
          <div class="stat-card stat-1">
            <div class="stat-icon">
              <Icon icon="fas:ticket-alt" />
            </div>
            <div class="stat-info">
              <h3 id="totalWorkOrders">0</h3>
              <p>总工单数</p>
            </div>
          </div>
          <div class="stat-card stat-2">
            <div class="stat-icon">
              <Icon icon="fas:calendar-day" />
            </div>
            <div class="stat-info">
              <h3 id="todayWorkOrders">0</h3>
              <p>今日工单</p>
            </div>
          </div>
          <div class="stat-card stat-3">
            <div class="stat-icon">
              <Icon icon="fas:hourglass-start" />
            </div>
            <div class="stat-info">
              <h3 id="pendingWorkOrders">0</h3>
              <p>未开始</p>
            </div>
          </div>
          <div class="stat-card stat-4">
            <div class="stat-icon">
              <Icon icon="fas:spinner" />
            </div>
            <div class="stat-info">
              <h3 id="progressWorkOrders">0</h3>
              <p>进行中</p>
            </div>
          </div>
          <div class="stat-card stat-5">
            <div class="stat-icon">
              <Icon icon="fas:check-circle" />
            </div>
            <div class="stat-info">
              <h3 id="completedWorkOrders">0</h3>
              <p>已办结</p>
            </div>
          </div>
        </div>
      </VCard>

      <!-- 工单区域 -->
      <VCard class="mb-4">
        <template #header>
          <div class="card-title">
            <Icon icon="fas:ticket-alt" />
            <span>工单统计图表</span>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-line" />
              <span>工单趋势</span>
            </h2>
            <div class="chart-container">
              <canvas id="trendChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-pie" />
              <span>工单状态分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="statusChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:building" />
              <span>小区工单分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="communityChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:home" />
              <span>楼栋工单分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="buildingChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:clock" />
              <span>处理时效分析</span>
            </h2>
            <div class="chart-container">
              <canvas id="timeChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:tags" />
              <span>工单类型分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="ticketTypeChart"></canvas>
            </div>
          </div>
        </div>
      </VCard>

      <!-- 收费记录区域 -->
      <VCard>
        <template #header>
          <div class="card-title">
            <Icon icon="fas:credit-card" />
            <span>收费统计图表</span>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-pie" />
              <span>缴费状态分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="paymentStatusChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-bar" />
              <span>每日缴费统计</span>
            </h2>
            <div class="chart-container">
              <canvas id="dailyPaymentChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-pie" />
              <span>缴费方式分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="paymentMethodChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:building" />
              <span>小区缴费统计</span>
            </h2>
            <div class="chart-container">
              <canvas id="communityPaymentChart"></canvas>
            </div>
          </div>

          <div class="card">
            <h2 class="card-title">
              <Icon icon="fas:chart-bar" />
              <span>缴费金额区间分布</span>
            </h2>
            <div class="chart-container">
              <canvas id="amountRangeChart"></canvas>
            </div>
          </div>
        </div>
      </VCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { VCard } from 'element-plus';
import { Icon } from '@vben/components';
import Chart from 'chart.js/auto';

// 生命周期钩子
onMounted(() => {
  // 初始化图表
  initCharts();
});

// 初始化所有图表
const initCharts = () => {
  // 工单趋势图表
  initTrendChart();
  // 工单状态分布图表
  initStatusChart();
  // 小区工单分布图表
  initCommunityChart();
  // 楼栋工单分布图表
  initBuildingChart();
  // 处理时效分析图表
  initTimeChart();
  // 工单类型分布图表
  initTicketTypeChart();
  // 缴费状态分布图表
  initPaymentStatusChart();
  // 每日缴费统计图表
  initDailyPaymentChart();
  // 缴费方式分布图表
  initPaymentMethodChart();
  // 小区缴费统计图表
  initCommunityPaymentChart();
  // 缴费金额区间分布图表
  initAmountRangeChart();
};

// 初始化工单趋势图表
const initTrendChart = () => {
  const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
          label: '工单数量',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化工单状态分布图表
const initStatusChart = () => {
  const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['未开始', '进行中', '已办结', '已撤销', '已关闭'],
        datasets: [{
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            '#ff4d4f',
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#722ed1'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化小区工单分布图表
const initCommunityChart = () => {
  const ctx = document.getElementById('communityChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['小区A', '小区B', '小区C', '小区D'],
        datasets: [{
          label: '工单数量',
          data: [12, 19, 3, 5],
          backgroundColor: '#1890ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y'
      }
    });
  }
};

// 初始化楼栋工单分布图表
const initBuildingChart = () => {
  const ctx = document.getElementById('buildingChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1号楼', '2号楼', '3号楼', '4号楼', '5号楼'],
        datasets: [{
          label: '工单数量',
          data: [12, 19, 3, 5, 2],
          backgroundColor: '#52c41a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化处理时效分析图表
const initTimeChart = () => {
  const ctx = document.getElementById('timeChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        datasets: [{
          label: '平均处理时间(小时)',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: '#ff4d4f',
          backgroundColor: 'rgba(255, 77, 79, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化工单类型分布图表
const initTicketTypeChart = () => {
  const ctx = document.getElementById('ticketTypeChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['咨询', '缴费', '报修', '投诉（客观）', '投诉（主观）', '测温'],
        datasets: [{
          data: [12, 19, 3, 5, 2, 7],
          backgroundColor: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#ff4d4f',
            '#722ed1',
            '#eb2f96'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化缴费状态分布图表
const initPaymentStatusChart = () => {
  const ctx = document.getElementById('paymentStatusChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['已缴费', '欠费'],
        datasets: [{
          data: [120, 30],
          backgroundColor: ['#52c41a', '#ff4d4f']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化每日缴费统计图表
const initDailyPaymentChart = () => {
  const ctx = document.getElementById('dailyPaymentChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1日', '2日', '3日', '4日', '5日', '6日', '7日'],
        datasets: [{
          label: '缴费金额(元)',
          data: [1200, 1900, 300, 500, 200, 300, 800],
          backgroundColor: '#f5222d'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化缴费方式分布图表
const initPaymentMethodChart = () => {
  const ctx = document.getElementById('paymentMethodChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['现金', '微信支付', '支付宝', '银行卡', '其他'],
        datasets: [{
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#ff4d4f',
            '#722ed1'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
};

// 初始化小区缴费统计图表
const initCommunityPaymentChart = () => {
  const ctx = document.getElementById('communityPaymentChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['小区A', '小区B', '小区C', '小区D'],
        datasets: [{
          label: '缴费金额(元)',
          data: [12000, 19000, 3000, 5000],
          backgroundColor: '#fa8c16'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y'
      }
    });
  }
};

// 初始化缴费金额区间分布图表
const initAmountRangeChart = () => {
  const ctx = document.getElementById('amountRangeChart') as HTMLCanvasElement;
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-500', '500-1000', '1000-1500', '1500-2000', '2000以上'],
        datasets: [{
          label: '缴费户数',
          data: [12, 19, 3, 5, 2],
          backgroundColor: '#722ed1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
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

.stat-info h3 {
  font-size: 20px;
  font-weight: bold;
  margin: 0;
}

.stat-info p {
  margin: 4px 0 0 0;
  color: #666;
}

.card {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: bold;
}

.card-title .icon {
  margin-right: 8px;
}

.chart-container {
  height: 300px;
}
</style>