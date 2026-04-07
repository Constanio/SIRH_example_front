<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useToastStore } from '../stores/toast';
import { 
  UserPlus, Search, Trash2, Edit, Eye, X, 
  Mail, Briefcase, Building2, ShieldCheck, Hash, Calendar, User,
  MoreHorizontal, ChevronRight, CheckCircle2
} from 'lucide-vue-next';

const toast = useToastStore();
const employes = ref([]);
const departements = ref([]);
const postes = ref([]);
const isLoading = ref(true);

// Modaux
const showAddModal = ref(false);
const showDetailsModal = ref(false);
const showEditModal = ref(false);

const selectedEmploye = ref(null);

const newEmploye = ref({
  prenom: '', nom: '', email: '', role: 'employe', password: 'password123',
  departement_id: null, poste_id: null
});

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
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Annuaire des employés</h1>
        <p class="text-slate-500 font-medium">Gérez vos équipes et les accès aux fonctionnalités du SIRH.</p>
      </div>
      <button @click="showAddModal = true" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 group">
        <UserPlus class="w-5 h-5" />
        <span>Ajouter un employé</span>
      </button>
    </div>

    <!-- Table Section -->
    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      <div class="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input type="text" placeholder="Rechercher par nom, email, poste..." class="pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full text-sm font-bold text-slate-700 outline-none transition-all" />
        </div>
        <div class="flex items-center gap-2">
            <button class="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
                <Building2 class="w-5 h-5" />
            </button>
            <button class="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
                <ShieldCheck class="w-5 h-5" />
            </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Collaborateur</th>
              <th class="px-8 py-5">Département / Poste</th>
              <th class="px-8 py-5">Matricule</th>
              <th class="px-8 py-5">Statut</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="isLoading" class="animate-pulse">
                <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement des données...</td>
            </tr>
            <tr v-for="emp in employes" :key="emp.id" class="hover:bg-slate-50/30 transition-all group">
              <td class="px-8 py-6">
                <div class="flex items-center cursor-pointer" @click="openDetails(emp)">
                  <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                    {{ emp.prenom[0] }}{{ emp.nom[0] }}
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-black text-slate-900 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                        {{ emp.prenom }} {{ emp.nom }}
                    </p>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ emp.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-8 py-6">
                <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">{{ emp.role }}</p>
                <p class="text-xs font-bold text-slate-400">{{ emp.departement?.nom || 'Non assigné' }} • {{ emp.poste?.titre || 'Sans poste' }}</p>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg">{{ emp.matricule }}</span>
              </td>
              <td class="px-8 py-6">
                <span class="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">Actif</span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openDetails(emp)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Détails">
                    <Eye class="w-5 h-5" />
                  </button>
                  <button @click="openEdit(emp)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="deleteEmploye(emp.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
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
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" @click="showDetailsModal = false"></div>
        
        <div class="bg-white rounded-[2.5rem] p-10 max-w-2xl w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in zoom-in duration-300">
          <button @click="showDetailsModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>

          <div class="flex items-center gap-8 mb-12">
            <div class="w-24 h-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-indigo-100">
              {{ selectedEmploye.prenom[0] }}{{ selectedEmploye.nom[0] }}
            </div>
            <div>
              <h2 class="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">
                  {{ selectedEmploye.prenom }} {{ selectedEmploye.nom }}
              </h2>
              <div class="flex items-center gap-4">
                <span class="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                  {{ selectedEmploye.role }}
                </span>
                <span class="text-xs font-black text-slate-300 font-mono tracking-widest uppercase">{{ selectedEmploye.matricule }}</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-10">
            <div class="space-y-8">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Mail class="w-3 h-3 mr-2" /> Email Professionnel
                </label>
                <p class="text-slate-900 font-bold text-lg leading-tight">{{ selectedEmploye.email }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Building2 class="w-3 h-3 mr-2" /> Département
                </label>
                <p class="text-slate-900 font-bold text-lg leading-tight">{{ selectedEmploye.departement?.nom || 'Non assigné' }}</p>
              </div>
            </div>
            <div class="space-y-8">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Briefcase class="w-3 h-3 mr-2" /> Poste actuel
                </label>
                <p class="text-slate-900 font-bold text-lg leading-tight">{{ selectedEmploye.poste?.titre || 'Non assigné' }}</p>
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <Calendar class="w-3 h-3 mr-2" /> Date d'embauche
                </label>
                <p class="text-slate-900 font-bold text-lg leading-tight">12/03/2024</p>
              </div>
            </div>
          </div>

          <div class="mt-12 pt-8 border-t border-slate-50 flex justify-end">
            <button @click="openEdit(selectedEmploye); showDetailsModal = false" class="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
              Modifier le profil
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Modification -->
    <Teleport to="body">
      <div v-if="showEditModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" @click="showEditModal = false"></div>

        <div class="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in zoom-in duration-300">
          <div class="flex justify-between items-center mb-10">
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Modifier l'employé</h2>
              <p class="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Édition des informations</p>
            </div>
            <button @click="showEditModal = false" class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-6 text-left">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Prénom</label>
                <input v-model="selectedEmploye.prenom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Nom</label>
                <input v-model="selectedEmploye.nom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Email professionnel</label>
              <input v-model="selectedEmploye.email" type="email" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Département</label>
                <select v-model="selectedEmploye.departement_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Poste</label>
                <select v-model="selectedEmploye.poste_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Rôle Système</label>
              <select v-model="selectedEmploye.role" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button @click="showEditModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
            <button @click="updateEmploye" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Enregistrer</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Ajout -->
    <Teleport to="body">
      <div v-if="showAddModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" @click="showAddModal = false"></div>

        <div class="bg-white rounded-[2.5rem] p-10 max-w-lg w-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative z-10 animate-in fade-in zoom-in duration-300">
          <div class="flex justify-between items-center mb-10">
            <div>
              <h2 class="text-2xl font-black text-slate-900 tracking-tight">Nouvel Employé</h2>
              <p class="text-xs text-slate-400 font-bold uppercase mt-1 tracking-widest">Création d'accès système</p>
            </div>
            <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
              <X class="w-6 h-6" />
            </button>
          </div>

          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Prénom</label>
                <input v-model="newEmploye.prenom" placeholder="Prénom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Nom</label>
                <input v-model="newEmploye.nom" placeholder="Nom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
              </div>
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Email professionnel</label>
              <input v-model="newEmploye.email" type="email" placeholder="email@sirh.com" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Département</label>
                <select v-model="newEmploye.departement_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Poste</label>
                <select v-model="newEmploye.poste_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                  <option :value="null">Sélectionner...</option>
                  <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.titre }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Rôle système</label>
              <select v-model="newEmploye.role" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                <option value="employe">Employé</option>
                <option value="rh">RH</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button @click="showAddModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
            <button @click="addEmploye" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Créer l'employé</button>
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
</style>
