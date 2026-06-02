import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Dashboard from '../views/Dashboard.vue';
import Login from '../views/Login.vue';
import Employes from '../views/Employes.vue';
import Conges from '../views/Conges.vue';
import Profil from '../views/Profil.vue';
import Paie from '../views/Paie.vue';
import Salaires from '../views/Salaires.vue';
import Evaluations from '../views/Evaluations.vue';
import Organisation from '../views/Organisation.vue';
import TypesConges from '../views/TypesConges.vue';
import DossierRH from '../views/DossierRH.vue';
import Recrutement from '../views/Recrutement.vue';

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
    meta: { requiresAuth: true, roles: ['admin', 'rh', 'manager'] }
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
  { 
    path: '/organisation', 
    name: 'Organisation', 
    component: Organisation,
    meta: { requiresAuth: true, roles: ['admin', 'rh', 'manager'] }
  },
  { 
    path: '/types-conges', 
    name: 'TypesConges', 
    component: TypesConges,
    meta: { requiresAuth: true, roles: ['admin', 'rh'] }
  },
  { 
    path: '/salaires', 
    name: 'Salaires', 
    component: Salaires,
    meta: { requiresAuth: true, roles: ['admin', 'rh'] }
  },
  { 
    path: '/paie', 
    name: 'Paie', 
    component: Paie,
    meta: { requiresAuth: true, roles: ['admin', 'rh'] }
  },
  { 
    path: '/evaluations', 
    name: 'Evaluations', 
    component: Evaluations,
    meta: { requiresAuth: true, roles: ['admin', 'rh', 'manager'] }
  },
  {
    path: '/dossier-rh/:id',
    name: 'DossierRH',
    component: DossierRH,
    meta: { requiresAuth: true, roles: ['admin', 'rh', 'manager'] }
  },
  {
    path: '/recrutement',
    name: 'Recrutement',
    component: Recrutement,
    meta: { requiresAuth: true, roles: ['admin', 'rh', 'manager'] }
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
    return;
  }

  if (to.meta.roles && auth.isAuthenticated) {
    const userRole = auth.user?.role;
    if (!to.meta.roles.includes(userRole)) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
