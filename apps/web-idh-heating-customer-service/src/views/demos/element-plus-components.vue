<script lang="ts" setup>
import { ref } from 'vue';

import {
  // 其他组件
  ElAffix,
  ElAlert,
  ElAnchor,
  ElAside,
  ElAutocomplete,
  ElAvatar,
  ElBacktop,
  ElBadge,
  ElBreadcrumb,
  // 基础组件
  ElButton,
  ElCalendar,
  ElCard,
  ElCarousel,
  ElCascader,
  ElCheckbox,
  ElCheckboxGroup,
  ElCol,
  ElCollapse,
  ElCollapseTransition,
  ElColorPicker,
  ElConfigProvider,
  // 布局组件
  ElContainer,
  ElDatePicker,
  ElDescriptions,
  // 反馈组件
  ElDialog,
  ElDivider,
  ElDrawer,
  ElDropdown,
  ElEmpty,
  ElFooter,
  ElHeader,
  ElIcon,
  ElImage,
  ElImageViewer,
  // 表单组件
  ElInput,
  ElInputNumber,
  ElLink,
  ElLoading,
  ElMain,
  // 导航组件
  ElMenu,
  ElMessage,
  ElMessageBox,
  ElNotification,
  ElPageHeader,
  ElPagination,
  ElPopconfirm,
  ElPopover,
  ElProgress,
  ElRadio,
  ElRadioGroup,
  ElRate,
  ElResult,
  ElRow,
  ElScrollbar,
  ElSelect,
  ElSelectV2,
  ElSkeleton,
  ElSlider,
  ElSpace,
  ElSplitter,
  ElStatistic,
  ElSteps,
  ElSwitch,
  // 数据组件
  ElTable,
  ElTabPane,
  ElTabs,
  ElTag,
  ElTimeline,
  ElTimePicker,
  ElTooltip,
  ElTransfer,
  ElTree,
  ElTreeSelect,
  ElUpload,
} from 'element-plus';

const activeTab = ref('basic');

const componentGroups = [
  { label: '基础组件', value: 'basic' },
  { label: '表单组件', value: 'form' },
  { label: '数据组件', value: 'data' },
  { label: '布局组件', value: 'layout' },
  { label: '导航组件', value: 'nav' },
  { label: '反馈组件', value: 'feedback' },
  { label: '其他组件', value: 'other' },
];

const basicComponents = [
  {
    name: 'Button',
    component: ElButton,
    description: '按钮组件，用于触发操作',
  },
  { name: 'Icon', component: ElIcon, description: '图标组件，提供丰富的图标' },
  { name: 'Link', component: ElLink, description: '链接组件，用于页面跳转' },
  { name: 'Space', component: ElSpace, description: '间距组件，控制元素间距' },
  { name: 'Divider', component: ElDivider, description: '分隔线组件' },
  {
    name: 'ColorPicker',
    component: ElColorPicker,
    description: '颜色选择器组件',
  },
  { name: 'Scrollbar', component: ElScrollbar, description: '滚动条组件' },
  { name: 'Splitter', component: ElSplitter, description: '分隔面板组件' },
];

const formComponents = [
  { name: 'Input', component: ElInput, description: '输入框组件' },
  {
    name: 'Select',
    component: ElSelect,
    description: '选择器组件',
    props: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
      ],
    },
  },
  {
    name: 'SelectV2',
    component: ElSelectV2,
    description: '选择器V2组件',
    props: {
      options: [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
      ],
    },
  },
  { name: 'Checkbox', component: ElCheckbox, description: '复选框组件' },
  {
    name: 'CheckboxGroup',
    component: ElCheckboxGroup,
    description: '复选框组组件',
  },
  { name: 'Radio', component: ElRadio, description: '单选框组件' },
  { name: 'RadioGroup', component: ElRadioGroup, description: '单选框组组件' },
  { name: 'Switch', component: ElSwitch, description: '开关组件' },
  { name: 'Slider', component: ElSlider, description: '滑块组件' },
  { name: 'Rate', component: ElRate, description: '评分组件' },
  {
    name: 'TimePicker',
    component: ElTimePicker,
    description: '时间选择器组件',
  },
  {
    name: 'DatePicker',
    component: ElDatePicker,
    description: '日期选择器组件',
  },
  { name: 'Upload', component: ElUpload, description: '上传组件' },
  { name: 'Cascader', component: ElCascader, description: '级联选择器组件' },
  {
    name: 'Autocomplete',
    component: ElAutocomplete,
    description: '自动补全输入框组件',
  },
  {
    name: 'InputNumber',
    component: ElInputNumber,
    description: '数字输入框组件',
  },
  {
    name: 'TreeSelect',
    component: ElTreeSelect,
    description: '树形选择器组件',
  },
];

const dataComponents = [
  { name: 'Table', component: ElTable, description: '表格组件' },
  { name: 'Tree', component: ElTree, description: '树形组件' },
  { name: 'Pagination', component: ElPagination, description: '分页组件' },
  { name: 'Card', component: ElCard, description: '卡片组件' },
  { name: 'Carousel', component: ElCarousel, description: '轮播组件' },
  { name: 'Timeline', component: ElTimeline, description: '时间线组件' },
  { name: 'Tag', component: ElTag, description: '标签组件' },
  { name: 'Avatar', component: ElAvatar, description: '头像组件' },
  { name: 'Badge', component: ElBadge, description: '徽章组件' },
  {
    name: 'Descriptions',
    component: ElDescriptions,
    description: '描述列表组件',
  },
  { name: 'Progress', component: ElProgress, description: '进度条组件' },
  { name: 'Statistic', component: ElStatistic, description: '统计数值组件' },
  { name: 'Calendar', component: ElCalendar, description: '日历组件' },
];

