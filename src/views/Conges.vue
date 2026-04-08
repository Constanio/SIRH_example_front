<script setup>
import { ref, onMounted, computed, watch } from "vue";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import {
    Plus, PieChart,
    History, CalendarDays, FileText, ArrowRight, Calendar as CalendarIcon,
    ShieldCheck, Check, Ban, Search, Filter, ChevronDown
} from "lucide-vue-next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const auth = useAuthStore();
const toast = useToastStore();
const soldes = ref([]);
const demandes = ref([]);
const types = ref([]);
const allDemandes = ref([]);
const activeTab = ref("mes_conges"); // 'mes_conges' ou 'validation'
const showModal = ref(false);
const isLoading = ref(true);
const mySearch = ref("");
const myStatus = ref("tous");
const validationSearch = ref("");

const isManager = computed(() => ["admin", "rh", "manager"].includes(auth.user?.role));

const newDemande = ref({
    type_conge_id: null,
    date_debut: "",
    date_fin: "",
    motif: "",
    jours_demandes: 0,
});

const fetchData = async () => {
    isLoading.value = true;
    try {
        const promises = [
            api.get("/conges/mes-soldes"),
            api.get("/conges/mes-demandes"),
            api.get("/conges/types"),
        ];

        if (isManager.value) {
            promises.push(api.get("/conges/toutes-les-demandes"));
        }

        const results = await Promise.all(promises);
        soldes.value = results[0].data;
        demandes.value = results[1].data;
        types.value = results[2].data;

        if (isManager.value && results[3]) {
            allDemandes.value = results[3].data;
        }

        if (types.value.length > 0 && !newDemande.value.type_conge_id) {
            newDemande.value.type_conge_id = types.value[0].id;
        }
    } catch (err) {
        toast.error("Impossible de charger les données");
    } finally {
        isLoading.value = false;
    }
};

const approveLeave = async (id) => {
    try {
        await api.patch(`/conges/approuver/${id}`);
        toast.success("Demande approuvée");
        fetchData();
    } catch (err) {
        toast.error("Erreur lors de l'approbation");
    }
};

const refuseLeave = async (id) => {
    try {
        await api.patch(`/conges/refuser/${id}`);
        toast.success("Demande refusée");
        fetchData();
    } catch (err) {
        toast.error("Erreur lors du refus");
    }
};

const calculatedDays = computed(() => {
    if (!newDemande.value.date_debut || !newDemande.value.date_fin) return 0;
    const start = new Date(newDemande.value.date_debut);
    const end = new Date(newDemande.value.date_fin);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
});

const normalized = (v) => (v ?? "").toString().trim().toLowerCase();

const filteredMyDemandes = computed(() => {
    const q = normalized(mySearch.value);
    return demandes.value
        .filter((d) => (myStatus.value === "tous" ? true : d.statut === myStatus.value))
        .filter((d) => {
            if (!q) return true;
            const hay = [
                d.type_conge?.nom,
                d.motif,
                d.statut,
                formatDate(d.date_debut),
                formatDate(d.date_fin),
            ].map(normalized).join(" ");
            return hay.includes(q);
        })
        .slice()
        .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));
});

const filteredValidationDemandes = computed(() => {
    const q = normalized(validationSearch.value);
    return allDemandes.value
        .filter((req) => req.statut === "en_attente")
        .filter((d) => {
            if (!q) return true;
            const hay = [
                d.utilisateur?.prenom,
                d.utilisateur?.nom,
                d.utilisateur?.email,
                d.type_conge?.nom,
                d.motif,
            ].map(normalized).join(" ");
            return hay.includes(q);
        });
});

const createDemande = async () => {
    try {
        if (!newDemande.value.date_debut || !newDemande.value.date_fin) {
            toast.error("Veuillez choisir une période");
            return;
        }
        if (calculatedDays.value <= 0) {
            toast.error("Période invalide");
            return;
        }
        const payload = {
            type_conge_id: parseInt(newDemande.value.type_conge_id),
            date_debut: new Date(newDemande.value.date_debut).toISOString(),
            date_fin: new Date(newDemande.value.date_fin).toISOString(),
            jours_demandes: calculatedDays.value,
            motif: newDemande.value.motif,
        };
        await api.post("/conges/demande", payload);
        toast.success("Demande soumise");
        showModal.value = false;
        fetchData();
    } catch (err) {
        toast.error("Erreur de soumission");
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case "en_attente": return "bg-amber-50 text-amber-600 border-amber-100";
        case "approuve": return "bg-emerald-50 text-emerald-600 border-emerald-100";
        case "refuse": return "bg-rose-50 text-rose-600 border-rose-100";
        default: return "bg-slate-50 text-slate-600";
    }
};

