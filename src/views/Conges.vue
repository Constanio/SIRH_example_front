<script setup>
import { ref, onMounted, computed, watch } from "vue";
import api from "../services/api";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import {
    Plus,
    PieChart,
    History,
    CalendarDays,
    FileText,
    ArrowRight,
    Calendar as CalendarIcon,
    ShieldCheck,
    Check,
    Ban,
    Search,
    Filter,
    ChevronDown,
    Loader2,
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
const isSubmitting = ref(false);

const isManager = computed(() =>
    ["admin", "rh", "manager"].includes(auth.user?.role),
);

const newDemande = ref({
    type_conge_id: null,
    date_debut: "",
    date_fin: "",
    motif: "",
    jours_demandes: 0,
});

const demandeErrors = ref({ motif: "" });
const clearDemandeError = (field) => {
    demandeErrors.value[field] = "";
};

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
        .filter((d) =>
            myStatus.value === "tous" ? true : d.statut === myStatus.value,
        )
        .filter((d) => {
            if (!q) return true;
            const hay = [
                d.type_conge?.nom,
                d.motif,
                d.statut,
                formatDate(d.date_debut),
                formatDate(d.date_fin),
            ]
                .map(normalized)
                .join(" ");
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
            ]
                .map(normalized)
                .join(" ");
            return hay.includes(q);
        });
});

const createDemande = async () => {
    try {
        isSubmitting.value = true;
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
    } finally {
        isSubmitting.value = false;
    }
};

const getStatusClass = (status) => {
    switch (status) {
        case "en_attente":
            return "bg-amber-50 text-amber-600 border-amber-100";
        case "approuve":
            return "bg-emerald-50 text-emerald-600 border-emerald-100";
        case "refuse":
            return "bg-rose-50 text-rose-600 border-rose-100";
        default:
            return "bg-slate-50 text-slate-600";
    }
};

const formatDate = (dateStr) =>
    dateStr ? format(new Date(dateStr), "dd MMM yyyy", { locale: fr }) : "-";

onMounted(fetchData);
</script>

