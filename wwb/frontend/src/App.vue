<script setup>
import { onMounted } from "vue";
import Header from "./components/Header.vue";
import CartPanel from "./components/CartPanel.vue";
import Footer from "./components/Footer.vue";
import { useAuth } from "./composables/useAuth";

const { fetchMe } = useAuth();

// Rehydrate session from HttpOnly cookie on every page load
onMounted(() => {
  fetchMe();
});
</script>

<template>
  <Header />

  <main>
    <RouterView />
  </main>

  <CartPanel />
  <Footer />
</template>
