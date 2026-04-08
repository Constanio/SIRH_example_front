<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Building2, Briefcase, Trash2, Edit, ChevronDown } from "lucide-vue-next";

const toast = useToastStore();
const isLoading = ref(true);

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
      <div v-if="showDepModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showDepModal = false"></div>
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10">
          <button @click="showDepModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-8">{{ editing?.type === 'dep' ? 'Modifier le département' : 'Nouveau département' }}</h2>
          <div class="space-y-5">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
              <input v-model="depForm.nom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code</label>
                <input v-model="depForm.code" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manager (ID)</label>
                <input v-model.number="depForm.manager_id" type="number" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea v-model="depForm.description" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-28 resize-none"></textarea>
            </div>
            <div class="flex gap-4 pt-2">
              <button @click="showDepModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
              <button @click="saveDep" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Poste -->
    <Teleport to="body">
      <div v-if="showPosteModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showPosteModal = false"></div>
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10">
          <button @click="showPosteModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>
          <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-8">{{ editing?.type === 'poste' ? 'Modifier le poste' : 'Nouveau poste' }}</h2>
          <div class="space-y-5">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Titre</label>
              <input v-model="posteForm.titre" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Département</label>
              <div class="relative">
                <select v-model="posteForm.departement_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                  <option :value="null">Non assigné</option>
                  <option v-for="d in departements" :key="d.id" :value="d.id">{{ d.nom }}</option>
                </select>
                <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salaire min</label>
                <input v-model.number="posteForm.salaire_min" type="number" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Salaire max</label>
                <input v-model.number="posteForm.salaire_max" type="number" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea v-model="posteForm.description" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-28 resize-none"></textarea>
            </div>
            <div class="flex gap-4 pt-2">
              <button @click="showPosteModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
              <button @click="savePoste" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

