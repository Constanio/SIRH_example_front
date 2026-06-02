<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Briefcase, Users, ChevronRight, MessageSquare, RefreshCw } from "lucide-vue-next";

const toast = useToastStore();

const isLoading = ref(true);
const isSaving = ref(false);
const offres = ref([]);
const selectedOffre = ref(null);
const candidatures = ref([]);
const commentaires = ref([]);

const showOffreModal = ref(false);
const newOffre = ref({
  titre: "",
  statut: "brouillon",
  departement_id: null,
  description: "",
});

const isCreating = ref(false);
const offreErrors = ref({titre: ''});
const commentError = ref('');
const clearOffreError = (field) => { offreErrors.value[field] = ''; };
const clearCommentError = () => { commentError.value = ''; };
const validateOffreField = (field) => {
  if (field === 'titre' && !newOffre.value.titre.trim()) offreErrors.value.titre = 'Requis';
};

const statutOptions = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_etude", label: "En étude" },
  { value: "entretien", label: "Entretien" },
  { value: "offre", label: "Offre" },
  { value: "embauche", label: "Embauché" },
  { value: "refuse", label: "Refusé" },
];

const loadOffres = async () => {
  isLoading.value = true;
  try {
    const res = await api.get("/recrutement/offres/");
    offres.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.error("Impossible de charger les offres");
  } finally {
    isLoading.value = false;
  }
};

const pickOffre = async (o) => {
  selectedOffre.value = o;
  try {
    const res = await api.get(`/recrutement/offres/${o.id}/candidatures`);
    candidatures.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    toast.error("Impossible de charger les candidatures");
    candidatures.value = [];
  }
};

const refreshComments = async (candId) => {
  try {
    const res = await api.get(`/recrutement/candidatures/${candId}/commentaires`);
    commentaires.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    commentaires.value = [];
  }
};

const selectedCand = ref(null);
const commentText = ref("");

const openComments = async (cand) => {
  selectedCand.value = cand;
  commentText.value = "";
  await refreshComments(cand.id);
};

const addComment = async () => {
  isSaving.value = true;
  try {
    if (!selectedCand.value) return;
    if (!commentText.value.trim()) {
      toast.error("Commentaire vide");
      return;
    }
    await api.post(`/recrutement/candidatures/${selectedCand.value.id}/commentaires`, { texte: commentText.value });
    commentText.value = "";
    await refreshComments(selectedCand.value.id);
    toast.success("Commentaire ajouté");
  } catch (e) {
    toast.error("Impossible d'ajouter le commentaire");
  } finally {
    isSaving.value = false;
  }
};

const updateStatut = async (cand, statut) => {
  try {
    await api.patch(`/recrutement/candidatures/${cand.id}/statut`, { statut });
    cand.statut = statut;
    toast.success("Statut mis à jour");
  } catch (e) {
    toast.error("Impossible de changer le statut");
  }
};

const createOffre = async () => {
  isCreating.value = true;
  try {
    if (!newOffre.value.titre.trim()) {
      toast.error("Titre requis");
      return;
    }
    await api.post("/recrutement/offres/", newOffre.value);
    showOffreModal.value = false;
    newOffre.value = { titre: "", statut: "brouillon", departement_id: null, description: "" };
    toast.success("Offre créée");
    loadOffres();
  } catch (e) {
    toast.error("Création impossible");
  } finally {
    isCreating.value = false;
  }
};

const selectedOffreTitle = computed(() => selectedOffre.value?.titre || "Sélectionne une offre");

