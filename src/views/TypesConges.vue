<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Trash2, Edit, SlidersHorizontal, ChevronDown } from "lucide-vue-next";

const toast = useToastStore();
const isLoading = ref(true);
const types = ref([]);
const query = ref("");

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
      <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showModal = false"></div>
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10">
          <button @click="showModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <SlidersHorizontal class="w-5 h-5" />
            </div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ editing ? "Modifier le type" : "Nouveau type" }}</h2>
          </div>

          <div class="space-y-5">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom</label>
              <input v-model="form.nom" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea v-model="form.description" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-24 resize-none"></textarea>
            </div>
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jours / an</label>
                <input v-model.number="form.jours_par_an" type="number" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Approbation</label>
                <div class="relative">
                  <select v-model="form.necessite_approbation" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                    <option :value="true">Oui</option>
                    <option :value="false">Non</option>
                  </select>
                  <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Couleur (hex)</label>
              <input v-model="form.couleur" placeholder="#4f46e5" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
            </div>

            <div class="flex gap-4 pt-2">
              <button @click="showModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
              <button @click="save" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

