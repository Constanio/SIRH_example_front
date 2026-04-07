<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { 
  Users, Calendar, FileText, TrendingUp, 
  ArrowUpRight, Clock, CheckCircle2, XCircle,
  MoreHorizontal, ChevronRight
} from 'lucide-vue-next';
import api from '../services/api';

const auth = useAuthStore();
const isLoading = ref(true);
const stats = ref([
  { name: 'Total Employés', value: '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2 ce mois' },
  { name: 'Congés à valider', value: '3', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Priorité' },
  { name: 'Fiches de paie', value: '42', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Générées' },
  { name: 'Score Global', value: '84%', icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50', trend: '+4.2%' },
]);

const recentLeaves = ref([
  { id: 1, name: 'Jean Dupont', type: 'Congés Payés', date: '04-06 Avr', status: 'en_attente' },
  { id: 2, name: 'Marie Curie', type: 'RTT', date: '12 Avr', status: 'approuve' },
  { id: 3, name: 'Alan Turing', type: 'Maladie', date: '03-05 Avr', status: 'refuse' },
]);

const fetchStats = async () => {
  try {
    const res = await api.get('/utilisateurs/');
    stats.value[0].value = res.data.length.toString();
  } catch (error) {
    console.error("Erreur stats:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchStats);

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
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
        <p class="text-slate-500 font-medium">Content de vous revoir, <span class="text-indigo-600 font-bold">{{ auth.user?.prenom }}</span> 👋</p>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
          Exporter les données
        </button>
        <button class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 group">
          <span>Nouvelle Action</span>
          <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div v-for="stat in stats" :key="stat.name" 
        class="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-500 group relative overflow-hidden cursor-pointer">
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
            <h2 class="text-4xl font-black text-slate-900 tracking-tighter">{{ stat.value }}</h2>
            <span class="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{{ stat.trend }}</span>
          </div>
        </div>
        <!-- Decorative background element -->
        <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
      </div>
    </div>

    <!-- Main Section -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-10">
      <!-- Requests Table -->
      <div class="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div class="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-black text-slate-900 tracking-tight">Demandes récentes</h3>
            <p class="text-xs text-slate-400 font-bold uppercase mt-1">Flux d'activité en temps réel</p>
          </div>
          <button class="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <MoreHorizontal class="w-6 h-6 text-slate-400" />
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
              <tr v-for="leave in recentLeaves" :key="leave.id" class="hover:bg-slate-50/30 transition-all group">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                      {{ leave.name.split(' ').map(n => n[0]).join('') }}
                    </div>
                    <span class="text-sm font-bold text-slate-800">{{ leave.name }}</span>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <span class="text-sm font-bold text-slate-500">{{ leave.type }}</span>
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
                   <button class="text-indigo-600 font-bold text-xs hover:underline decoration-2 underline-offset-4">Détails</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="space-y-10">
        <!-- Upgrade Card -->
        <div class="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-100">
          <div class="relative z-10">
            <div class="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <TrendingUp class="w-8 h-8 text-white" />
            </div>
            <h4 class="text-2xl font-black mb-4 tracking-tight leading-tight">Optimisez votre gestion RH</h4>
            <p class="text-indigo-100/80 text-sm font-medium leading-relaxed mb-8">Découvrez les outils d'analyse prédictive pour anticiper les besoins de vos équipes.</p>
            <button class="w-full py-4 bg-white text-indigo-600 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all shadow-xl">
              Explorer les Modules
            </button>
          </div>
          <!-- Decorative circle -->
          <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        </div>

        <!-- Upcoming Events -->
        <div class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <h4 class="font-black text-slate-900 tracking-tight text-lg">Prochains rendez-vous</h4>
            <span class="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-xs font-bold">2</span>
          </div>
          <div class="space-y-6">
            <div class="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-all cursor-pointer group border border-transparent hover:border-slate-100">
              <div class="w-14 h-14 bg-rose-50 rounded-2xl flex flex-col items-center justify-center text-rose-500 border border-rose-100 group-hover:scale-105 transition-transform">
                <span class="text-xs font-black leading-none">06</span>
                <span class="text-[8px] font-black uppercase tracking-tighter">AVR</span>
              </div>
              <div>
                <p class="text-sm font-black text-slate-800">Réunion Trimestrielle</p>
                <p class="text-[11px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  14:30 · Salle Galaxie
                </p>
              </div>
            </div>
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
