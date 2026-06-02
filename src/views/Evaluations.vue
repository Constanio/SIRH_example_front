<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Trash2, Edit, ClipboardCheck, ChevronDown } from "lucide-vue-next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const toast = useToastStore();
const isLoading = ref(true);
const evaluations = ref([]);
const users = ref([]);
const query = ref("");

const showModal = ref(false);
const editing = ref(null);
const form = ref({
  utilisateur_id: null,
  evaluateur_id: null,
  periode_debut: "",
  periode_fin: "",
  date_evaluation: "",
  score: 0,
  commentaires: "",
  objectifs: "",
});
const isSaving = ref(false);
const formErrors = ref({});

const formatDate = (v) => (v ? format(new Date(v), "dd MMM yyyy", { locale: fr }) : "—");

const fetchAll = async () => {
  isLoading.value = true;
  try {
    const [evRes, userRes] = await Promise.all([api.get("/evaluations/"), api.get("/utilisateurs/")]);
    evaluations.value = evRes.data;
    users.value = userRes.data;
  } catch {
    toast.error("Accès RH/Admin/Manager requis ou erreur serveur");
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchAll);

const normalized = (v) => (v ?? "").toString().trim().toLowerCase();
const filtered = computed(() => {
  const q = normalized(query.value);
  return evaluations.value.filter((e) => {
    if (!q) return true;
    const hay = [
      e.utilisateur?.prenom,
      e.utilisateur?.nom,
      e.evaluateur?.prenom,
      e.evaluateur?.nom,
      e.score,
      formatDate(e.date_evaluation),
      e.commentaires,
      e.objectifs,
    ].map(normalized).join(" ");
    return hay.includes(q);
  });
});

const openCreate = () => {
  editing.value = null;
  form.value = {
    utilisateur_id: null,
    evaluateur_id: null,
    periode_debut: "",
    periode_fin: "",
    date_evaluation: "",
    score: 0,
    commentaires: "",
    objectifs: "",
  };
  showModal.value = true;
};

const openEdit = (e) => {
  editing.value = e;
  form.value = {
    utilisateur_id: e.utilisateur_id,
    evaluateur_id: e.evaluateur_id,
    periode_debut: e.periode_debut ? e.periode_debut.slice(0, 10) : "",
    periode_fin: e.periode_fin ? e.periode_fin.slice(0, 10) : "",
    date_evaluation: e.date_evaluation ? e.date_evaluation.slice(0, 10) : "",
    score: e.score ?? 0,
    commentaires: e.commentaires ?? "",
    objectifs: e.objectifs ?? "",
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
  if (field === 'evaluateur_id' && !form.value.evaluateur_id) next.evaluateur_id = "Sélectionnez un évaluateur";
  else if (field === 'evaluateur_id') delete next.evaluateur_id;
  if (field === 'periode_debut' && !form.value.periode_debut) next.periode_debut = "Date début requise";
  else if (field === 'periode_debut') delete next.periode_debut;
  if (field === 'periode_fin' && !form.value.periode_fin) next.periode_fin = "Date fin requise";
  else if (field === 'periode_fin') delete next.periode_fin;
  if (field === 'date_evaluation' && !form.value.date_evaluation) next.date_evaluation = "Date évaluation requise";
  else if (field === 'date_evaluation') delete next.date_evaluation;
  formErrors.value = next;
};

const save = async () => {
  isSaving.value = true;
  formErrors.value = {};
  try {
    const errs = {};
    if (!form.value.utilisateur_id) errs.utilisateur_id = "Sélectionnez un employé";
    if (!form.value.evaluateur_id) errs.evaluateur_id = "Sélectionnez un évaluateur";
    if (!form.value.periode_debut) errs.periode_debut = "Date début requise";
    if (!form.value.periode_fin) errs.periode_fin = "Date fin requise";
    if (!form.value.date_evaluation) errs.date_evaluation = "Date évaluation requise";
    if (Object.keys(errs).length) {
      formErrors.value = errs;
      return;
    }
    const payload = {
      utilisateur_id: Number(form.value.utilisateur_id),
      evaluateur_id: Number(form.value.evaluateur_id),
      periode_debut: new Date(form.value.periode_debut).toISOString(),
      periode_fin: new Date(form.value.periode_fin).toISOString(),
      date_evaluation: new Date(form.value.date_evaluation).toISOString(),
      score: Number(form.value.score),
      commentaires: form.value.commentaires,
      objectifs: form.value.objectifs,
    };
    if (editing.value) {
      await api.put(`/evaluations/${editing.value.id}`, payload);
      toast.success("Évaluation mise à jour");
    } else {
      await api.post("/evaluations/", payload);
      toast.success("Évaluation créée");
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
  if (!confirm("Supprimer cette évaluation ?")) return;
  try {
    await api.delete(`/evaluations/${id}`);
    toast.success("Évaluation supprimée");
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
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Évaluations</h1>
        <p class="text-slate-500 font-medium">Suivi de performance (RH/Admin/Manager).</p>
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
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ filtered.length }} entrée(s)</div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Employé</th>
              <th class="px-8 py-5">Évaluateur</th>
              <th class="px-8 py-5">Date</th>
              <th class="px-8 py-5">Score</th>
              <th class="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="isLoading">
              <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</td>
            </tr>
            <tr v-else-if="filtered.length === 0">
              <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune donnée</td>
            </tr>
            <tr v-for="e in filtered" :key="e.id" class="hover:bg-slate-50/30 transition-all">
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900">{{ e.utilisateur?.prenom }} {{ e.utilisateur?.nom }}</div>
              </td>
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900">{{ e.evaluateur?.prenom }} {{ e.evaluateur?.nom }}</div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-bold text-slate-600">{{ formatDate(e.date_evaluation) }}</span>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ e.score ?? 0 }}</span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="inline-flex gap-2">
                  <button @click="openEdit(e)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="del(e.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
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
                    <ClipboardCheck class="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 tracking-tight">{{ editing ? "Modifier" : "Nouvelle évaluation" }}</h2>
                    <p class="text-xs text-slate-500 mt-0.5">Remplissez les informations ci-dessous</p>
                  </div>
                </div>
                <button @click="showModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <X class="w-5 h-5" />
                </button>
              </div>
              <div class="p-8 space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Employé
                    </label>
                    <div class="relative cursor-pointer">
                      <select v-model="form.utilisateur_id" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border outline-none font-bold text-slate-700 appearance-none transition-all duration-200" :class="formErrors.utilisateur_id ? 'border-red-400' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white'" @focus="clearError('utilisateur_id')" @blur="validateOnBlur('utilisateur_id')">
                        <option :value="null">Sélectionner…</option>
                        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }}</option>
                      </select>
                      <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <p v-if="formErrors.utilisateur_id" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.utilisateur_id }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"></path>
                      </svg>
                      Évaluateur
                    </label>
                    <div class="relative cursor-pointer">
                      <select v-model="form.evaluateur_id" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border outline-none font-bold text-slate-700 appearance-none transition-all duration-200" :class="formErrors.evaluateur_id ? 'border-red-400' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white'" @focus="clearError('evaluateur_id')" @blur="validateOnBlur('evaluateur_id')">
                        <option :value="null">Sélectionner…</option>
                        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }}</option>
                      </select>
                      <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <p v-if="formErrors.evaluateur_id" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.evaluateur_id }}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2v4"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18"></path>
                      </svg>
                      Période début
                    </label>
                    <input v-model="form.periode_debut" type="date" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border outline-none font-bold text-slate-700 transition-all duration-200" :class="formErrors.periode_debut ? 'border-red-400' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white'" @focus="clearError('periode_debut')" @blur="validateOnBlur('periode_debut')" />
                    <p v-if="formErrors.periode_debut" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.periode_debut }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2v4"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18"></path>
                      </svg>
                      Période fin
                    </label>
                    <input v-model="form.periode_fin" type="date" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border outline-none font-bold text-slate-700 transition-all duration-200" :class="formErrors.periode_fin ? 'border-red-400' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white'" @focus="clearError('periode_fin')" @blur="validateOnBlur('periode_fin')" />
                    <p v-if="formErrors.periode_fin" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.periode_fin }}</p>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 2v4"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 16 2 2 4-4"></path>
                      </svg>
                      Date évaluation
                    </label>
                    <input v-model="form.date_evaluation" type="date" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border outline-none font-bold text-slate-700 transition-all duration-200" :class="formErrors.date_evaluation ? 'border-red-400' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white'" @focus="clearError('date_evaluation')" @blur="validateOnBlur('date_evaluation')" />
                    <p v-if="formErrors.date_evaluation" class="text-xs font-bold text-red-500 ml-1">{{ formErrors.date_evaluation }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.756a2.122 2.122 0 0 0 1.597-1.16z"></path>
                      </svg>
                      Score
                    </label>
                    <input v-model.number="form.score" type="number" step="0.1" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-bold text-slate-700 transition-all duration-200" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    Objectifs
                  </label>
                  <textarea v-model.trim="form.objectifs" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-bold text-slate-700 h-20 resize-none transition-all duration-200"></textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Commentaires
                  </label>
                  <textarea v-model.trim="form.commentaires" class="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white outline-none font-bold text-slate-700 h-24 resize-none transition-all duration-200"></textarea>
                </div>
                <div class="flex gap-3 pt-6 border-t border-slate-100">
                  <button @click="showModal = false" class="flex-1 py-3.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    Annuler
                  </button>
                  <button @click="save" :disabled="isSaving" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
                      {{ editing ? "Mettre à jour" : "Enregistrer" }}
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

