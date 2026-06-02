<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { Plus, Search, X, Trash2, Edit, ReceiptText, ChevronDown, ListPlus } from "lucide-vue-next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const toast = useToastStore();
const isLoading = ref(true);
const fiches = ref([]);
const users = ref([]);
const query = ref("");

const showModal = ref(false);
const editing = ref(null);
const showDetail = ref(false);
const selectedFiche = ref(null);
const lignes = ref([]);
const ligneForm = ref({ libelle: "", type: "gain", montant: 0 });
const form = ref({
  utilisateur_id: null,
  mois: new Date().getMonth() + 1,
  annee: new Date().getFullYear(),
  salaire_base: 0,
  primes: 0,
  deductions: 0,
  date_paiement: "",
  statut: "brouillon",
});

const isSaving = ref(false);
const isAddingLigne = ref(false);
const formErrors = ref({utilisateur_id: '', mois: '', salaire_base: ''});
const ligneErrors = ref({libelle: '', montant: ''});
const clearFormError = (field) => { formErrors.value[field] = ''; };
const clearLigneError = (field) => { ligneErrors.value[field] = ''; };
const validateFormField = (field) => {
  if (field === 'utilisateur_id' && !form.value.utilisateur_id) { formErrors.value.utilisateur_id = 'Requis'; return; }
  if (field === 'mois' && (!form.value.mois || form.value.mois < 1 || form.value.mois > 12)) { formErrors.value.mois = '1-12'; return; }
  if (field === 'salaire_base' && form.value.salaire_base < 0) { formErrors.value.salaire_base = '≥ 0'; return; }
  formErrors.value[field] = '';
};

const formatDate = (v) => (v ? format(new Date(v), "dd MMM yyyy", { locale: fr }) : "—");

const fetchAll = async () => {
  isLoading.value = true;
  try {
    const [fpRes, userRes] = await Promise.all([api.get("/paie/fiches"), api.get("/utilisateurs/")]);
    fiches.value = fpRes.data;
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
  return fiches.value.filter((f) => {
    if (!q) return true;
    const hay = [
      f.utilisateur?.prenom,
      f.utilisateur?.nom,
      f.utilisateur?.email,
      f.mois,
      f.annee,
      f.statut,
    ].map(normalized).join(" ");
    return hay.includes(q);
  });
});

const openCreate = () => {
  editing.value = null;
  form.value = {
    utilisateur_id: null,
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    salaire_base: 0,
    primes: 0,
    deductions: 0,
    date_paiement: "",
    statut: "brouillon",
  };
  showModal.value = true;
};

const openEdit = (f) => {
  editing.value = f;
  form.value = {
    utilisateur_id: f.utilisateur_id,
    mois: f.mois,
    annee: f.annee,
    salaire_base: f.salaire_base ?? 0,
    primes: f.primes ?? 0,
    deductions: f.deductions ?? 0,
    date_paiement: f.date_paiement ? f.date_paiement.slice(0, 10) : "",
    statut: f.statut ?? "brouillon",
  };
  showModal.value = true;
};

