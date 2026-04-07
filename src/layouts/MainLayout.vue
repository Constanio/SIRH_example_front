<script setup>
import { ref } from "vue";
import Sidebar from "../components/Sidebar.vue";
import TopBar from "../components/TopBar.vue";

const isSidebarOpen = ref(true);

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
    <div class="flex h-screen bg-[#F8FAFC] font-['Inter'] selection:bg-indigo-100 selection:text-indigo-900">
        <!-- Sidebar -->
        <aside
            class="fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-500 ease-in-out lg:relative lg:translate-x-0"
            :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
            <Sidebar />
        </aside>

        <!-- Overlay for mobile -->
        <div 
            v-if="isSidebarOpen" 
            class="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
            @click="isSidebarOpen = false"
        ></div>

        <!-- Content Area -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <TopBar :is-sidebar-open="isSidebarOpen" @toggle-sidebar="toggleSidebar" />

            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 custom-scrollbar">
                <div class="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                    <slot></slot>
                </div>
            </main>
        </div>
    </div>
</template>

<style>
/* Global scrollbar improvements */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
}

/* Base animations */
.animate-in {
    animation-fill-mode: both;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideInFromBottom {
    from { transform: translateY(1rem); }
    to { transform: translateY(0); }
}

.fade-in {
    animation: fadeIn 0.8s ease-out;
}

.slide-in-from-bottom-4 {
    animation: slideInFromBottom 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
