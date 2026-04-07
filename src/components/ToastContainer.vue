<script setup>
import { useToastStore } from '../stores/toast';
import { CheckCircle, XCircle, Info, X } from 'lucide-vue-next';

const toastStore = useToastStore();
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 pointer-events-none">
    <TransitionGroup 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100 scale-100"
      leave-to-class="translate-y-full opacity-0 scale-95"
    >
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-center p-4 min-w-[320px] max-w-md rounded-xl shadow-2xl border-2 backdrop-blur-md"
        :class="{
          'bg-white/95 border-emerald-500 text-emerald-900 shadow-emerald-500/10': toast.type === 'success',
          'bg-white/95 border-rose-500 text-rose-900 shadow-rose-500/10': toast.type === 'error',
          'bg-white/95 border-blue-500 text-blue-900 shadow-blue-500/10': toast.type === 'info'
        }"
      >
        <div class="mr-3 flex-shrink-0">
          <div :class="{
            'p-1.5 rounded-full bg-emerald-100 text-emerald-600': toast.type === 'success',
            'p-1.5 rounded-full bg-rose-100 text-rose-600': toast.type === 'error',
            'p-1.5 rounded-full bg-blue-100 text-blue-600': toast.type === 'info'
          }">
            <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5" />
            <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5" />
            <Info v-else class="w-5 h-5" />
          </div>
        </div>
        
        <div class="flex-1 mr-2">
          <p class="text-sm font-bold">{{ toast.type === 'success' ? 'Succès' : toast.type === 'error' ? 'Erreur' : 'Information' }}</p>
          <p class="text-xs opacity-80 leading-relaxed">{{ toast.message }}</p>
        </div>
        
        <button @click="toastStore.remove(toast.id)" class="p-1 hover:bg-black/5 rounded-lg transition-colors group">
          <X class="w-4 h-4 opacity-40 group-hover:opacity-100" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