const layoutComponents = [
  { name: 'Container', component: ElContainer, description: '布局容器组件' },
  { name: 'Header', component: ElHeader, description: '头部组件' },
  { name: 'Aside', component: ElAside, description: '侧边栏组件' },
  { name: 'Main', component: ElMain, description: '主内容组件' },
  { name: 'Footer', component: ElFooter, description: '底部组件' },
  { name: 'Row', component: ElRow, description: '行组件' },
  { name: 'Col', component: ElCol, description: '列组件' },
];

const navComponents = [
  { name: 'Menu', component: ElMenu, description: '菜单组件' },
  { name: 'Tabs', component: ElTabs, description: '标签页组件' },
  { name: 'Breadcrumb', component: ElBreadcrumb, description: '面包屑组件' },
  { name: 'Steps', component: ElSteps, description: '步骤条组件' },
  { name: 'Dropdown', component: ElDropdown, description: '下拉菜单组件' },
  { name: 'PageHeader', component: ElPageHeader, description: '页头组件' },
  { name: 'Anchor', component: ElAnchor, description: '锚点组件' },
];

const feedbackComponents = [
  { name: 'Alert', component: ElAlert, description: '警告组件' },
  { name: 'Dialog', component: ElDialog, description: '对话框组件' },
  { name: 'Drawer', component: ElDrawer, description: '抽屉组件' },
  { name: 'Message', component: ElMessage, description: '消息提示组件' },
  { name: 'MessageBox', component: ElMessageBox, description: '弹框组件' },
  { name: 'Notification', component: ElNotification, description: '通知组件' },
  { name: 'Loading', component: ElLoading, description: '加载组件' },
  { name: 'Popover', component: ElPopover, description: '气泡卡片组件' },
  { name: 'Popconfirm', component: ElPopconfirm, description: '确认弹窗组件' },
  { name: 'Tooltip', component: ElTooltip, description: '文字提示组件' },
  { name: 'Result', component: ElResult, description: '结果组件' },
  { name: 'Skeleton', component: ElSkeleton, description: '骨架屏组件' },
];

const otherComponents = [
  { name: 'Affix', component: ElAffix, description: '固钉组件' },
  { name: 'Backtop', component: ElBacktop, description: '回到顶部组件' },
  { name: 'InfiniteScroll', description: '无限滚动指令' },
  { name: 'Empty', component: ElEmpty, description: '空状态组件' },
  { name: 'Image', component: ElImage, description: '图片组件' },
  {
    name: 'ImageViewer',
    component: ElImageViewer,
    description: '图片查看器组件',
  },
  { name: 'Collapse', component: ElCollapse, description: '折叠面板组件' },
  {
    name: 'CollapseTransition',
    component: ElCollapseTransition,
    description: '折叠过渡组件',
  },
  { name: 'Transfer', component: ElTransfer, description: '穿梭框组件' },
  {
    name: 'ConfigProvider',
    component: ElConfigProvider,
    description: '全局配置组件',
  },
];

// 配置组件
const configComponents = [
  {
    name: 'ConfigProvider',
    component: ElConfigProvider,
    description: '全局配置组件',
  },
];

// 将配置组件添加到分组中
componentGroups.push({ label: '配置组件', value: 'config' });

// 创建组件映射，用于根据分组值获取组件数组
const getComponents = (groupValue: string) => {
  switch (groupValue) {
    case 'basic': {
      return basicComponents;
    }
    case 'config': {
      return configComponents;
    }
    case 'data': {
      return dataComponents;
    }
    case 'feedback': {
      return feedbackComponents;
    }
    case 'form': {
      return formComponents;
    }
    case 'layout': {
      return layoutComponents;
    }
    case 'nav': {
      return navComponents;
    }
    case 'other': {
      return otherComponents;
    }
    default: {
      return [];
    }
  }
};
</script>

<template>
  <div class="element-plus-components-container">
    <h1 class="page-title">Element Plus 组件大全</h1>

    <ElTabs v-model="activeTab" class="component-tabs">
      <ElTabPane
        v-for="group in componentGroups"
        :key="group.value"
        :label="group.label"
        :name="group.value"
      >
        <div class="component-grid">
          <ElCard
            v-for="component in getComponents(group.value)"
            :key="component.name"
            class="component-card"
            shadow="hover"
          >
            <template #header>
              <div class="component-header">
                <h3 class="component-name">{{ component.name }}</h3>
              </div>
            </template>
            <div class="component-content">
              <div class="component-demo">
                <component
                  v-if="component.component"
                  :is="component.component"
                  v-bind="(component as any).props || {}"
                />
                <div v-else class="component-placeholder">
                  {{ component.name }} 组件
                </div>
              </div>
              <div class="component-description">
                {{ component.description }}
              </div>
            </div>
          </ElCard>
        </div>
      </ElTabPane>
    </ElTabs>
  </div>
</template>

<style scoped>
.element-plus-components-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.component-card {
  height: 100%;
}

.component-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.component-name {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.component-content {
  padding: 10px 0;
}

.component-demo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  margin-bottom: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.component-placeholder {
  font-size: 16px;
  color: #909399;
}

.component-description {
  font-size: 14px;
  color: #606266;
}
</style>
