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

const save = async () => {
  try {
    if (!form.value.utilisateur_id || !form.value.evaluateur_id) {
      toast.error("Employé et évaluateur requis");
      return;
    }
    if (!form.value.periode_debut || !form.value.periode_fin || !form.value.date_evaluation) {
      toast.error("Dates requises");
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
      <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showModal = false"></div>
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10">
          <button @click="showModal = false" class="absolute top-8 right-8 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-all">
            <X class="w-6 h-6" />
          </button>
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
              <ClipboardCheck class="w-5 h-5" />
            </div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">{{ editing ? "Modifier" : "Nouvelle évaluation" }}</h2>
          </div>

          <div class="space-y-5">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employé</label>
                <div class="relative">
                  <select v-model="form.utilisateur_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                    <option :value="null">Sélectionner…</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }}</option>
                  </select>
                  <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Évaluateur</label>
                <div class="relative">
                  <select v-model="form.evaluateur_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 appearance-none">
                    <option :value="null">Sélectionner…</option>
                    <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }}</option>
                  </select>
                  <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Période début</label>
                <input v-model="form.periode_debut" type="date" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Période fin</label>
                <input v-model="form.periode_fin" type="date" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date évaluation</label>
                <input v-model="form.date_evaluation" type="date" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Score</label>
                <input v-model.number="form.score" type="number" step="0.1" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objectifs</label>
              <textarea v-model="form.objectifs" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-20 resize-none"></textarea>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commentaires</label>
              <textarea v-model="form.commentaires" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-24 resize-none"></textarea>
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

