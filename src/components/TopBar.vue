<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import { 
  Search, Bell, Moon, Sun, ChevronDown, 
  User, Settings, LogOut, Command, Sparkles
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();
const showUserMenu = ref(false);

const logout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <header class="h-20 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-[50] transition-colors duration-300">
    <!-- Left: Search Bar -->
    <div class="flex-1 max-w-xl">
      <div class="relative group">
        <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search class="w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Rechercher un collaborateur, un document..." 
          class="w-full pl-11 pr-16 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all"
        />
        <div class="absolute inset-y-0 right-4 flex items-center gap-1 pointer-events-none">
          <kbd class="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-[10px] font-black text-slate-400 dark:text-slate-500 shadow-sm">
            <Command class="w-2.5 h-2.5 mb-0.5 inline" /> K
          </kbd>
        </div>
      </div>
    </div>

    <!-- Right: Actions & Profile -->
    <div class="flex items-center gap-6">
      <!-- Quick Actions -->
      <div class="flex items-center gap-2 pr-6 border-r border-slate-100 dark:border-slate-800">
        <button class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all relative">
          <Bell class="w-5 h-5" />
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>
        <button @click="theme.toggleTheme" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all" :title="theme.isDark ? 'Passer au mode clair' : 'Passer au mode sombre'">
          <Sun v-if="theme.isDark" class="w-5 h-5 text-amber-500" />
          <Moon v-else class="w-5 h-5" />
        </button>
      </div>

      <!-- User Profile -->
      <div class="relative">
        <button 
          @click="showUserMenu = !showUserMenu"
          class="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
        >
          <div class="relative">
            <div class="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
              {{ auth.user?.prenom[0] }}{{ auth.user?.nom[0] }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full"></div>
          </div>
          
          <div class="text-left hidden md:block">
            <p class="text-xs font-black text-slate-900 dark:text-slate-100 leading-none mb-1">{{ auth.user?.prenom }} {{ auth.user?.nom }}</p>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ auth.user?.role }}</p>
          </div>
          
          <ChevronDown class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform" :class="{ 'rotate-180': showUserMenu }" />
        </button>

        <!-- Dropdown Menu -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div v-if="showUserMenu" class="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-950 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 py-3 z-[60]">
            <div class="px-6 py-4 border-b border-slate-50 dark:border-slate-800 mb-2">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session active</p>
              <p class="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{{ auth.user?.email }}</p>
            </div>
            
            <div class="px-2 space-y-1">
              <button @click="router.push('/profil')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                <User class="w-4 h-4" />
                Mon Profil
              </button>
              <button class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                <Sparkles class="w-4 h-4" />
                Nouveautés
              </button>
              <button class="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all">
                <Settings class="w-4 h-4" />
                Compte
              </button>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 px-2">
              <button @click="logout" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                <LogOut class="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Click outside to close menu -->
    <div v-if="showUserMenu" @click="showUserMenu = false" class="fixed inset-0 z-[55]"></div>
  </header>
</template>

<style scoped>
/* Ajout d'une ombre douce au défilement si nécessaire via JS ou CSS sticky */
header {
  transition: all 0.3s ease;
}
</style>
