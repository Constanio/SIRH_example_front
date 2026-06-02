<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, Trash2, Edit, SlidersHorizontal, ChevronDown } from "lucide-vue-next";

const toast = useToastStore();
const isLoading = ref(true);
const isSaving = ref(false);
const types = ref([]);
const query = ref("");

const typeErrors = ref({nom: ''});
const clearTypeError = (field) => { typeErrors.value[field] = ''; };
const validateTypeField = (field) => {
  if (field === 'nom' && !form.value.nom.trim()) { typeErrors.value.nom = 'Requis'; return; }
  typeErrors.value[field] = '';
};

const showModal = ref(false);
const editing = ref(null);
const form = ref({
  nom: "",
  description: "",
  jours_par_an: 0,
  necessite_approbation: true,
  couleur: "",
});

const fetchTypes = async () => {
  isLoading.value = true;
  try {
    const res = await api.get("/conges/types");
    types.value = res.data;
  } catch {
    toast.error("Impossible de charger les types de congés");
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTypes);

const normalized = (v) => (v ?? "").toString().trim().toLowerCase();
const filtered = computed(() => {
  const q = normalized(query.value);
  return types.value.filter((t) => {
    if (!q) return true;
    return [t.nom, t.description, t.couleur].map(normalized).join(" ").includes(q);
  });
});

const openCreate = () => {
  editing.value = null;
  form.value = { nom: "", description: "", jours_par_an: 0, necessite_approbation: true, couleur: "" };
  showModal.value = true;
};

const openEdit = (t) => {
  editing.value = t;
  form.value = {
    nom: t.nom ?? "",
    description: t.description ?? "",
    jours_par_an: t.jours_par_an ?? 0,
    necessite_approbation: t.necessite_approbation ?? true,
    couleur: t.couleur ?? "",
  };
  showModal.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    if (!form.value.nom?.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (editing.value) {
      await api.put(`/conges/types/${editing.value.id}`, form.value);
      toast.success("Type mis à jour");
    } else {
      await api.post("/conges/types", form.value);
      toast.success("Type créé");
    }
    showModal.value = false;
    await fetchTypes();
  } catch (e) {
    toast.error("Action non autorisée (RH/Admin) ou erreur serveur");
  } finally {
    isSaving.value = false;
  }
};

const del = async (id) => {
  if (!confirm("Supprimer ce type de congé ?")) return;
  try {
    await api.delete(`/conges/types/${id}`);
    toast.success("Type supprimé");
    await fetchTypes();
  } catch {
    toast.error("Suppression impossible");
  }
};
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Types de congés</h1>
        <p class="text-slate-500 font-medium">Paramétrage (RH/Admin) des catégories et quotas annuels.</p>
      </div>
      <button @click="openCreate" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> Ajouter
      </button>
    </div>

    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input v-model="query" type="text" placeholder="Rechercher…" class="pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full text-sm font-bold text-slate-700 outline-none transition-all" />
        </div>
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ filtered.length }} type(s)</div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Nom</th>
              <th class="px-8 py-5">Jours/an</th>
              <th class="px-8 py-5">Approbation</th>
              <th class="px-8 py-5">Couleur</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="isLoading">
              <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun type</td>
            </tr>
            <tr v-for="t in filtered" :key="t.id" class="hover:bg-slate-50/30 transition-all">
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900">{{ t.nom }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[420px]">{{ t.description || '—' }}</div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ t.jours_par_an ?? 0 }}</span>
              </td>
              <td class="px-8 py-6">
                <span class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest" :class="t.necessite_approbation ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100'">
                  {{ t.necessite_approbation ? 'Oui' : 'Non' }}
                </span>
              </td>
              <td class="px-8 py-6">
                <div class="inline-flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full border border-slate-200" :style="{ backgroundColor: t.couleur || '#e2e8f0' }"></span>
                  <span class="text-xs font-bold text-slate-500">{{ t.couleur || 'auto' }}</span>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="inline-flex gap-2">
                  <button @click="openEdit(t)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="del(t.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 backdrop-blur-md transition-all" @click="showModal = false"></div>

          <div class="relative w-full max-w-lg">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div class="bg-white rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <SlidersHorizontal class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 tracking-tight">{{ editing ? "Modifier le type" : "Nouveau type" }}</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Paramétrage des catégories</p>
                  </div>
                </div>
                <button @click="showModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <div class="p-8 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                    </svg>
                    Nom
                  </label>
                  <input v-model.trim="form.nom" @blur="validateTypeField('nom')" @focus="clearTypeError('nom')" :class="{'border-red-400': typeErrors.nom}" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" />
                  <p v-if="typeErrors.nom" class="text-xs font-bold text-red-400 mt-1 ml-1">{{ typeErrors.nom }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                    </svg>
                    Description
                  </label>
                  <textarea v-model="form.description" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200 h-24 resize-none"></textarea>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                      </svg>
                      Jours / an
                    </label>
                    <input v-model.number="form.jours_par_an" type="number" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Approbation
                    </label>
                    <div class="relative cursor-pointer">
                      <select v-model="form.necessite_approbation" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-300">
                        <option :value="true">Oui</option>
                        <option :value="false">Non</option>
                      </select>
                      <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                    </svg>
                    Couleur (hex)
                  </label>
                  <input v-model="form.couleur" placeholder="#4f46e5" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" />
                </div>

                <div class="flex gap-3 pt-6 border-t border-slate-100">
                  <button @click="showModal = false" class="flex-1 py-3.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Annuler
                  </button>
                  <button @click="save" :disabled="isSaving" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg">
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
                      {{ editing ? "Mettre à jour" : "Créer le type" }}
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

