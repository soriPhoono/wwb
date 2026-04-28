<script setup>
import { onMounted } from "vue";
import Header from "./components/layout/Header.vue";
import CartPanel from "./components/layout/CartPanel.vue";
import Footer from "./components/layout/Footer.vue";
import { useAuth } from "./composables/useAuth";
import { useCart } from "./composables/useCart";

const { fetchMe } = useAuth();
const { isCartOpen, toggleCart } = useCart();

// Rehydrate session from HttpOnly cookie on every page load
onMounted(() => {
  fetchMe();
});
</script>

<template>
  <div
    :class="{ 'blur-sm brightness-75 pointer-events-none': isCartOpen }"
    class="transition-all duration-300 ease-in-out"
  >
    <Header />

    <main>
      <RouterView />
    </main>

    <Footer />
  </div>

  <!-- Click capture overlay when cart is open -->
  <div
    v-if="isCartOpen"
    class="fixed inset-0 z-[1199]"
    @click="toggleCart"
  ></div>

  <CartPanel />
</template>
