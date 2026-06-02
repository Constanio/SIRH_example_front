<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Building2, Briefcase, Trash2, Edit, ChevronDown } from "lucide-vue-next";

const toast = useToastStore();
const isLoading = ref(true);
const isSaving = ref(false);
const depErrors = ref({nom: '', code: '', description: ''});
const posteErrors = ref({titre: '', description: ''});
const clearDepError = (field) => { depErrors.value[field] = ''; };
const clearPosteError = (field) => { posteErrors.value[field] = ''; };
const validateDepField = (field) => {
  if (field === 'nom' && !depForm.value.nom.trim()) { depErrors.value.nom = 'Requis'; return; }
  depErrors.value[field] = '';
};
const validatePosteField = (field) => {
  if (field === 'titre' && !posteForm.value.titre.trim()) { posteErrors.value.titre = 'Requis'; return; }
  posteErrors.value[field] = '';
};

const departements = ref([]);
const postes = ref([]);

const tab = ref("departements"); // departements | postes
const query = ref("");

const showDepModal = ref(false);
const showPosteModal = ref(false);
const editing = ref(null); // { type: 'dep' | 'poste', data: {} }

const depForm = ref({ nom: "", code: "", description: "", manager_id: null });
const posteForm = ref({ titre: "", departement_id: null, description: "", salaire_min: 0, salaire_max: 0 });

