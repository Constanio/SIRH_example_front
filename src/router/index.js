import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Dashboard from '../views/Dashboard.vue';
import Login from '../views/Login.vue';
import Employes from '../views/Employes.vue';
import Conges from '../views/Conges.vue';
import Profil from '../views/Profil.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/employes', 
    name: 'Employes', 
    component: Employes,
    meta: { requiresAuth: true }
  },
  { 
    path: '/conges', 
    name: 'Conges', 
    component: Conges,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profil', 
    name: 'Profil', 
    component: Profil,
    meta: { requiresAuth: true }
  },
  { path: '/', redirect: '/dashboard' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
