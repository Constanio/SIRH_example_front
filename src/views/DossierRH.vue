<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";
import { useToastStore } from "../stores/toast";
import { FileText, Upload, User, Briefcase, Calendar, Loader2 } from "lucide-vue-next";

const route = useRoute();
const toast = useToastStore();

const userId = computed(() => Number(route.params.id));

const isLoading = ref(true);
const user = ref(null);
const contrats = ref([]);
const documents = ref([]);

const uploadForm = ref({
  type: "contrat",
  nom: "",
  description: "",
  file: null,
});

const isUploading = ref(false);
const uploadErrors = ref({ nom: "", file: "" });
const clearUploadError = (field) => {
  uploadErrors.value[field] = "";
};

const fetchAll = async () => {
  isLoading.value = true;
  try {
    const [uRes, cRes, dRes] = await Promise.all([
      api.get(`/utilisateurs/${userId.value}`),
      api.get(`/contrats?utilisateur_id=${userId.value}`),
      api.get(`/utilisateurs/${userId.value}/documents`),
    ]);
    user.value = uRes.data;
    contrats.value = cRes.data;
    documents.value = dRes.data;
  } catch (e) {
    toast.error("Impossible de charger le dossier RH");
  } finally {
    isLoading.value = false;
  }
};

const onPickFile = (e) => {
  uploadForm.value.file = e.target.files?.[0] ?? null;
};

const uploadDoc = async () => {
  isUploading.value = true;
  try {
    if (!uploadForm.value.file) {
      toast.error("Choisis un fichier");
      return;
    }
    const fd = new FormData();
    fd.append("file", uploadForm.value.file);
    fd.append("type", uploadForm.value.type);
    if (uploadForm.value.nom) fd.append("nom", uploadForm.value.nom);
    if (uploadForm.value.description) fd.append("description", uploadForm.value.description);

    await api.post(`/utilisateurs/${userId.value}/documents`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Document ajouté");
    uploadForm.value = { type: "contrat", nom: "", description: "", file: null };
    fetchAll();
  } catch (e) {
    toast.error("Upload impossible");
  } finally {
    isUploading.value = false;
  }
};

onMounted(fetchAll);
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-1">
        <h1 class="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
          Dossier RH
        </h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium transition-colors">
          Contrats et documents administratifs de l’employé.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-10">
      <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement…</p>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors">
              <User class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight transition-colors">
                {{ user?.prenom }} {{ user?.nom }}
              </h2>
              <p class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                {{ user?.matricule }} • {{ user?.email }}
              </p>
            </div>
          </div>
        </div>

        <div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Contrats -->
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 transition-colors">
            <div class="flex items-center gap-3 mb-6">
              <Briefcase class="w-5 h-5 text-indigo-500" />
              <h3 class="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 transition-colors">Contrats</h3>
            </div>
            <div v-if="contrats.length === 0" class="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Aucun contrat
            </div>
            <div v-else class="space-y-3">
              <div v-for="c in contrats" :key="c.id" class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 transition-colors">
                <div class="flex items-center justify-between gap-4">
                  <div class="min-w-0">
                    <p class="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{{ (c.type || 'autre').toUpperCase() }} • {{ c.statut }}</p>
                    <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                      <Calendar class="inline w-3 h-3 -mt-0.5 mr-1" />
                      {{ new Date(c.date_debut).toLocaleDateString() }}
                      <span v-if="c.date_fin"> → {{ new Date(c.date_fin).toLocaleDateString() }}</span>
                    </p>
                  </div>
                  <a v-if="c.fichier_url" :href="c.fichier_url" target="_blank" class="text-xs font-black text-indigo-600 hover:underline">Ouvrir</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-700 transition-colors">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-3">
                <FileText class="w-5 h-5 text-indigo-500" />
                <h3 class="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 transition-colors">Documents</h3>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden">
                <div class="absolute -top-8 -right-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Upload class="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p class="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                      Ajouter un document
                    </p>
                    <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Importez un fichier administratif
                    </p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Type
                      </label>
                      <select v-model="uploadForm.type" class="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 cursor-pointer">
                        <option value="contrat">Contrat</option>
                        <option value="piece_identite">Pièce d’identité</option>
                        <option value="attestation">Attestation</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div class="space-y-2">
                      <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                        Nom
                      </label>
                      <input v-model="uploadForm.nom" @focus="clearUploadError('nom')" placeholder="Nom du document" class="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 placeholder:text-slate-400" />
                      <p v-if="uploadErrors.nom" class="text-red-500 text-[10px] font-bold">{{ uploadErrors.nom }}</p>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
                      Description
                    </label>
                    <textarea v-model="uploadForm.description" placeholder="Description optionnelle..." class="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 focus:bg-white dark:focus:bg-slate-800 outline-none font-medium text-slate-700 dark:text-slate-200 transition-all duration-200 h-20 resize-none placeholder:text-slate-400"></textarea>
                  </div>
                  <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                    <div class="flex-1 space-y-2">
                      <label class="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                        Fichier
                      </label>
                      <input type="file" @change="onPickFile; clearUploadError('file')" class="w-full text-xs font-medium text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 file:transition-all file:cursor-pointer" />
                      <p v-if="uploadErrors.file" class="text-red-500 text-[10px] font-bold">{{ uploadErrors.file }}</p>
                    </div>
                    <button @click="uploadDoc" :disabled="isUploading" class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 uppercase tracking-wider text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg shrink-0">
                      <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
                      <Upload v-else class="w-4 h-4" />
                      {{ isUploading ? "Envoi..." : "Uploader" }}
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="documents.length === 0" class="text-slate-400 text-xs font-bold uppercase tracking-widest">
                Aucun document
              </div>
              <div v-else class="space-y-3">
                <div v-for="d in documents" :key="d.id" class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 transition-colors">
                  <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                      <p class="text-sm font-black text-slate-900 dark:text-slate-100 truncate">{{ d.nom }}</p>
                      <p class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        {{ d.type || "document" }} • {{ new Date(d.uploaded_at).toLocaleString() }}
                      </p>
                    </div>
                    <a :href="d.fichier_url" target="_blank" class="text-xs font-black text-indigo-600 hover:underline">Ouvrir</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