<template>
    <div class="space-y-10">
        <!-- Page Header -->
        <div
            class="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
            <div class="space-y-1">
                <h1
                    class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors"
                >
                    Gestion des Congés
                </h1>
                <p
                    class="text-slate-500 dark:text-slate-400 font-medium transition-colors"
                >
                    Planifiez vos absences et validez celles de vos équipes.
                </p>
            </div>
            <button
                @click="showModal = true"
                class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-2 group"
            >
                <Plus class="w-5 h-5" />
                <span>Nouvelle demande</span>
            </button>
        </div>

        <!-- Navigation Tabs -->
        <div
            v-if="isManager"
            class="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit transition-colors"
        >
            <button
                @click="activeTab = 'mes_conges'"
                :class="
                    activeTab === 'mes_conges'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                "
                class="px-6 py-2 rounded-xl text-sm font-black transition-all"
            >
                Mes Congés
            </button>
            <button
                @click="activeTab = 'validation'"
                :class="
                    activeTab === 'validation'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                "
                class="px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2"
            >
                Validation
                <span
                    v-if="
                        allDemandes.filter((d) => d.statut === 'en_attente')
                            .length > 0
                    "
                    class="w-2 h-2 bg-rose-500 rounded-full animate-pulse"
                ></span>
            </button>
        </div>

        <!-- VIEW: MES CONGÉS -->
        <div
            v-if="activeTab === 'mes_conges'"
            class="space-y-10 animate-in fade-in duration-500"
        >
            <!-- Soldes Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div
                    v-for="(solde, index) in soldes"
                    :key="solde.id"
                    :class="[
                        'p-8 rounded-[2.5rem] border border-white/20 shadow-xl text-white relative overflow-hidden group transition-all hover:scale-[1.02]',
                        index === 0
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-100 dark:shadow-none'
                            : index === 1
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-100 dark:shadow-none'
                              : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-100 dark:shadow-none',
                    ]"
                >
                    <div
                        class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform"
                    >
                        <PieChart class="w-32 h-32" />
                    </div>
                    <div
                        class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6"
                    >
                        <PieChart class="w-6 h-6 text-white" />
                    </div>
                    <p
                        class="text-[10px] font-black text-white/80 uppercase tracking-widest mb-1"
                    >
                        {{ solde.type_conge.nom }}
                    </p>
                    <h2 class="text-4xl font-black text-white tracking-tighter">
                        {{ solde.jours_restants }}
                        <span class="text-lg text-white/60 font-bold"
                            >jours</span
                        >
                    </h2>
                </div>
            </div>

            <!-- Mes Demandes Table -->
            <div
                class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
                <div
                    class="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between"
                >
                    <div class="flex items-center gap-4">
                        <div
                            class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
                        >
                            <History class="w-5 h-5" />
                        </div>
                        <h2
                            class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors"
                        >
                            Mon Historique
                        </h2>
                    </div>
                    <div
                        class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors"
                    >
                        {{ filteredMyDemandes.length }} demande(s)
                    </div>
                </div>
                <div
                    class="px-8 pb-6 pt-0 flex flex-col md:flex-row md:items-center gap-4 mt-6"
                >
                    <div class="relative flex-1 max-w-md group">
                        <Search
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"
                        />
                        <input
                            v-model="mySearch"
                            type="text"
                            placeholder="Rechercher dans l’historique…"
                            class="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl w-full text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all"
                        />
                    </div>
                    <div class="relative cursor-pointer">
                        <Filter
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
                        />
                        <select
                            v-model="myStatus"
                            class="pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-200 outline-none transition-all appearance-none min-w-[220px]"
                        >
                            <option value="tous">Tous les statuts</option>
                            <option value="en_attente">En attente</option>
                            <option value="approuve">Approuvé</option>
                            <option value="refuse">Refusé</option>
                        </select>
                        <ChevronDown
                            class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                        />
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr
                                class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black transition-colors"
                            >
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période d'absence</th>
                                <th class="px-8 py-5">Durée</th>
                                <th class="px-8 py-5">Statut</th>
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors"
                        >
                            <tr
                                v-for="demande in filteredMyDemandes"
                                :key="demande.id"
                                class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group"
                            >
                                <td class="px-8 py-6">
                                    <div class="flex flex-col">
                                        <span
                                            class="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                            >{{ demande.type_conge?.nom }}</span
                                        >
                                        <span
                                            class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate max-w-[200px] transition-colors"
                                            >{{
                                                demande.motif ||
                                                "Aucun motif précisé"
                                            }}</span
                                        >
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <div
                                        class="inline-flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 transition-colors"
                                    >
                                        <span>{{
                                            formatDate(demande.date_debut)
                                        }}</span>
                                        <ArrowRight
                                            class="w-3 h-3 text-slate-300 dark:text-slate-600"
                                        />
                                        <span>{{
                                            formatDate(demande.date_fin)
                                        }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <span
                                        class="text-xs font-black text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg transition-colors"
                                        >{{ demande.jours_demandes }} j</span
                                    >
                                </td>
                                <td class="px-8 py-6">
                                    <span
                                        :class="getStatusClass(demande.statut)"
                                        class="px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm dark:bg-opacity-10 transition-colors"
                                    >
                                        {{ demande.statut.replace("_", " ") }}
                                    </span>
                                </td>
                            </tr>
                            <tr
                                v-if="
                                    !isLoading &&
                                    filteredMyDemandes.length === 0
                                "
                            >
                                <td colspan="4" class="px-8 py-16 text-center">
                                    <div
                                        class="flex flex-col items-center gap-3 opacity-20"
                                    >
                                        <CalendarIcon class="w-12 h-12" />
                                        <p
                                            class="font-black text-xs uppercase tracking-widest"
                                        >
                                            Aucun historique de congés
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- VIEW: VALIDATION (MANAGER) -->
        <div
            v-else
            class="space-y-6 animate-in slide-in-from-right duration-500"
        >
            <div
                class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
                <div
                    class="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center"
                >
                    <div class="flex items-center gap-4">
                        <ShieldCheck
                            class="w-5 h-5 text-indigo-500 transition-colors"
                        />
                        <h2
                            class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors"
                        >
                            Demandes à traiter
                        </h2>
                    </div>
                </div>
                <div class="px-8 pb-6 pt-0 mt-6">
                    <div class="relative max-w-md group">
                        <Search
                            class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors"
                        />
                        <input
                            v-model="validationSearch"
                            type="text"
                            placeholder="Rechercher un collaborateur…"
                            class="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl w-full text-sm font-bold text-slate-700 dark:text-slate-200 outline-none transition-all"
                        />
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr
                                class="bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black transition-colors"
                            >
                                <th class="px-8 py-5">Collaborateur</th>
                                <th class="px-8 py-5">Type / Motif</th>
                                <th class="px-8 py-5">Période</th>
                                <th class="px-8 py-5">Jours</th>
                                <th class="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody
                            class="divide-y divide-slate-50 dark:divide-slate-800 transition-colors"
                        >
                            <tr
                                v-for="d in filteredValidationDemandes"
                                :key="d.id"
                                class="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group"
                            >
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-[10px] transition-colors"
                                        >
                                            {{ d.utilisateur?.prenom[0]
                                            }}{{ d.utilisateur?.nom[0] }}
                                        </div>
                                        <span
                                            class="text-sm font-bold text-slate-900 dark:text-slate-100 transition-colors"
                                            >{{ d.utilisateur?.prenom }}
                                            {{ d.utilisateur?.nom }}</span
                                        >
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <p
                                        class="text-sm font-black text-slate-900 dark:text-slate-100 transition-colors"
                                    >
                                        {{ d.type_conge?.nom }}
                                    </p>
                                    <p
                                        class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase italic transition-colors"
                                    >
                                        {{ d.motif }}
                                    </p>
                                </td>
                                <td
                                    class="px-8 py-6 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors"
                                >
                                    {{ formatDate(d.date_debut) }} -
                                    {{ formatDate(d.date_fin) }}
                                </td>
                                <td
                                    class="px-8 py-6 text-xs font-black text-slate-900 dark:text-slate-100 transition-colors"
                                >
                                    {{ d.jours_demandes }} j
                                </td>
                                <td class="px-8 py-6 text-right">
                                    <div class="flex justify-end gap-2">
                                        <button
                                            @click="approveLeave(d.id)"
                                            class="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all"
                                            title="Approuver"
                                        >
                                            <Check class="w-5 h-5" />
                                        </button>
                                        <button
                                            @click="refuseLeave(d.id)"
                                            class="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
                                            title="Refuser"
                                        >
                                            <Ban class="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="filteredValidationDemandes.length === 0">
                                <td
                                    colspan="5"
                                    class="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs transition-colors"
                                >
                                    Tout est à jour ! Aucune demande en attente.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- MODAL -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div
                    v-if="showModal"
                    class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                >
                    <!-- Overlay -->
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-800/40 dark:from-slate-950/80 dark:via-slate-950/60 dark:to-slate-900/50 backdrop-blur-md transition-all"
                        @click="showModal = false"
                    ></div>

                    <!-- Modal Container -->
                    <div class="relative w-full max-w-lg">
                        <!-- Decorative gradient orb -->
                        <div
                            class="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
                        ></div>
                        <div
                            class="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
                        ></div>

                        <!-- Modal Content -->
                        <div
                            class="bg-white dark:bg-slate-900 rounded-3xl w-full shadow-2xl relative z-10 transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-4"
                        >
                            <!-- Header avec icône et séparateur -->
                            <div
                                class="relative px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800"
                            >
                                <div class="flex items-center gap-3">
                                    <div
                                        class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
                                    >
                                        <svg
                                            class="w-5 h-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M12 4v16m8-8H4"
                                            ></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h2
                                            class="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                                        >
                                            Nouvelle demande
                                        </h2>
                                        <p
                                            class="text-xs text-slate-500 dark:text-slate-400 mt-0.5"
                                        >
                                            Remplissez les informations
                                            ci-dessous
                                        </p>
                                    </div>
                                </div>
                                <button
                                    @click="showModal = false"
                                    class="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    <svg
                                        class="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        ></path>
                                    </svg>
                                </button>
                            </div>

                            <!-- Formulaire -->
                            <div class="p-8 space-y-6">
                                <!-- Type de congé -->
                                <div class="space-y-2">
                                    <label
                                        class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <svg
                                            class="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
                                            ></path>
                                        </svg>
                                        Type de congé
                                    </label>
                                    <select
                                        v-model="newDemande.type_conge_id"
                                        class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600"
                                    >
                                        <option :value="null" disabled>
                                            Sélectionner un type...
                                        </option>
                                        <option
                                            v-for="t in types"
                                            :key="t.id"
                                            :value="t.id"
                                        >
                                            {{ t.nom }}
                                        </option>
                                    </select>
                                </div>

                                <!-- Dates -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <label
                                            class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"
                                        >
                                            <svg
                                                class="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                                                ></path>
                                            </svg>
                                            Date de début
                                        </label>
                                        <input
                                            type="date"
                                            v-model="newDemande.date_debut"
                                            class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <label
                                            class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"
                                        >
                                            <svg
                                                class="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                                                ></path>
                                            </svg>
                                            Date de fin
                                        </label>
                                        <input
                                            type="date"
                                            v-model="newDemande.date_fin"
                                            class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200"
                                        />
                                    </div>
                                </div>

                                <!-- Durée estimée -->
                                <div
                                    class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div class="flex items-center gap-2">
                                            <svg
                                                class="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                ></path>
                                            </svg>
                                            <span
                                                class="text-sm font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide"
                                                >Durée estimée</span
                                            >
                                        </div>
                                        <div class="flex items-baseline gap-1">
                                            <span
                                                class="text-3xl font-bold text-indigo-700 dark:text-indigo-300"
                                                >{{ calculatedDays }}</span
                                            >
                                            <span
                                                class="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                                                >jour(s)</span
                                            >
                                        </div>
                                    </div>
                                </div>

                                <!-- Motif -->
                                <div class="space-y-2">
                                    <label
                                        class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <svg
                                            class="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M4 6h16M4 12h16M4 18h7"
                                            ></path>
                                        </svg>
                                        Motif de l'absence
                                        <span
                                            class="text-[10px] font-normal text-slate-400"
                                            >(optionnel)</span
                                        >
                                    </label>
                                    <textarea
                                        v-model="newDemande.motif"
                                        @focus="clearDemandeError('motif')"
                                        maxlength="1000"
                                        rows="3"
                                        class="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 resize-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="Raison de l'absence..."
                                    ></textarea>
                                    <div class="flex justify-end">
                                        <span class="text-[10px] text-slate-400"
                                            >{{
                                                newDemande.motif?.length || 0
                                            }}/1000</span
                                        >
                                    </div>
                                </div>

                                <!-- Actions -->
                                <div
                                    class="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800"
                                >
                                    <button
                                        @click="showModal = false"
                                        class="flex-1 py-3.5 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                                    >
                                        <svg
                                            class="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12"
                                            ></path>
                                        </svg>
                                        Annuler
                                    </button>
                                    <button
                                        @click="createDemande"
                                        :disabled="
                                            isSubmitting || calculatedDays <= 0
                                        "
                                        class="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                                    >
                                        <span
                                            v-if="isSubmitting"
                                            class="flex items-center gap-2"
                                        >
                                            <svg
                                                class="w-4 h-4 animate-spin"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                ></path>
                                            </svg>
                                            Envoi...
                                        </span>
                                        <span
                                            v-else
                                            class="flex items-center gap-2"
                                        >
                                            <svg
                                                class="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="M5 13l4 4L19 7"
                                                ></path>
                                            </svg>
                                            Soumettre la demande
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