const fetchAll = async () => {
  isLoading.value = true;
  try {
    const [depRes, postRes] = await Promise.all([api.get("/departements"), api.get("/postes")]);
    departements.value = depRes.data;
    postes.value = postRes.data;
  } catch {
    toast.error("Impossible de charger l'organisation");
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAll);

const normalized = (v) => (v ?? "").toString().trim().toLowerCase();

const filteredDeps = computed(() => {
  const q = normalized(query.value);
  return departements.value.filter((d) => {
    if (!q) return true;
    return [d.nom, d.code, d.description].map(normalized).join(" ").includes(q);
  });
});

const filteredPostes = computed(() => {
  const q = normalized(query.value);
  return postes.value.filter((p) => {
    if (!q) return true;
    return [p.titre, p.departement?.nom, p.description].map(normalized).join(" ").includes(q);
  });
});

const openCreateDep = () => {
  editing.value = null;
  depForm.value = { nom: "", code: "", description: "", manager_id: null };
  showDepModal.value = true;
};

const openEditDep = (d) => {
  editing.value = { type: "dep", data: d };
  depForm.value = {
    nom: d.nom ?? "",
    code: d.code ?? "",
    description: d.description ?? "",
    manager_id: d.manager_id ?? null,
  };
  showDepModal.value = true;
};

const saveDep = async () => {
  isSaving.value = true;
  try {
    if (!depForm.value.nom?.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (editing.value?.type === "dep") {
      await api.put(`/departements/${editing.value.data.id}`, depForm.value);
      toast.success("Département mis à jour");
    } else {
      await api.post("/departements", depForm.value);
      toast.success("Département créé");
    }
    showDepModal.value = false;
    await fetchAll();
  } catch {
    toast.error("Erreur lors de l'enregistrement");
  } finally {
    isSaving.value = false;
  }
};

const deleteDep = async (id) => {
  if (!confirm("Supprimer ce département ?")) return;
  try {
    await api.delete(`/departements/${id}`);
    toast.success("Département supprimé");
    await fetchAll();
  } catch {
    toast.error("Suppression impossible");
  }
};

const openCreatePoste = () => {
  editing.value = null;
  posteForm.value = { titre: "", departement_id: null, description: "", salaire_min: 0, salaire_max: 0 };
  showPosteModal.value = true;
};

const openEditPoste = (p) => {
  editing.value = { type: "poste", data: p };
  posteForm.value = {
    titre: p.titre ?? "",
    departement_id: p.departement_id ?? p.departement?.id ?? null,
    description: p.description ?? "",
    salaire_min: p.salaire_min ?? 0,
    salaire_max: p.salaire_max ?? 0,
  };
  showPosteModal.value = true;
};

const savePoste = async () => {
  isSaving.value = true;
  try {
    if (!posteForm.value.titre?.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (editing.value?.type === "poste") {
      await api.put(`/postes/${editing.value.data.id}`, posteForm.value);
      toast.success("Poste mis à jour");
    } else {
      await api.post("/postes", posteForm.value);
      toast.success("Poste créé");
    }
    showPosteModal.value = false;
    await fetchAll();
  } catch {
    toast.error("Erreur lors de l'enregistrement");
  } finally {
    isSaving.value = false;
  }
};

const deletePoste = async (id) => {
  if (!confirm("Supprimer ce poste ?")) return;
  try {
    await api.delete(`/postes/${id}`);
    toast.success("Poste supprimé");
    await fetchAll();
  } catch {
    toast.error("Suppression impossible");
  }
};
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Organisation</h1>
        <p class="text-slate-500 font-medium">Départements et postes, prêts à être utilisés partout dans l’application.</p>
      </div>
      <div class="flex items-center gap-3">
        <button v-if="tab === 'departements'" @click="openCreateDep" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
          <Plus class="w-5 h-5" /> Ajouter un département
        </button>
        <button v-else @click="openCreatePoste" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
          <Plus class="w-5 h-5" /> Ajouter un poste
        </button>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
        <button @click="tab = 'departements'" :class="tab === 'departements' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2">
          <Building2 class="w-4 h-4" /> Départements
        </button>
        <button @click="tab = 'postes'" :class="tab === 'postes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2">
          <Briefcase class="w-4 h-4" /> Postes
        </button>
      </div>

      <div class="relative flex-1 max-w-md group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input v-model="query" type="text" placeholder="Rechercher…" class="pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl w-full text-sm font-bold text-slate-700 outline-none transition-all" />
      </div>
    </div>

    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Nom</th>
              <th v-if="tab === 'departements'" class="px-8 py-5">Code</th>
              <th v-else class="px-8 py-5">Département</th>
              <th class="px-8 py-5">Description</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="isLoading">
              <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</td>
            </tr>
            <template v-else>
              <tr v-if="tab === 'departements' && filteredDeps.length === 0">
                <td colspan="5" class="px-8 py-14 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun département</td>
              </tr>
              <tr v-if="tab === 'postes' && filteredPostes.length === 0">
                <td colspan="5" class="px-8 py-14 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun poste</td>
              </tr>

              <tr v-for="row in (tab === 'departements' ? filteredDeps : filteredPostes)" :key="row.id" class="hover:bg-slate-50/30 transition-all">
                <td class="px-8 py-6">
                  <div class="text-sm font-black text-slate-900">{{ tab === 'departements' ? row.nom : row.titre }}</div>
                </td>
                <td v-if="tab === 'departements'" class="px-8 py-6">
                  <span class="text-xs font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg">{{ row.code || '-' }}</span>
                </td>
                <td v-else class="px-8 py-6">
                  <span class="text-xs font-bold text-slate-600">{{ row.departement?.nom || 'Non assigné' }}</span>
                </td>
                <td class="px-8 py-6">
                  <span class="text-xs font-bold text-slate-400">{{ row.description || '-' }}</span>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="inline-flex gap-2">
                    <button v-if="tab === 'departements'" @click="openEditDep(row)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                      <Edit class="w-5 h-5" />
                    </button>
                    <button v-else @click="openEditPoste(row)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                      <Edit class="w-5 h-5" />
                    </button>

                    <button v-if="tab === 'departements'" @click="deleteDep(row.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
                      <Trash2 class="w-5 h-5" />
                    </button>
                    <button v-else @click="deletePoste(row.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Département -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDepModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showDepModal = false"></div>
          <div class="relative w-full max-w-lg">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 7v14a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-5 9 5M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ editing?.type === 'dep' ? 'Modifier le département' : 'Nouveau département' }}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ editing?.type === 'dep' ? 'Modifiez les informations du département' : 'Créez un nouveau département' }}</p>
                  </div>
                </div>
                <button @click="showDepModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="p-8 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 7v14a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-5 9 5M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6"></path>
                    </svg>
                    Nom
                  </label>
                  <input v-model.trim="depForm.nom" maxlength="200" @blur="validateDepField('nom')" @focus="clearDepError('nom')" :class="{'border-red-400': depErrors.nom}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  <p v-if="depErrors.nom" class="text-xs text-red-500 font-bold ml-1">{{ depErrors.nom }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                      </svg>
                      Code
                    </label>
                    <input v-model.trim="depForm.code" maxlength="50" @focus="clearDepError('code')" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                      Manager (ID)
                    </label>
                    <input v-model.number="depForm.manager_id" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                    </svg>
                    Description
                  </label>
                  <textarea v-model.trim="depForm.description" maxlength="2000" @focus="clearDepError('description')" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 h-28 resize-none transition-all duration-200"></textarea>
                </div>
                <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button @click="showDepModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Annuler
                  </button>
                  <button @click="saveDep" :disabled="isSaving" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="isSaving" class="flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Enregistrement...
                    </span>
                    <span v-else class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Enregistrer
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Poste -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showPosteModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showPosteModal = false"></div>
          <div class="relative w-full max-w-lg">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ editing?.type === 'poste' ? 'Modifier le poste' : 'Nouveau poste' }}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ editing?.type === 'poste' ? 'Modifiez les informations du poste' : 'Créez un nouveau poste' }}</p>
                  </div>
                </div>
                <button @click="showPosteModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="p-8 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    Titre
                  </label>
                  <input v-model.trim="posteForm.titre" maxlength="200" @blur="validatePosteField('titre')" @focus="clearPosteError('titre')" :class="{'border-red-400': posteErrors.titre}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  <p v-if="posteErrors.titre" class="text-xs text-red-500 font-bold ml-1">{{ posteErrors.titre }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M3 7v14a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-5 9 5M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6"></path>
                    </svg>
                    Département
                  </label>
                  <div class="relative cursor-pointer">
                    <select v-model="posteForm.departement_id" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 appearance-none">
                      <option :value="null">Non assigné</option>
                      <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Salaire min
                    </label>
                    <input v-model.number="posteForm.salaire_min" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Salaire max
                    </label>
                    <input v-model.number="posteForm.salaire_max" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                    </svg>
                    Description
                  </label>
                  <textarea v-model.trim="posteForm.description" maxlength="2000" @focus="clearPosteError('description')" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 h-28 resize-none transition-all duration-200"></textarea>
                </div>
                <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button @click="showPosteModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Annuler
                  </button>
                  <button @click="savePoste" :disabled="isSaving" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="isSaving" class="flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Enregistrement...
                    </span>
                    <span v-else class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Enregistrer
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
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(1rem);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.animate-in {
    animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

