import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'fas:fire',
      keepAlive: true,
      order: 100,
      title: $t('customerService.title'),
    },
    name: 'CustomerService',
    path: '/customer-service',
    children: [
      {
        meta: {
          title: $t('customerService.workorder'),
        },
        name: 'CustomerServiceWorkorder',
        path: '/customer-service/workorder',
        component: () => import('#/views/customer-service/workorder/index.vue'),
      },
      {
        meta: {
          title: $t('customerService.cash'),
        },
        name: 'CustomerServiceCash',
        path: '/customer-service/cash',
        component: () => import('#/views/customer-service/cash/index.vue'),
      },
      {
        meta: {
          title: $t('customerService.analysis'),
        },
        name: 'CustomerServiceAnalysis',
        path: '/customer-service/analysis',
        component: () => import('#/views/customer-service/analysis/index.vue'),
      },
      {
        meta: {
          title: $t('customerService.settings'),
        },
        name: 'CustomerServiceSettings',
        path: '/customer-service/settings',
        component: () => import('#/views/customer-service/settings/index.vue'),
      },
    ],
  },
];

export default routes;