const save = async () => {
  isSaving.value = true;
  try {
    if (!form.value.utilisateur_id) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }
    const payload = {
      utilisateur_id: Number(form.value.utilisateur_id),
      mois: Number(form.value.mois),
      annee: Number(form.value.annee),
      salaire_base: Number(form.value.salaire_base),
      primes: Number(form.value.primes),
      deductions: Number(form.value.deductions),
      date_paiement: form.value.date_paiement ? new Date(form.value.date_paiement).toISOString() : null,
      statut: form.value.statut,
    };
    if (editing.value) {
      await api.put(`/paie/fiches/${editing.value.id}`, payload);
      toast.success("Fiche mise à jour");
    } else {
      await api.post("/paie/fiches", payload);
      toast.success("Fiche créée");
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
  if (!confirm("Supprimer cette fiche de paie ?")) return;
  try {
    await api.delete(`/paie/fiches/${id}`);
    toast.success("Fiche supprimée");
    await fetchAll();
  } catch {
    toast.error("Suppression impossible");
  }
};

const openDetail = async (f) => {
  selectedFiche.value = f;
  showDetail.value = true;
  ligneForm.value = { libelle: "", type: "gain", montant: 0 };
  try {
    const res = await api.get(`/paie/fiches/${f.id}/lignes`);
    lignes.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    lignes.value = [];
    toast.error("Impossible de charger les lignes");
  }
};

const addLigne = async () => {
  isAddingLigne.value = true;
  try {
    if (!selectedFiche.value) return;
    if (!ligneForm.value.libelle.trim()) {
      toast.error("Libellé requis");
      return;
    }
    const payload = {
      libelle: ligneForm.value.libelle,
      type: ligneForm.value.type,
      montant: Number(ligneForm.value.montant),
    };
    await api.post(`/paie/fiches/${selectedFiche.value.id}/lignes`, payload);
    toast.success("Ligne ajoutée");
    ligneForm.value = { libelle: "", type: "gain", montant: 0 };
    const res = await api.get(`/paie/fiches/${selectedFiche.value.id}/lignes`);
    lignes.value = Array.isArray(res.data) ? res.data : [];
  } catch {
    toast.error("Ajout impossible");
  } finally {
    isAddingLigne.value = false;
  }
};

const removeLigne = async (ligneId) => {
  try {
    if (!selectedFiche.value) return;
    await api.delete(`/paie/fiches/${selectedFiche.value.id}/lignes/${ligneId}`);
    lignes.value = lignes.value.filter((l) => l.id !== ligneId);
    toast.success("Ligne supprimée");
  } catch {
    toast.error("Suppression impossible");
  }
};

const netCalcule = computed(() => {
  if (!selectedFiche.value) return 0;
  const base = Number(selectedFiche.value.salaire_base || 0);
  const primes = Number(selectedFiche.value.primes || 0);
  const deductions = Number(selectedFiche.value.deductions || 0);
  const gains = lignes.value.filter((l) => l.type === "gain").reduce((s, l) => s + Number(l.montant || 0), 0);
  const retenues = lignes.value.filter((l) => l.type === "retenue").reduce((s, l) => s + Number(l.montant || 0), 0);
  return base + primes + gains - deductions - retenues;
});

const statutClass = (s) => {
  switch (s) {
    case "paye":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "traite":
      return "bg-sky-50 text-sky-700 border-sky-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 tracking-tight">Paie</h1>
        <p class="text-slate-500 font-medium">Gestion des fiches de paie (RH/Admin).</p>
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
        <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ filtered.length }} fiche(s)</div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.15em] font-black">
              <th class="px-8 py-5">Employé</th>
              <th class="px-8 py-5">Période</th>
              <th class="px-8 py-5">Salaire base</th>
              <th class="px-8 py-5">Statut</th>
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
            <tr v-for="f in filtered" :key="f.id" class="hover:bg-slate-50/30 transition-all">
              <td class="px-8 py-6">
                <div class="text-sm font-black text-slate-900">{{ f.utilisateur?.prenom }} {{ f.utilisateur?.nom }}</div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ f.utilisateur?.email }}</div>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ String(f.mois).padStart(2, "0") }}/{{ f.annee }}</span>
              </td>
              <td class="px-8 py-6">
                <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ Number(f.salaire_base || 0).toLocaleString("fr-FR") }} Ar</span>
              </td>
              <td class="px-8 py-6">
                <span :class="statutClass(f.statut)" class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest">
                  {{ f.statut || "brouillon" }}
                </span>
              </td>
              <td class="px-8 py-6 text-right">
                <div class="inline-flex gap-2">
                  <button @click="openDetail(f)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Détail / lignes">
                    <ListPlus class="w-5 h-5" />
                  </button>
                  <button @click="openEdit(f)" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Modifier">
                    <Edit class="w-5 h-5" />
                  </button>
                  <button @click="del(f.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100" title="Supprimer">
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
        <div v-if="showDetail" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showDetail = false"></div>
          <div class="relative w-full max-w-3xl">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Détail fiche</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {{ selectedFiche?.utilisateur?.prenom }} {{ selectedFiche?.utilisateur?.nom }} • {{ String(selectedFiche?.mois || "").padStart(2, "0") }}/{{ selectedFiche?.annee }}
                    </p>
                  </div>
                </div>
                <button @click="showDetail = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="p-8">
                <div class="flex items-center justify-between gap-6 mb-8">
                  <div></div>
                  <div class="text-right">
                    <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net calculé</p>
                    <p class="text-2xl font-black text-slate-900 dark:text-slate-100">{{ Number(netCalcule).toLocaleString("fr-FR") }} Ar</p>
                  </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div class="lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
                    <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Ajouter une ligne</p>
                    <div class="space-y-3">
                      <div class="space-y-2">
                        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          Libellé
                        </label>
                        <input v-model.trim="ligneForm.libelle" placeholder="Libellé" class="w-full px-4 py-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                      </div>
                      <div class="space-y-2">
                        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                          </svg>
                          Type
                        </label>
                        <select v-model="ligneForm.type" class="w-full px-4 py-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer">
                          <option value="gain">Gain</option>
                          <option value="retenue">Retenue</option>
                        </select>
                      </div>
                      <div class="space-y-2">
                        <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          Montant (Ar)
                        </label>
                        <input v-model.number="ligneForm.montant" type="number" class="w-full px-4 py-3.5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                      </div>
                      <button @click="addLigne" :disabled="isAddingLigne" class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <span v-if="isAddingLigne" class="flex items-center gap-2">
                          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                          </svg>
                          Ajout...
                        </span>
                        <span v-else class="flex items-center gap-2">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                          Ajouter
                        </span>
                      </button>
                    </div>
                  </div>
                  <div class="lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                      <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Lignes</p>
                      <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{{ lignes.length }} ligne(s)</p>
                    </div>
                    <div class="space-y-3 max-h-[420px] overflow-auto">
                      <div v-if="lignes.length === 0" class="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">Aucune ligne</div>
                      <div v-for="l in lignes" :key="l.id" class="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                        <div class="min-w-0">
                          <p class="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{{ l.libelle }}</p>
                          <p class="text-[10px] font-bold uppercase tracking-widest" :class="l.type === 'gain' ? 'text-emerald-600' : 'text-rose-600'">
                            {{ l.type }} • {{ Number(l.montant || 0).toLocaleString("fr-FR") }} Ar
                          </p>
                        </div>
                        <button @click="removeLigne(l.id)" class="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/50" title="Supprimer">
                          <Trash2 class="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all" @click="showModal = false"></div>
          <div class="relative w-full max-w-lg">
            <div class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{{ editing ? "Modifier" : "Nouvelle fiche" }}</h2>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Informations de la fiche de paie</p>
                  </div>
                </div>
                <button @click="showModal = false" class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div class="p-8 space-y-6">
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Employé
                  </label>
                  <div class="relative cursor-pointer">
                    <select v-model="form.utilisateur_id" @blur="validateFormField('utilisateur_id')" @focus="clearFormError('utilisateur_id')" :class="formErrors.utilisateur_id ? '!border-rose-400' : ''" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                      <option :value="null" disabled>Sélectionner…</option>
                      <option v-for="u in users" :key="u.id" :value="u.id">{{ u.prenom }} {{ u.nom }} — {{ u.email }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p v-if="formErrors.utilisateur_id" class="text-[10px] font-bold text-rose-500 ml-1">{{ formErrors.utilisateur_id === 'Requis' ? 'Veuillez sélectionner un employé' : formErrors.utilisateur_id }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Mois
                    </label>
                    <input v-model.number="form.mois" type="number" min="1" max="12" @blur="validateFormField('mois')" @focus="clearFormError('mois')" :class="formErrors.mois ? '!border-rose-400' : ''" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                    <p v-if="formErrors.mois" class="text-[10px] font-bold text-rose-500 ml-1">{{ formErrors.mois === '1-12' ? 'Doit être entre 1 et 12' : formErrors.mois }}</p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Année
                    </label>
                    <input v-model.number="form.annee" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Salaire base (Ar)
                  </label>
                  <input v-model.number="form.salaire_base" type="number" @blur="validateFormField('salaire_base')" @focus="clearFormError('salaire_base')" :class="formErrors.salaire_base ? '!border-rose-400' : ''" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  <p v-if="formErrors.salaire_base" class="text-[10px] font-bold text-rose-500 ml-1">{{ formErrors.salaire_base === '≥ 0' ? 'Doit être supérieur ou égal à 0' : formErrors.salaire_base }}</p>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                      Primes
                    </label>
                    <input v-model.number="form.primes" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                      </svg>
                      Déductions
                    </label>
                    <input v-model.number="form.deductions" type="number" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      Date paiement
                    </label>
                    <input v-model="form.date_paiement" type="date" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200" />
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                      </svg>
                      Statut
                    </label>
                    <div class="relative cursor-pointer">
                      <select v-model="form.statut" class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 appearance-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600">
                        <option value="brouillon">brouillon</option>
                        <option value="traite">traite</option>
                        <option value="paye">paye</option>
                      </select>
                      <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
                <div class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button @click="showModal = false" class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
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