const formatDate = (dateStr) => dateStr ? format(new Date(dateStr), "dd MMM yyyy", { locale: fr }) : "-";

onMounted(fetchData);
</script>

<template>
    <div class="space-y-10">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div class="space-y-1">
                <h1 class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Gestion des Congés</h1>
                <p class="text-slate-500 dark:text-slate-400 font-medium transition-colors">Planifiez vos absences et validez celles de vos équipes.</p>
            </div>
            <button @click="showModal = true" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 group">
                <Plus class="w-5 h-5" />
                <span>Nouvelle demande</span>
            </button>
        </div>

        <!-- Navigation Tabs -->
        <div v-if="isManager" class="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit transition-colors">
            <button @click="activeTab = 'mes_conges'" :class="activeTab === 'mes_conges' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'" class="px-6 py-2 rounded-xl text-sm font-black transition-all">Mes Congés</button>
            <button @click="activeTab = 'validation'" :class="activeTab === 'validation' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'" class="px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2">
                Validation
                <span v-if="allDemandes.filter(d => d.statut === 'en_attente').length > 0" class="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>
        </div>

        <!-- VIEW: MES CONGÉS -->
        <div v-if="activeTab === 'mes_conges'" class="space-y-10 animate-in fade-in duration-500">
            <!-- Soldes Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div v-for="(solde, index) in soldes" :key="solde.id" 
                     :class="[
                         'p-8 rounded-[2.5rem] border border-white/20 shadow-xl text-white relative overflow-hidden group transition-all hover:scale-[1.02]',
                         index === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-100 dark:shadow-none' : 
                         index === 1 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-100 dark:shadow-none' : 
                         'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-100 dark:shadow-none'
                     ]">
                    <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform">
                        <PieChart class="w-32 h-32" />
                    </div>
                    <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                        <PieChart class="w-6 h-6 text-white" />
                    </div>
                    <p class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1">{{ solde.type_conge.nom }}</p>
                    <h2 class="text-4xl font-black text-white tracking-tighter">{{ solde.jours_restants }} <span class="text-lg text-white/60 font-bold">jours</span></h2>
                </div>
            </div>

            <!-- Mes Demandes Table -->
            <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
                            <History class="w-5 h-5" />
                        </div>
                        <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Mon Historique</h2>
                    </div>
                    <div class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                        {{ filteredMyDemandes.length }} demande(s)
                    </div>
                </div>
                <div class="px-8 pb-6 pt-0 flex flex-col md:flex-row md:items-center gap-4 mt-6">
                    <div class="relative flex-1 max-w-md group">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input v-model="mySearch" type="text" placeholder="Rechercher dans l’historique…" class="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl w-full text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                    </div>
                    <div class="relative">
                        <Filter class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <select v-model="myStatus" class="pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none min-w-[220px]">
                            <option value="tous">Tous les statuts</option>
                            <option value="en_attente">En attente</option>
                            <option value="approuve">Approuvé</option>
                            <option value="refuse">Refusé</option>
                        </select>
                        <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black transition-colors">
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période d'absence</th>
                                <th class="px-8 py-5">Durée</th>
                                <th class="px-8 py-5">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
                            <tr v-for="demande in filteredMyDemandes" :key="demande.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group">
                                <td class="px-8 py-6">
                                    <div class="flex flex-col">
                                        <span class="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ demande.type_conge?.nom }}</span>
                                        <span class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate max-w-[200px] transition-colors">{{ demande.motif || "Aucun motif précisé" }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <div class="inline-flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 transition-colors">
                                        <span>{{ formatDate(demande.date_debut) }}</span>
                                        <ArrowRight class="w-3 h-3 text-slate-300 dark:text-slate-600" />
                                        <span>{{ formatDate(demande.date_fin) }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <span class="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg transition-colors">{{ demande.jours_demandes }} j</span>
                                </td>
                                <td class="px-8 py-6">
                                    <span :class="getStatusClass(demande.statut)" class="px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm dark:bg-opacity-10 transition-colors">
                                        {{ demande.statut.replace('_', ' ') }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="!isLoading && filteredMyDemandes.length === 0">
                                <td colspan="4" class="px-8 py-16 text-center">
                                    <div class="flex flex-col items-center gap-3 opacity-20">
                                        <CalendarIcon class="w-12 h-12" />
                                        <p class="font-black text-xs uppercase tracking-widest">Aucun historique de congés</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- VIEW: VALIDATION (MANAGER) -->
        <div v-else class="space-y-6 animate-in slide-in-from-right duration-500">
            <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <ShieldCheck class="w-5 h-5 text-indigo-500 transition-colors" />
                        <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Demandes à traiter</h2>
                    </div>
                </div>
                <div class="px-8 pb-6 pt-0 mt-6">
                    <div class="relative max-w-md group">
                        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input v-model="validationSearch" type="text" placeholder="Rechercher un collaborateur…" class="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl w-full text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all" />
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black transition-colors">
                                <th class="px-8 py-5">Collaborateur</th>
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période</th>
                                <th class="px-8 py-5">Jours</th>
                                <th class="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors">
                            <tr v-for="d in filteredValidationDemandes" :key="d.id" class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group">
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px] transition-colors">
                                            {{ d.utilisateur?.prenom[0] }}{{ d.utilisateur?.nom[0] }}
                                        </div>
                                        <span class="text-sm font-bold text-slate-900 dark:text-slate-100 transition-colors">{{ d.utilisateur?.prenom }} {{ d.utilisateur?.nom }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <p class="text-sm font-black text-slate-900 dark:text-slate-100 transition-colors">{{ d.type_conge?.nom }}</p>
                                    <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase italic transition-colors">{{ d.motif }}</p>
                                </td>
                                <td class="px-8 py-6 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">
                                    {{ formatDate(d.date_debut) }} - {{ formatDate(d.date_fin) }}
                                </td>
                                <td class="px-8 py-6 text-xs font-black text-slate-900 dark:text-slate-100 transition-colors">{{ d.jours_demandes }} j</td>
                                <td class="px-8 py-6 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button @click="approveLeave(d.id)" class="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all" title="Approuver"><Check class="w-5 h-5" /></button>
                                        <button @click="refuseLeave(d.id)" class="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all" title="Refuser"><Ban class="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="filteredValidationDemandes.length === 0">
                                <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs transition-colors">Tout est à jour ! Aucune demande en attente.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- MODAL -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xl transition-all" @click="showModal = false"></div>
                <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 animate-in zoom-in duration-300 transition-colors">
                    <h2 class="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-8 transition-colors">Nouvelle Demande</h2>
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Type de congé</label>
                            <select v-model="newDemande.type_conge_id" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all">
                                <option :value="null" disabled>Sélectionner un type...</option>
                                <option v-for="t in types" :key="t.id" :value="t.id">{{ t.nom }}</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Début</label>
                                <input type="date" v-model="newDemande.date_debut" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Fin</label>
                                <input type="date" v-model="newDemande.date_fin" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 transition-all" />
                            </div>
                        </div>
                        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-5 py-4 transition-colors">
                            <div class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">Durée estimée</div>
                            <div class="text-sm font-black text-slate-900 dark:text-slate-100">{{ calculatedDays }} jour(s)</div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors">Motif</label>
                            <textarea v-model="newDemande.motif" class="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none font-bold text-slate-700 dark:text-slate-200 h-24 resize-none transition-all" placeholder="Raison de l'absence..."></textarea>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button @click="showModal = false" class="flex-1 py-4 text-slate-500 dark:text-slate-400 font-black hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
                            <button @click="createDemande" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs" :disabled="calculatedDays <= 0" :class="calculatedDays <= 0 ? 'opacity-60 cursor-not-allowed' : ''">Soumettre</button>
                        </div>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.animate-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
