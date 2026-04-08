<script setup>
import { computed, ref, onMounted } from 'vue';
import api from '../services/api';
import { useToastStore } from '../stores/toast';
import { 
  UserPlus, Search, Trash2, Edit, Eye, X, 
  Mail, Briefcase, Building2, ShieldCheck, Filter, ChevronDown, Calendar
} from 'lucide-vue-next';

const toast = useToastStore();
const employes = ref([]);
const departements = ref([]);
const postes = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const roleFilter = ref('tous');
const departementFilter = ref('tous');

// Modaux
const showAddModal = ref(false);
const showDetailsModal = ref(false);
const showEditModal = ref(false);

const selectedEmploye = ref(null);

const newEmploye = ref({
  prenom: '', nom: '', email: '', role: 'employe', password: 'password123',
  departement_id: null, poste_id: null
});

const normalized = (v) => (v ?? '').toString().trim().toLowerCase();

const displayedEmployes = computed(() => {
  const q = normalized(searchQuery.value);
  return employes.value
    .filter((e) => {
      if (roleFilter.value !== 'tous' && e.role !== roleFilter.value) return false;
      if (departementFilter.value !== 'tous' && String(e.departement_id ?? e.departement?.id ?? '') !== String(departementFilter.value)) return false;
      if (!q) return true;
      const hay = [
        e.prenom,
        e.nom,
        e.email,
        e.matricule,
        e.poste?.titre,
        e.departement?.nom,
        e.role,
      ].map(normalized).join(' ');
      return hay.includes(q);
    });
});

const getRoleChipClass = (role) => {
  switch (role) {
    case 'admin': return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800';
    case 'rh': return 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-800';
    case 'manager': return 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-100 dark:border-sky-800';
    default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-400 border-slate-100 dark:border-slate-800';
  }
};

const getStatutChipClass = (statut) => {
  const v = normalized(statut);
  if (v === 'inactif' || v === 'inactive' || v === 'suspendu') return 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800';
  return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
};

const fetchAll = async () => {
  try {
    const [empRes, depRes, posRes] = await Promise.all([
      api.get('/utilisateurs/'),
      api.get('/departements'),
      api.get('/postes')
    ]);
    employes.value = empRes.data;
    departements.value = depRes.data;
    postes.value = posRes.data;
  } catch (err) {
    console.error("Erreur chargement", err);
    toast.error("Impossible de charger les données");
  } finally {
    isLoading.value = false;
  }
};

const addEmploye = async () => {
  try {
    await api.post('/auth/register', newEmploye.value);
    showAddModal.value = false;
    toast.success("Employé créé avec succès");
    fetchAll();
    newEmploye.value = { prenom: '', nom: '', email: '', role: 'employe', password: 'password123', departement_id: null, poste_id: null };
  } catch (err) {
    toast.error("Erreur lors de l'ajout de l'employé");
  }
};

const openDetails = (emp) => {
  selectedEmploye.value = { ...emp };
  showDetailsModal.value = true;
};

const openEdit = (emp) => {
  selectedEmploye.value = { ...emp };
  showEditModal.value = true;
};

const updateEmploye = async () => {
  try {
    const payload = {
        prenom: selectedEmploye.value.prenom,
        nom: selectedEmploye.value.nom,
        email: selectedEmploye.value.email,
        role: selectedEmploye.value.role,
        departement_id: selectedEmploye.value.departement_id,
        poste_id: selectedEmploye.value.poste_id,
        statut: selectedEmploye.value.statut
    };
    await api.put(`/utilisateurs/${selectedEmploye.value.id}`, payload);
    showEditModal.value = false;
    toast.success("Profil mis à jour");
    fetchAll();
  } catch (err) {
    toast.error("Erreur lors de la mise à jour");
  }
};

