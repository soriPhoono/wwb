<script setup>
import { ref, onMounted } from 'vue';
import Header from './components/Header.vue';
import CartPanel from './components/CartPanel.vue';
import Hero from './components/Hero.vue';
import Stats from './components/Stats.vue';
import ProductCatalog from './components/ProductCatalog.vue';
import Security from './components/Security.vue';
import Workflow from './components/Workflow.vue';
import About from './components/About.vue';
import Footer from './components/Footer.vue';
import AuthModal from './components/AuthModal.vue';
import { useAuth } from './composables/useAuth';

const { fetchMe } = useAuth();
const showAuth = ref(false);

// Rehydrate session from HttpOnly cookie on every page load
onMounted(() => {
  fetchMe();
});
</script>

<template>
  <Header @open-auth="showAuth = true" />

  <main>
    <Hero />
    <Stats />
    <ProductCatalog />
    <Security />
    <Workflow />
    <About />
  </main>

  <CartPanel />
  <Footer />

  <!-- Auth modal — rendered via Teleport inside AuthModal itself -->
  <AuthModal v-if="showAuth" @close="showAuth = false" />
</template>

