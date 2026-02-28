import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

import { useAuthStore } from '@/stores/AuthStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/pages/auth/Login.vue'),
    },
    {
      path: '/dashboard-layout',
      component: AppLayout,
      children: [
        {
          path: '/dashboard',
          redirect: '/cases',
        },
        {
          path: '/cases',
          name: 'cases',
          component: () => import('@/views/Dashboard.vue'), // Acting as Cases page
        },
        {
          path: '/cases/:id/collections',
          name: 'collections',
          component: () => import('@/views/CollectionsPage.vue'),
        },
        {
          path: '/collections/:id/files',
          name: 'files',
          component: () => import('@/views/FilesPage.vue'),
        },

        {
          path: '/pages/empty',
          name: 'empty',
          component: () => import('@/views/pages/Empty.vue'),
        },
      ],
    },
    {
      path: '/pages/notfound',
      name: 'notfound',
      component: () => import('@/views/pages/NotFound.vue'),
    },

    {
      path: '/auth/login',
      redirect: '/',
    },
    {
      path: '/auth/access',
      name: 'accessDenied',
      component: () => import('@/views/pages/auth/Access.vue'),
    },
    {
      path: '/auth/error',
      name: 'error',
      component: () => import('@/views/pages/auth/Error.vue'),
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const publicPages = [
    '/',
    '/auth/login',
    '/landing',
    '/pages/notfound',
    '/auth/access',
    '/auth/error',
  ];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !authStore.isAuthenticated) {
    return next('/auth/access');
  }

  next();
});

export default router;