const deleteEmploye = async (id) => {
  if (confirm("Supprimer cet employé ?")) {
    try {
      await api.delete(`/utilisateurs/${id}`);
      toast.success("Employé supprimé");
      fetchAll();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  }
};

onMounted(fetchAll);
</script>

<template>
  <div class="space-y-10 transition-all duration-500" :class="{ 'blur-md grayscale-[0.5] scale-[0.98] pointer-events-none': showAddModal || showEditModal || showDetailsModal }">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Annuaire des employés</h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium transition-colors">Gérez vos équipes et les accès aux fonctionnalités du SIRH.</p>
      </div>
      <button @click="showAddModal = true" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 group">
        <UserPlus class="w-5 h-5" />
        <span>Ajouter un employé</span>
      </button>
    </div>

    <!-- Table Section -->
    <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors">
      <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div class="relative flex-1 max-w-md group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher: nom, email, poste, matricule…"
            class="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl w-full text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all"
          />
        </div>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative">
            <Filter class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors" />
            <select v-model="departementFilter" class="pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none min-w-[220px]">
              <option value="tous">Tous les départements</option>
              <option v-for="d in departements" :key="d.id" :value="String(d.id)">{{ d.nom }}</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div class="relative">
            <ShieldCheck class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors" />
            <select v-model="roleFilter" class="pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none min-w-[180px]">
              <option value="tous">Tous les rôles</option>
              <option value="employe">Employé</option>
              <option value="manager">Manager</option>
              <option value="rh">RH</option>
              <option value="admin">Administrateur</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div class="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-center transition-colors">
            {{ displayedEmployes.length }} résultat(s)
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.15em] font-black transition-colors">
              <th class="px-8 py-5">Collaborateur</th>
              <th class="px-8 py-5">Département / Poste</th>
              <th class="px-8 py-5">Matricule</th>
              <th class="px-8 py-5">Statut</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
            <tr v-if="isLoading" class="animate-pulse">
                <td colspan="5" class="px-8 py-12 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs transition-colors">Chargement des données...</td>
            </tr>
            <tr v-else-if="displayedEmployes.length === 0">
              <td colspan="5" class="px-8 py-16 text-center">
                <div class="mx-auto max-w-md">
                  <div class="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500 transition-colors">
                    <Search class="w-6 h-6" />
                  </div>
                  <p class="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Aucun employé ne correspond à votre recherche</p>
                  <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 transition-colors">Essayez de modifier les filtres</p>
                </div>
              </td>
            </tr>
            <tr v-for="emp in displayedEmployes" :key="emp.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group">
              <td class="px-8 py-6">
                <div class="flex items-center cursor-pointer" @click="openDetails(emp)">
                  <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-110 transition-all">
                    {{ emp.prenom[0] }}{{ emp.nom[0] }}
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {{ emp.prenom }} {{ emp.nom }}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter transition-colors">{{ emp.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <div class="flex items-center gap-2 mb-2">
                  <span :class="getRoleChipClass(emp.role)" class="px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-colors">
                    {{ emp.role }}
                  </span>
                </div>
                <p class="text-xs font-bold text-slate-400 dark:text-slate-500 transition-colors">{{ emp.departement?.nom || 'Non assigné' }} • {{ emp.poste?.titre || 'Sans poste' }}</p>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-400 dark:text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg transition-colors">{{ emp.matricule }}</span>
              </td>
              <td class="px-8 py-6">
                <span :class="getStatutChipClass(emp.statut)" class="px-3 py-1.5 text-[10px] font-black rounded-xl border uppercase tracking-widest transition-colors">
                  {{ (emp.statut || 'actif') }}
                </span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openDetails(emp)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50" title="Détails">
                    <Eye class="w-5 h-5" />
                  </button>
                  <button @click="openEdit(emp)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="deleteEmploye(emp.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/50 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50" title="Supprimer">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Détails -->
    <Teleport to="body">
      <div v-if="showDetailsModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl transition-all" @click="showDetailsModal = false"></div>
        
        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 transition-colors">
          <button @click="showDetailsModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>

          <div class="flex items-center gap-8 mb-12">
            <div class="w-24 h-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all">
              {{ selectedEmploye.prenom[0] }}{{ selectedEmploye.nom[0] }}
            </div>
            <div>
              <h2 class="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-2 transition-colors">
                  {{ selectedEmploye.prenom }} {{ selectedEmploye.nom }}
              </h2>
              <div class="flex items-center gap-4">
                <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full border border-indigo-100 dark:border-indigo-800 uppercase tracking-widest transition-colors">
                  {{ selectedEmploye.role }}
                </span>
                <span class="text-xs font-black text-slate-300 dark:text-slate-600 font-mono tracking-widest uppercase transition-colors">{{ selectedEmploye.matricule }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-10 text-left">
            <div class="space-y-8">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center transition-colors">
                  <Mail class="w-3 h-3 mr-2" /> Email Professionnel
                </label>
                <p class="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight transition-colors">{{ selectedEmploye.email }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center transition-colors">
                  <Building2 class="w-3 h-3 mr-2" /> Département
                </label>
                <p class="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight transition-colors">{{ selectedEmploye.departement?.nom || 'Non assigné' }}</p>
              </div>
            </div>
            <div class="space-y-8">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center transition-colors">
                  <Briefcase class="w-3 h-3 mr-2" /> Poste actuel
                </label>
                <p class="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight transition-colors">{{ selectedEmploye.poste?.titre || 'Non assigné' }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center transition-colors">
                  <Calendar class="w-3 h-3 mr-2" /> Date d'embauche
                </label>
                <p class="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight transition-colors">12/03/2024</p>
              </div>
            </div>
          </div>

          <div class="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end transition-colors">
            <button @click="openEdit(selectedEmploye); showDetailsModal = false" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all">
              Modifier le profil
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Modification -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl transition-all" @click="showEditModal = false"></div>

        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 transition-colors">
          <div class="flex justify-between items-center mb-10 text-left">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Modifier l'employé</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-widest transition-colors">Édition des informations</p>
            </div>
            <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-6 text-left">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Prénom</label>
                <input v-model="selectedEmploye.prenom" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Nom</label>
                <input v-model="selectedEmploye.nom" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Email professionnel</label>
              <input v-model="selectedEmploye.email" type="email" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Département</label>
                <select v-model="selectedEmploye.departement_id" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Poste</label>
                <select v-model="selectedEmploye.poste_id" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Rôle Système</label>
              <select v-model="selectedEmploye.role" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button @click="showEditModal = false" class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
            <button @click="updateEmploye" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Ajout -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl transition-all" @click="showAddModal = false"></div>

        <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 transition-colors">
          <div class="flex justify-between items-center mb-10 text-left">
            <div>
              <h2 class="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Nouvel Employé</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-widest transition-colors">Création d'accès système</p>
            </div>
            <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-6 text-left">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Prénom</label>
                <input v-model="newEmploye.prenom" placeholder="Prénom" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Nom</label>
                <input v-model="newEmploye.nom" placeholder="Nom" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Email professionnel</label>
              <input v-model="newEmploye.email" type="email" placeholder="email@sirh.com" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-bold text-slate-700 dark:text-slate-200" />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Département</label>
                <select v-model="newEmploye.departement_id" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Poste</label>
                <select v-model="newEmploye.poste_id" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-left block transition-colors">Rôle système</label>
              <select v-model="newEmploye.role" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 appearance-none transition-all">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button @click="showAddModal = false" class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
            <button @click="addEmploye" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Créer l'employé</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.zoom-in {
    animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.animate-in {
    animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
