<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { User, Mail, Shield, Briefcase, Hash, Calendar } from 'lucide-vue-next';

const profile = ref(null);

onMounted(async () => {
  try {
    const res = await api.get('/auth/me');
    profile.value = res.data;
  } catch (err) {
    console.error("Erreur profil", err);
  }
});
</script>

<template>
  <div v-if="profile" class="max-w-4xl mx-auto space-y-8 animate-fade-in">
    <div class="flex items-center space-x-6">
      <div class="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-100">
        {{ profile.prenom[0] }}{{ profile.nom[0] }}
      </div>
      <div>
        <h1 class="text-3xl font-bold text-slate-900">{{ profile.prenom }} {{ profile.nom }}</h1>
        <p class="text-slate-500 font-medium">{{ profile.poste?.titre || 'Poste non défini' }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 class="text-lg font-bold text-slate-900 mb-4">Informations personnelles</h3>
        
        <div class="flex items-center space-x-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Mail class="w-5 h-5" /></div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Email professionnel</p>
            <p class="text-slate-700 font-medium">{{ profile.email }}</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Hash class="w-5 h-5" /></div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Matricule</p>
            <p class="text-slate-700 font-medium font-mono text-sm">{{ profile.matricule }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 class="text-lg font-bold text-slate-900 mb-4">Poste & Organisation</h3>

        <div class="flex items-center space-x-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Briefcase class="w-5 h-5" /></div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Département</p>
            <p class="text-slate-700 font-medium">{{ profile.departement?.nom || 'Non assigné' }}</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Shield class="w-5 h-5" /></div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Rôle système</p>
            <p class="text-slate-700 font-medium capitalize">{{ profile.role }}</p>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <div class="p-2 bg-slate-50 rounded-lg text-slate-400"><Calendar class="w-5 h-5" /></div>
          <div>
            <p class="text-xs font-bold text-slate-400 uppercase">Date d'embauche</p>
            <p class="text-slate-700 font-medium">{{ new Date(profile.date_embauche).toLocaleDateString() }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
