<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Trash2, Edit, Banknote, ChevronDown } from "lucide-vue-next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const toast = useToastStore();
const isLoading = ref(true);
const salaires = ref([]);
const users = ref([]);
const query = ref("");

const showModal = ref(false);
const editing = ref(null);
const form = ref({ utilisateur_id: null, salaire_base: 0, date_debut: "", date_fin: "" });
const isSaving = ref(false);
const formErrors = ref({});

const formatDate = (v) => (v ? format(new Date(v), "dd MMM yyyy", { locale: fr }) : "—");

const fetchAll = async () => {
  isLoading.value = true;
  try {
    const [salRes, userRes] = await Promise.all([api.get("/salaires/"), api.get("/utilisateurs/")]);
    salaires.value = salRes.data;
    users.value = userRes.data;
  } catch {
    toast.error("Accès RH/Admin requis ou erreur serveur");
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAll);

const normalized = (v) => (v ?? "").toString().trim().toLowerCase();
const filtered = computed(() => {
  const q = normalized(query.value);
  return salaires.value.filter((s) => {
    if (!q) return true;
    const hay = [
      s.utilisateur?.prenom,
      s.utilisateur?.nom,
      s.utilisateur?.email,
      s.salaire_base,
      formatDate(s.date_debut),
      formatDate(s.date_fin),
    ].map(normalized).join(" ");
    return hay.includes(q);
  });
});

const openCreate = () => {
  editing.value = null;
  form.value = { utilisateur_id: null, salaire_base: 0, date_debut: "", date_fin: "" };
  showModal.value = true;
};

const openEdit = (s) => {
  editing.value = s;
  form.value = {
    utilisateur_id: s.utilisateur_id,
    salaire_base: s.salaire_base ?? 0,
    date_debut: s.date_debut ? s.date_debut.slice(0, 10) : "",
    date_fin: s.date_fin ? s.date_fin.slice(0, 10) : "",
  };
  showModal.value = true;
};

const clearError = (field) => {
  const next = { ...formErrors.value };
  delete next[field];
  formErrors.value = next;
};

const validateOnBlur = (field) => {
  const next = { ...formErrors.value };
  if (field === 'utilisateur_id' && !form.value.utilisateur_id) next.utilisateur_id = "Sélectionnez un employé";
  else if (field === 'utilisateur_id') delete next.utilisateur_id;
  if (field === 'salaire_base' && (!form.value.salaire_base || form.value.salaire_base <= 0)) next.salaire_base = "Salaire requis";
  else if (field === 'salaire_base') delete next.salaire_base;
  if (field === 'date_debut' && !form.value.date_debut) next.date_debut = "Date début requise";
  else if (field === 'date_debut') delete next.date_debut;
  formErrors.value = next;
};

const save = async () => {
  isSaving.value = true;
  formErrors.value = {};
  try {
    const errs = {};
    if (!form.value.utilisateur_id) errs.utilisateur_id = "Sélectionnez un employé";
    if (!form.value.salaire_base || form.value.salaire_base <= 0) errs.salaire_base = "Salaire requis";
    if (!form.value.date_debut) errs.date_debut = "Date début requise";
    if (Object.keys(errs).length) {
      formErrors.value = errs;
      return;
    }
    const payload = {
      utilisateur_id: Number(form.value.utilisateur_id),
      salaire_base: Number(form.value.salaire_base),
      date_debut: new Date(form.value.date_debut).toISOString(),
      date_fin: form.value.date_fin ? new Date(form.value.date_fin).toISOString() : null,
    };
    if (editing.value) {
      await api.put(`/salaires/${editing.value.id}`, payload);
      toast.success("Salaire mis à jour");
    } else {
      await api.post("/salaires/", payload);
      toast.success("Salaire créé");
    }
    showModal.value = false;
    await fetchAll();
  } catch {
    toast.error("Enregistrement impossible");
  } finally {
    isSaving.value = false;
  }
};

const del = async (id) => {
  if (!confirm("Supprimer cet enregistrement de salaire ?")) return;
  try {
    await api.delete(`/salaires/${id}`);
    toast.success("Salaire supprimé");
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
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Salaires</h1>
        <p class="text-slate-500 font-medium">Historique des salaires par employé (RH/Admin).</p>
      </div>
      <button @click="openCreate" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> Ajouter
      </button>
    </div>

    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div class="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input v-model.trim="query" type="text" placeholder="Rechercher…" class="pl-11 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl w-full text-sm font-bold text-slate-700 outline-none transition-all" />
        </div>
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ filtered.length }} entrée(s)</div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Employé</th>
              <th class="px-8 py-5">Salaire base</th>
              <th class="px-8 py-5">Période</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="isLoading">
              <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune donnée</td>
            </tr>
            <tr v-for="s in filtered" :key="s.id" class="hover:bg-slate-50/30 transition-all">
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900">{{ s.utilisateur?.prenom }} {{ s.utilisateur?.nom }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ s.utilisateur?.email }}</div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ Number(s.salaire_base || 0).toLocaleString("fr-FR") }} Ar</span>
              </td>
              <td class="px-8 py-6">
                <div class="inline-flex items-center px-4 py-2 bg-slate-50 rounded-2xl gap-3 text-xs font-bold text-slate-600 border border-slate-100">
                  <span>{{ formatDate(s.date_debut) }}</span>
                  <span class="text-slate-300">→</span>
                  <span>{{ formatDate(s.date_fin) }}</span>
                </div>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="inline-flex gap-2">
                  <button @click="openEdit(s)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="del(s.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
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
                    <Banknote class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 tracking-tight">{{ editing ? "Modifier" : "Nouveau salaire" }}</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Remplissez les informations ci-dessous</p>
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Employé
                  </label>
                  <div class="relative cursor-pointer">
                    <select v-model="form.utilisateur_id" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200 appearance-none" :class="formErrors.utilisateur_id ? 'border-red-400' : ''" @focus="clearError('utilisateur_id')" @blur="validateOnBlur('utilisateur_id')">
                      <option :value="null">Sélectionner…</option>
                      <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }} — {{ u.email }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p v-if="formErrors.utilisateur_id" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.utilisateur_id }}</p>
                </div>

                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Salaire base (Ar)
                  </label>
                  <input v-model.number="form.salaire_base" type="number" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" :class="formErrors.salaire_base ? 'border-red-400' : ''" @focus="clearError('salaire_base')" @blur="validateOnBlur('salaire_base')" />
                  <p v-if="formErrors.salaire_base" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.salaire_base }}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path>
                      </svg>
                      Début
                    </label>
                    <input v-model="form.date_debut" type="date" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" :class="formErrors.date_debut ? 'border-red-400' : ''" @focus="clearError('date_debut')" @blur="validateOnBlur('date_debut')" />
                    <p v-if="formErrors.date_debut" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.date_debut }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path>
                      </svg>
                      Fin (optionnel)
                    </label>
                    <input v-model="form.date_fin" type="date" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-medium text-slate-700 transition-all duration-200" />
                  </div>
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
                      {{ editing ? "Mettre à jour" : "Créer le salaire" }}
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
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