onMounted(loadOffres);
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Recrutement</h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium transition-colors">Offres, candidatures, pipeline et commentaires.</p>
      </div>
      <div class="flex gap-3">
        <button @click="loadOffres" class="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2">
          <RefreshCw class="w-4 h-4" /> Actualiser
        </button>
        <button @click="showOffreModal = true" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all inline-flex items-center gap-2">
          <Plus class="w-4 h-4" /> Nouvelle offre
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-10">
      <!-- Offres -->
      <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-4">
          <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
            <Briefcase class="w-5 h-5" />
          </div>
          <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Offres</h2>
        </div>
        <div class="p-6 space-y-3">
          <div v-if="isLoading" class="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</div>
          <button
            v-for="o in offres"
            :key="o.id"
            @click="pickOffre(o)"
            class="w-full text-left p-5 rounded-[1.75rem] border transition-all"
            :class="selectedOffre?.id === o.id ? 'border-indigo-200 bg-indigo-50/40 dark:bg-indigo-500/10 dark:border-indigo-500/30' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-800/30'"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{{ o.titre }}</p>
                <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  {{ o.statut }} <span v-if="o.departement?.nom">• {{ o.departement.nom }}</span>
                </p>
              </div>
              <ChevronRight class="w-4 h-4 text-slate-300 dark:text-slate-600 mt-1" />
            </div>
          </button>
          <div v-if="!isLoading && offres.length === 0" class="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            Aucune offre
          </div>
        </div>
      </div>

      <!-- Candidatures -->
      <div class="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
              <Users class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">{{ selectedOffreTitle }}</h2>
              <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                {{ selectedOffre ? candidatures.length + ' candidature(s)' : 'Choisir une offre' }}
              </p>
            </div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black transition-colors">
                <th class="px-8 py-5">Candidat</th>
                <th class="px-8 py-5">Contact</th>
                <th class="px-8 py-5">Statut</th>
                <th class="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
              <tr v-if="!selectedOffre">
                <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Sélectionne une offre</td>
              </tr>
              <tr v-else-if="candidatures.length === 0">
                <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune candidature</td>
              </tr>
              <tr v-else v-for="c in candidatures" :key="c.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                <td class="px-8 py-6">
                  <p class="text-sm font-black text-slate-900 dark:text-slate-100">{{ c.prenom }} {{ c.nom }}</p>
                </td>
                <td class="px-8 py-6">
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ c.email }}</p>
                  <p v-if="c.telephone" class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ c.telephone }}</p>
                </td>
                <td class="px-8 py-6">
                  <select :value="c.statut" @change="updateStatut(c, $event.target.value)" class="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-black text-xs text-slate-700 dark:text-slate-200 transition-all cursor-pointer">
                    <option v-for="s in statutOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </td>
                <td class="px-8 py-6 text-right">
                  <button @click="openComments(c)" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                    <MessageSquare class="w-4 h-4" /> Commentaires
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Comments panel -->
        <div v-if="selectedCand" class="border-t border-slate-50 dark:border-slate-800 p-8 transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm font-black text-slate-900 dark:text-slate-100">Commentaires</p>
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {{ selectedCand.prenom }} {{ selectedCand.nom }}
              </p>
            </div>
            <button @click="selectedCand = null" class="text-xs font-black text-slate-500 dark:text-slate-400 hover:underline">Fermer</button>
          </div>
          <div class="space-y-3 max-h-[240px] overflow-auto">
            <div v-if="commentaires.length === 0" class="text-slate-400 text-xs font-bold uppercase tracking-widest">Aucun commentaire</div>
            <div v-for="m in commentaires" :key="m.id" class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
              <p class="text-xs font-black text-slate-700 dark:text-slate-200">{{ m.auteur?.prenom }} {{ m.auteur?.nom }}</p>
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">{{ m.texte }}</p>
              <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{{ new Date(m.created_at).toLocaleString() }}</p>
            </div>
          </div>
          <div class="mt-4 flex gap-3">
            <input v-model.trim="commentText" placeholder="Ajouter un commentaire…" maxlength="5000" @focus="clearCommentError" :class="{'border-red-400': commentError}" class="flex-1 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 outline-none font-bold text-sm text-slate-700 dark:text-slate-200 transition-all" />
            <p v-if="commentError" class="text-xs font-bold text-red-400 absolute -top-5 left-1">{{ commentError }}</p>
            <button @click="addComment" :disabled="isSaving" class="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all" :class="isSaving ? 'opacity-60 cursor-not-allowed' : ''">Envoyer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal offre -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showOffreModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showOffreModal = false"></div>
          <div class="relative w-full max-w-lg">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nouvelle offre</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Création d'une offre d'emploi</p>
                  </div>
                </div>
                <button @click="showOffreModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div class="p-8 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Titre de l'offre
                  </label>
                  <input v-model.trim="newOffre.titre" placeholder="Ex: Développeur full-stack..." maxlength="200" @blur="validateOffreField('titre')" @focus="clearOffreError('titre')" :class="{'border-red-400': offreErrors.titre}" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                  <p v-if="offreErrors.titre" class="text-xs font-bold text-red-400 ml-1">{{ offreErrors.titre }}</p>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"></path>
                    </svg>
                    Statut
                  </label>
                  <select v-model="newOffre.statut" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                    <option value="brouillon">Brouillon</option>
                    <option value="publiee">Publiée</option>
                    <option value="cloturee">Clôturée</option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Description
                  </label>
                  <textarea v-model="newOffre.description" placeholder="Décrivez le poste, les responsabilités, le profil recherché..." maxlength="10000" rows="4" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 resize-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"></textarea>
                </div>
                <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button @click="showOffreModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Annuler
                  </button>
                  <button @click="createOffre" :disabled="isCreating" class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg">
                    <span v-if="isCreating" class="flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Création...
                    </span>
                    <span v-else class="flex items-center gap-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                      Créer l'offre
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

