import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Expenses from '@/views/Expenses.vue'
import Profits from '@/views/Profits.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: Expenses,
    },
    {
      path: '/profits',
      name: 'profits',
      component: Profits,
    },
  ],
})

export default router
