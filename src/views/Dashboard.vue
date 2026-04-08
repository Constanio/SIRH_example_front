<script setup>
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { 
  Users, Calendar, Building2, Briefcase, 
  Clock,
  MoreHorizontal, ChevronRight, ArrowRight
} from 'lucide-vue-next';
import api from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const auth = useAuthStore();
const router = useRouter();
const isLoading = ref(true);
const isLeavesLoading = ref(true);
const now = new Date();
const stats = ref([
  { key: 'utilisateur_count', name: 'Employés', value: '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', hint: 'Annuaire' },
  { key: 'demandes_en_attente', name: 'Congés en attente', value: '0', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', hint: 'À valider' },
  { key: 'departement_count', name: 'Départements', value: '0', icon: Building2, color: 'text-emerald-700', bg: 'bg-emerald-50', hint: 'Organisation' },
  { key: 'poste_count', name: 'Postes', value: '0', icon: Briefcase, color: 'text-rose-700', bg: 'bg-rose-50', hint: 'Organisation' },
]);

const isManager = computed(() => ['admin', 'rh', 'manager'].includes(auth.user?.role));
const recentLeaves = ref([]);

const greeting = computed(() => {
  const hour = now.getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
});

const formatShortRange = (start, end) => {
  if (!start || !end) return '-';
  const s = format(new Date(start), 'dd MMM', { locale: fr });
  const e = format(new Date(end), 'dd MMM', { locale: fr });
  return s === e ? s : `${s} → ${e}`;
};

const fetchDashboard = async () => {
  try {
    const res = await api.get('/dashboard/stats');
    const data = res.data || {};
    stats.value = stats.value.map((s) => ({
      ...s,
      value: String(data?.[s.key] ?? '0'),
    }));
  } catch (error) {
    console.error("Erreur stats:", error);
  } finally {
    isLoading.value = false;
  }
};

const fetchRecentLeaves = async () => {
  isLeavesLoading.value = true;
  try {
    const res = await api.get(isManager.value ? '/conges/toutes-les-demandes' : '/conges/mes-demandes');
    const list = Array.isArray(res.data) ? res.data : [];
    recentLeaves.value = list
      .slice()
      .sort((a, b) => new Date(b.created_at || b.date_debut) - new Date(a.created_at || a.date_debut))
      .slice(0, 6)
      .map((d) => ({
        id: d.id,
        name: d.utilisateur ? `${d.utilisateur?.prenom ?? ''} ${d.utilisateur?.nom ?? ''}`.trim() : `${auth.user?.prenom ?? ''} ${auth.user?.nom ?? ''}`.trim(),
        type: d.type_conge?.nom || '-',
        date: formatShortRange(d.date_debut, d.date_fin),
        status: d.statut || 'en_attente',
      }));
  } catch (error) {
    // si l'utilisateur n'a pas les droits (ex: /toutes-les-demandes), on reste silencieux
    console.error("Erreur demandes récentes:", error);
    recentLeaves.value = [];
  } finally {
    isLeavesLoading.value = false;
  }
};

onMounted(async () => {
  await fetchDashboard();
  await fetchRecentLeaves();
});

const getStatusClass = (status) => {
  switch (status) {
    case 'en_attente': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'approuve': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'refuse': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-600';
  }
};
</script>

<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="relative overflow-hidden rounded-[2.75rem] border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-white via-white to-indigo-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-500/10 p-10 shadow-sm">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>
      </div>

      <div class="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vue d’ensemble</p>
          <h1 class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Tableau de bord</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium">
            {{ greeting }}, <span class="text-indigo-600 font-bold">{{ auth.user?.prenom }}</span>. Voici vos indicateurs clés du jour.
          </p>
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            @click="router.push('/employes')"
            class="px-6 py-3 bg-white/70 backdrop-blur border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-white hover:border-slate-300 transition-all shadow-sm"
          >
            Voir les employés
          </button>
          <button
            @click="router.push('/conges')"
            class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Gérer les congés</span>
            <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.name" 
        class="bg-white dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-50/60 transition-all duration-500 group relative overflow-hidden cursor-pointer">
        <div class="relative z-10">
          <div class="flex justify-between items-start mb-6">
            <div :class="`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`">
              <component :is="stat.icon" class="w-7 h-7" />
            </div>
            <div class="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <MoreHorizontal class="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <p class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{{ stat.name }}</p>
          <div class="flex items-baseline gap-2">
            <div class="min-h-[2.5rem] flex items-end gap-2">
              <div v-if="isLoading" class="h-9 w-20 bg-slate-100 rounded-xl animate-pulse"></div>
              <h2 v-else class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{{ stat.value }}</h2>
              <span class="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">{{ stat.hint }}</span>
            </div>
          </div>
        </div>
        <!-- Decorative background element -->
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
      </div>
    </div>

    <!-- Main Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-10">
      <!-- Requests Table -->
      <div class="xl:col-span-2 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Demandes récentes</h3>
            <p class="text-xs text-slate-400 font-bold uppercase mt-1">
              {{ isManager ? "Dernières demandes (équipe)" : "Vos dernières demandes" }}
            </p>
          </div>
          <button @click="router.push('/conges')" class="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all flex items-center gap-2">
            Voir tout <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <div class="flex-1 overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
                <th class="px-8 py-5">Collaborateur</th>
                <th class="px-8 py-5">Motif / Type</th>
                <th class="px-8 py-5">Période</th>
                <th class="px-8 py-5">Statut</th>
                <th class="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr v-if="isLeavesLoading">
                <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement des demandes…</td>
              </tr>
              <tr v-else-if="recentLeaves.length === 0">
                <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune demande récente</td>
              </tr>
              <tr v-else v-for="leave in recentLeaves" :key="leave.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-900/40 transition-all group">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                      {{ leave.name.split(' ').map(n => n[0]).join('') }}
                    </div>
                    <span class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ leave.name }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span class="text-sm font-bold text-slate-500 dark:text-slate-300">{{ leave.type }}</span>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center text-sm text-slate-400 font-medium">
                    <Clock class="w-4 h-4 mr-2 opacity-50" />
                    {{ leave.date }}
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span :class="`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${getStatusClass(leave.status)}`">
                    {{ leave.status.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-8 py-6 text-right">
                   <button @click="router.push('/conges')" class="inline-flex items-center gap-2 text-indigo-600 font-bold text-xs hover:underline decoration-2 underline-offset-4">
                     Ouvrir <ArrowRight class="w-4 h-4" />
                   </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-10">
        <div class="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h4 class="font-black text-slate-900 dark:text-slate-100 tracking-tight text-lg">Accès rapide</h4>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Modules</span>
          </div>
          <div class="space-y-3">
            <button @click="router.push('/employes')" class="w-full text-left p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-500/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-all">
              <div class="text-sm font-black text-slate-900 dark:text-slate-100">Employés</div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Annuaire & rôles</div>
            </button>
            <button @click="router.push('/conges')" class="w-full text-left p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-amber-100 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 transition-all">
              <div class="text-sm font-black text-slate-900 dark:text-slate-100">Congés</div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Demandes & validation</div>
            </button>
            <button @click="router.push('/organisation')" class="w-full text-left p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-500/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10 transition-all">
              <div class="text-sm font-black text-slate-900 dark:text-slate-100">Organisation</div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Départements & postes</div>
            </button>
            <button v-if="isManager" @click="router.push('/evaluations')" class="w-full text-left p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 hover:border-sky-100 dark:hover:border-sky-500/30 hover:bg-sky-50/30 dark:hover:bg-sky-500/10 transition-all">
              <div class="text-sm font-black text-slate-900 dark:text-slate-100">Évaluations</div>
              <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Performance</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Specific animations for this view */
.animate-in {
  animation-fill-mode: both;
}
</style>
