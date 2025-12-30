import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ion:settings-outline',
      order: 9997,
      title: $t('system.title'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        path: '/system/user',
        name: 'SystemUser',
        meta: {
          icon: 'mdi:account',
          title: $t('system.user.title'),
        },
        component: () => import('#/views/system/user/list.vue'),
      },
      {
        path: '/system/role',
        name: 'SystemRole',
        meta: {
          icon: 'mdi:account-group',
          title: $t('system.role.title'),
        },
        component: () => import('#/views/system/role/list.vue'),
      },
      {
        path: '/system/menu',
        name: 'SystemMenu',
        meta: {
          icon: 'mdi:menu',
          title: $t('system.menu.title'),
        },
        component: () => import('#/views/system/menu/list.vue'),
      },
      {
        path: '/system/dept',
        name: 'SystemDept',
        meta: {
          icon: 'charm:organisation',
          title: $t('system.dept.title'),
        },
        component: () => import('#/views/system/dept/list.vue'),
      },
      {
        path: '/system/post',
        name: 'SystemPost',
        meta: {
          icon: 'mdi:briefcase',
          title: $t('system.post.title'),
        },
        component: () => import('#/views/system/post/list.vue'),
      },
      {
        path: '/system/dict',
        name: 'SystemDict',
        meta: {
          icon: 'mdi:book',
          title: $t('system.dict.title'),
        },
        component: () => import('#/views/system/dict/list.vue'),
      },
      {
        path: '/system/log',
        name: 'SystemLog',
        meta: {
          icon: 'mdi:book-open-blank-variant',
          title: $t('system.log.title'),
        },
        component: () => import('#/views/system/log/list.vue'),
      },
    ],
  },
];

export default routes;
