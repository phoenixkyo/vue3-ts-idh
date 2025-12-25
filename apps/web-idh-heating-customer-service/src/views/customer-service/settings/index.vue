<template>
  <div class="customer-service-settings">
    <!-- 小区设置部分 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:home" />
          <span>小区设置</span>
        </div>
      </template>
      <div class="card-body">
        <div class="setting-section">
          <div class="setting-buttons">
            <div class="setting-buttons-row flex flex-wrap items-center gap-4">
              <div class="setting-buttons-group flex items-center gap-2">
                <span class="community-config mr-2">默认小区：</span>
                <VButton type="accent" prependIcon="fas:home">
                  默认小区设置
                </VButton>
              </div>
              
              <span class="community-config mr-2">小区配置：</span>
              <VSelect
                v-model="settingsForm.communitySelect"
                class="w-40"
                disabled
              >
                <VOption value="">请选择小区</VOption>
                <!-- 小区选项将通过API动态加载 -->
              </VSelect>
              
              <div class="setting-buttons-group flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="community-config">小区零钱：</span>
                  <span id="communityChange" class="uppercase-amount">¥0.00</span>
                  <VButton type="primary" size="small" prependIcon="fas:coins">
                    初始化零钱
                  </VButton>
                </div>
                <div class="flex items-center gap-2">
                  <span class="community-config">小区单价：</span>
                  <span id="communityUnitPrice" class="uppercase-amount">¥5.80</span>
                  <VButton type="success" size="small" prependIcon="fas:dollar-sign">
                    初始化单价
                  </VButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VCard>

    <!-- 客服工单设置部分 -->
    <VCard class="mb-4">
      <template #header>
        <div class="card-title">
          <Icon icon="fas:tasks" />
          <span>客服工单设置</span>
        </div>
      </template>
      <div class="card-body">
        <div class="setting-section">
          <div class="setting-buttons">
            <div class="setting-buttons-row flex flex-wrap gap-4">
              <div class="setting-buttons-group flex flex-wrap gap-2">
                <span class="community-config mr-2">用户信息：</span>
                <VButton type="success" prependIcon="fas:file-import">
                  用户信息导入
                </VButton>
                <VButton type="danger" prependIcon="fas:file-export">
                  用户信息导出
                </VButton>
              </div>
              
              <div class="setting-buttons-group flex flex-wrap gap-2">
                <span class="community-config mr-2">工单：</span>
                <VButton type="success" prependIcon="fas:upload">
                  工单导入
                </VButton>
              </div>
              
              <div class="setting-buttons-group flex flex-wrap gap-2">
                <span class="community-config mr-2">数据备份：</span>
                <VButton type="success" prependIcon="fas:database">
                  数据恢复
                </VButton>
                <VButton type="danger" prependIcon="fas:database">
                  数据备份
                </VButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VCard>

    <!-- 线下缴费设置部分 -->
    <VCard>
      <template #header>
        <div class="card-title">
          <Icon icon="fas:money-bill-wave" />
          <span>线下缴费设置</span>
        </div>
      </template>
      <div class="card-body">
        <div class="setting-section">
          <div class="setting-buttons">
            <VButton type="success" prependIcon="fas:file-import">
              收费记录导入
            </VButton>
          </div>
        </div>
      </div>
    </VCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { VCard, VButton, VSelect } from 'element-plus';
import { Icon } from '@vben/components';

// 设置表单
const settingsForm = reactive({
  communitySelect: ''
});
</script>

<style scoped>
/* 自定义样式 */
.setting-section {
  padding: 20px 0;
}

.setting-buttons-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.setting-buttons-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.community-config {
  font-weight: bold;
  color: #333;
}

.uppercase-amount {
  font-weight: bold;
  font-size: 16px;
  color: #f5222d;
}
</style>