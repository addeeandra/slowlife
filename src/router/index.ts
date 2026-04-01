import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/journal/:space?/:category?/:item?',
      name: 'journal',
      component: () => import('../views/JournalView.vue'),
    },
    {
      path: '/events',
      name: 'events',
      component: () => import('../views/EventsView.vue'),
    },
    {
      path: '/finances',
      name: 'finances',
      component: () => import('../views/FinancesView.vue'),
    },
    {
      path: '/todos',
      name: 'todos',
      component: () => import('../views/TodosView.vue'),
    },
  ],
})

export default router
