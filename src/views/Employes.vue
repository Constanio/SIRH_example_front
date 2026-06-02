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

const addLoading = ref(false);
const updateLoading = ref(false);

const addErrors = ref({prenom: '', nom: '', email: ''});
const editErrors = ref({prenom: '', nom: '', email: ''});

const validateAddField = (field) => {
  if (field === 'email' && newEmploye.value.email && (!newEmploye.value.email.includes('@') || !newEmploye.value.email.includes('.'))) 
    { addErrors.value.email = 'Email invalide'; return; }
  if (field === 'prenom' && !newEmploye.value.prenom.trim()) 
    { addErrors.value.prenom = 'Requis'; return; }
  if (field === 'nom' && !newEmploye.value.nom.trim()) 
    { addErrors.value.nom = 'Requis'; return; }
  addErrors.value[field] = '';
};
const clearAddError = (field) => { addErrors.value[field] = ''; };

const validateEditField = (field) => {
  if (field === 'email' && selectedEmploye.value.email && (!selectedEmploye.value.email.includes('@') || !selectedEmploye.value.email.includes('.'))) 
    { editErrors.value.email = 'Email invalide'; return; }
  if (field === 'prenom' && !selectedEmploye.value.prenom.trim()) 
    { editErrors.value.prenom = 'Requis'; return; }
  if (field === 'nom' && !selectedEmploye.value.nom.trim()) 
    { editErrors.value.nom = 'Requis'; return; }
  editErrors.value[field] = '';
};
const clearEditError = (field) => { editErrors.value[field] = ''; };

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
  addLoading.value = true;
  try {
    await api.post('/auth/register', newEmploye.value);
    showAddModal.value = false;
    toast.success("Employé créé avec succès");
    fetchAll();
    newEmploye.value = { prenom: '', nom: '', email: '', role: 'employe', password: 'password123', departement_id: null, poste_id: null };
  } catch (err) {
    toast.error("Erreur lors de l'ajout de l'employé");
  } finally {
    addLoading.value = false;
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
  updateLoading.value = true;
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
  } finally {
    updateLoading.value = false;
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
          <div class="relative cursor-pointer">
            <Filter class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors" />
            <select v-model="departementFilter" class="pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none min-w-[220px]">
              <option value="tous">Tous les départements</option>
              <option v-for="d in departements" :key="d.id" :value="String(d.id)">{{ d.nom }}</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <div class="relative cursor-pointer">
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
      <Transition name="modal-fade">
      <div v-if="showDetailsModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showDetailsModal = false"></div>
        
        <div class="relative w-full max-w-2xl">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
          <button @click="showDetailsModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="flex items-center gap-8 mb-12">
            <div class="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-500/25 transition-all">
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

          <div class="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 transition-colors">
            <button @click="openEdit(selectedEmploye); showDetailsModal = false" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Modifier le profil
            </button>
          </div>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>

    <!-- Modal Modification -->
    <Teleport to="body">
      <Transition name="modal-fade">
      <div v-if="showEditModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showEditModal = false"></div>
        
        <div class="relative w-full max-w-lg">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
          <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Modifier l'employé</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Édition des informations</p>
              </div>
            </div>
            <button @click="showEditModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div class="p-8 space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Prénom
                </label>
                <input v-model.trim="selectedEmploye.prenom" maxlength="100" @blur="validateEditField('prenom')" @focus="clearEditError('prenom')" :class="{'border-red-400': editErrors.prenom}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                <p v-if="editErrors.prenom" class="text-red-500 text-xs mt-1 font-bold">{{ editErrors.prenom }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Nom
                </label>
                <input v-model.trim="selectedEmploye.nom" maxlength="100" @blur="validateEditField('nom')" @focus="clearEditError('nom')" :class="{'border-red-400': editErrors.nom}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                <p v-if="editErrors.nom" class="text-red-500 text-xs mt-1 font-bold">{{ editErrors.nom }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Email professionnel
              </label>
              <input v-model="selectedEmploye.email" type="email" maxlength="255" @blur="validateEditField('email')" @focus="clearEditError('email')" :class="{'border-red-400': editErrors.email}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
              <p v-if="editErrors.email" class="text-red-500 text-xs mt-1 font-bold">{{ editErrors.email }}</p>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Département
                </label>
                <select v-model="selectedEmploye.departement_id" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Poste
                </label>
                <select v-model="selectedEmploye.poste_id" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Rôle Système
              </label>
              <select v-model="selectedEmploye.role" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 px-8 pb-8">
            <button @click="showEditModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              Annuler
            </button>
            <button @click="updateEmploye" :disabled="updateLoading" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg">
              <span v-if="updateLoading" class="flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Enregistrement...
              </span>
              <span v-else class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                Enregistrer
              </span>
            </button>
          </div>
          </div>
        </div>
      </div>
      </Transition>
    </Teleport>

    <!-- Modal Ajout -->
    <Teleport to="body">
      <Transition name="modal-fade">
      <div v-if="showAddModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showAddModal = false"></div>
        
        <div class="relative w-full max-w-lg">
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
          <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              </div>
              <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nouvel Employé</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Création d'accès système</p>
              </div>
            </div>
            <button @click="showAddModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div class="p-8 space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Prénom
                </label>
                <input v-model.trim="newEmploye.prenom" placeholder="Prénom" maxlength="100" @blur="validateAddField('prenom')" @focus="clearAddError('prenom')" :class="{'border-red-400': addErrors.prenom}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                <p v-if="addErrors.prenom" class="text-red-500 text-xs mt-1 font-bold">{{ addErrors.prenom }}</p>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  Nom
                </label>
                <input v-model.trim="newEmploye.nom" placeholder="Nom" maxlength="100" @blur="validateAddField('nom')" @focus="clearAddError('nom')" :class="{'border-red-400': addErrors.nom}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                <p v-if="addErrors.nom" class="text-red-500 text-xs mt-1 font-bold">{{ addErrors.nom }}</p>
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                Email professionnel
              </label>
              <input v-model="newEmploye.email" type="email" placeholder="email@sirh.com" maxlength="255" @blur="validateAddField('email')" @focus="clearAddError('email')" :class="{'border-red-400': addErrors.email}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
              <p v-if="addErrors.email" class="text-red-500 text-xs mt-1 font-bold">{{ addErrors.email }}</p>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  Département
                </label>
                <select v-model="newEmploye.departement_id" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Poste
                </label>
                <select v-model="newEmploye.poste_id" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                Rôle système
              </label>
              <select v-model="newEmploye.role" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 appearance-none transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button @click="showAddModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Annuler
              </button>
              <button @click="addEmploye" :disabled="addLoading" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg">
                <span v-if="addLoading" class="flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Enregistrement...
                </span>
                <span v-else class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  Créer l'employé
                </span>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
      </Transition>
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

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
.zoom-in-95 {
    animation: zoomIn 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-in-from-bottom-4 {
    animation: slideIn 0.3s ease-out;
}
@keyframes zoomIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
@keyframes slideIn {
    from { opacity: 0; transform: translateY(1rem); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
