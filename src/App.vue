<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import MainLayout from './layouts/MainLayout.vue';
import ToastContainer from './components/ToastContainer.vue';
import { useAuthStore } from './stores/auth';

const route = useRoute();
const auth = useAuthStore();
auth.init();

const layout = computed(() => {
  return route.name === 'Login' ? 'div' : MainLayout;
});
</script>

<template>
  <component :is="layout">
    <router-view></router-view>
  </component>
  <ToastContainer />
</template>

<style>
body {
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}
</style>
