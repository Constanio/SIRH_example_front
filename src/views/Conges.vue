<script setup>
import { ref, onMounted, computed, watch } from "vue";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import {
    Plus, Clock, CheckCircle2, X, ChevronRight, Info, PieChart,
    History, CalendarDays, FileText, ArrowRight, Calendar as CalendarIcon,
    ShieldCheck, Check, Ban
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

const createDemande = async () => {
    try {
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
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">Gestion des Congés</h1>
                <p class="text-slate-500 font-medium">Planifiez vos absences et validez celles de vos équipes.</p>
            </div>
            <button @click="showModal = true" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 group">
                <Plus class="w-5 h-5" />
                <span>Nouvelle demande</span>
            </button>
        </div>

        <!-- Navigation Tabs -->
        <div v-if="isManager" class="flex p-1.5 bg-slate-100 rounded-2xl w-fit">
            <button @click="activeTab = 'mes_conges'" :class="activeTab === 'mes_conges' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-6 py-2 rounded-xl text-sm font-black transition-all">Mes Congés</button>
            <button @click="activeTab = 'validation'" :class="activeTab === 'validation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2">
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
                         index === 0 ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-100' : 
                         index === 1 ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-100' : 
                         'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-100'
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
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div class="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <History class="w-5 h-5" />
                        </div>
                        <h2 class="text-xl font-black text-slate-900 tracking-tight">Mon Historique</h2>
                    </div>
                    <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {{ demandes.length }} demandes au total
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période d'absence</th>
                                <th class="px-8 py-5">Durée</th>
                                <th class="px-8 py-5">Statut</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="demande in demandes" :key="demande.id" class="hover:bg-slate-50/30 transition-all group">
                                <td class="px-8 py-6">
                                    <div class="flex flex-col">
                                        <span class="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{{ demande.type_conge?.nom }}</span>
                                        <span class="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{{ demande.motif || "Aucun motif précisé" }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <div class="inline-flex items-center px-4 py-2 bg-slate-50 rounded-2xl gap-3 text-xs font-bold text-slate-600 border border-slate-100">
                                        <span>{{ formatDate(demande.date_debut) }}</span>
                                        <ArrowRight class="w-3 h-3 text-slate-300" />
                                        <span>{{ formatDate(demande.date_fin) }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <span class="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{{ demande.jours_demandes }} j</span>
                                </td>
                                <td class="px-8 py-6">
                                    <span :class="getStatusClass(demande.statut)" class="px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        {{ demande.statut.replace('_', ' ') }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="demandes.length === 0">
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
            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div class="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <ShieldCheck class="w-5 h-5 text-indigo-500" />
                        <h2 class="text-xl font-black text-slate-900 tracking-tight">Demandes à traiter</h2>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                                <th class="px-8 py-5">Collaborateur</th>
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période</th>
                                <th class="px-8 py-5">Jours</th>
                                <th class="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="d in allDemandes.filter(req => req.statut === 'en_attente')" :key="d.id" class="hover:bg-slate-50/30 transition-all group">
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                                            {{ d.utilisateur?.prenom[0] }}{{ d.utilisateur?.nom[0] }}
                                        </div>
                                        <span class="text-sm font-bold text-slate-900">{{ d.utilisateur?.prenom }} {{ d.utilisateur?.nom }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <p class="text-sm font-black text-slate-900">{{ d.type_conge?.nom }}</p>
                                    <p class="text-[10px] text-slate-400 font-bold uppercase italic">{{ d.motif }}</p>
                                </td>
                                <td class="px-8 py-6 text-xs font-bold text-slate-600">
                                    {{ formatDate(d.date_debut) }} - {{ formatDate(d.date_fin) }}
                                </td>
                                <td class="px-8 py-6 text-xs font-black text-slate-900">{{ d.jours_demandes }} j</td>
                                <td class="px-8 py-6 text-right">
                                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button @click="approveLeave(d.id)" class="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all" title="Approuver"><Check class="w-5 h-5" /></button>
                                        <button @click="refuseLeave(d.id)" class="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all" title="Refuser"><Ban class="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="allDemandes.filter(req => req.statut === 'en_attente').length === 0">
                                <td colspan="5" class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Tout est à jour ! Aucune demande en attente.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- MODAL (Identique mais avec un style épuré) -->
        <Teleport to="body">
            <div v-if="showModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" @click="showModal = false"></div>
                <div class="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative z-10 animate-in zoom-in duration-300">
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-8">Nouvelle Demande</h2>
                    <div class="space-y-6">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type de congé</label>
                            <select v-model="newDemande.type_conge_id" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700">
                                <option :value="null" disabled>Sélectionner un type...</option>
                                <option v-for="t in types" :key="t.id" :value="t.id">{{ t.nom }}</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Début</label>
                                <input type="date" v-model="newDemande.date_debut" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fin</label>
                                <input type="date" v-model="newDemande.date_fin" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700" />
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motif</label>
                            <textarea v-model="newDemande.motif" class="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 h-24 resize-none" placeholder="Raison de l'absence..."></textarea>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button @click="showModal = false" class="flex-1 py-4 text-slate-500 font-black hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest text-xs">Annuler</button>
                            <button @click="createDemande" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Soumettre ({{ calculatedDays }}j)</button>
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
