<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import {
    LayoutDashboard,
    Users,
    Calendar,
    Building2,
    SlidersHorizontal,
    Banknote,
    ReceiptText,
    ClipboardCheck,
    LogOut,
    Settings,
    UserCircle,
    ChevronRight,
} from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const logout = () => {
    auth.logout();
    router.push("/login");
};

const menuItems = [
    { name: "Tableau de Bord", path: "/dashboard", icon: LayoutDashboard },
    { name: "Employés", path: "/employes", icon: Users },
    { name: "Congés", path: "/conges", icon: Calendar },
    { name: "Organisation", path: "/organisation", icon: Building2 },
];

const secondaryItems = [
    { name: "Mon Profil", path: "/profil", icon: UserCircle },
    { name: "Types de congés", path: "/types-conges", icon: SlidersHorizontal },
    { name: "Salaires", path: "/salaires", icon: Banknote },
    { name: "Paie", path: "/paie", icon: ReceiptText },
    { name: "Évaluations", path: "/evaluations", icon: ClipboardCheck },
    { name: "Paramètres", path: "/parametres", icon: Settings },
];
</script>

<template>
    <div class="h-full flex flex-col bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 shadow-sm">
        <!-- Logo Section -->
        <div class="h-24 flex items-center px-8">
            <div class="flex items-center gap-3 group cursor-pointer" @click="router.push('/')">
                <div class="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform duration-300">
                    <LayoutDashboard class="w-6 h-6 text-white" />
                </div>
                <div class="flex flex-col">
                    <span class="text-lg font-black tracking-tighter text-slate-900 dark:text-slate-100 leading-none">SIRH FLOW</span>
                    <span class="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">Premium ERP</span>
                </div>
            </div>
        </div>

        <!-- Navigation Section -->
        <div class="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">
            <!-- Main Menu -->
            <div>
                <p class="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Menu Principal</p>
                <div class="space-y-1.5">
                    <router-link
                        v-for="item in menuItems"
                        :key="item.name"
                        :to="item.path"
                        class="group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border border-transparent"
                        :class="route.path.startsWith(item.path)
                            ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100/50'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'"
                    >
                        <div class="flex items-center">
                            <component :is="item.icon" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                            <span class="text-sm font-semibold">{{ item.name }}</span>
                        </div>
                        <ChevronRight v-if="route.path.startsWith(item.path)" class="w-4 h-4 opacity-50" />
                    </router-link>
                </div>
            </div>

            <!-- Settings Menu -->
            <div>
                <p class="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personnel</p>
                <div class="space-y-1.5">
                    <router-link
                        v-for="item in secondaryItems"
                        :key="item.name"
                        :to="item.path"
                        class="group flex items-center px-4 py-3 rounded-xl transition-all duration-300 border border-transparent"
                        :class="route.path.startsWith(item.path)
                            ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100/50'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'"
                    >
                        <component :is="item.icon" class="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                        <span class="text-sm font-semibold">{{ item.name }}</span>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Logout Section -->
        <div class="p-6">
            <button
                @click="logout"
                class="flex items-center w-full px-4 py-4 text-sm font-bold text-rose-500 bg-rose-50/30 dark:bg-rose-500/10 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-rose-100/20 dark:border-rose-500/20 rounded-2xl transition-all duration-300 group"
            >
                <LogOut class="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                Déconnexion
            </button>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #f1f5f9;
    border-radius: 10px;
}
</style>
