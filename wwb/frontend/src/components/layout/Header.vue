<script setup>
import { useCart } from "../../composables/useCart";
import { useAuth } from "../../composables/useAuth";
import UserMenu from "./UserMenu.vue";

const { cartCount, toggleCart, canUseCart } = useCart();
const { isLoggedIn, user } = useAuth();
</script>

<template>
  <header
    class="sticky top-0 z-50 bg-black text-white border-b border-slate-800/50 shadow-xl"
  >
    <div
      class="container-custom flex items-center justify-between gap-5 py-4 flex-wrap"
    >
      <div class="brand">
        <RouterLink to="/" class="no-underline text-white">
          <h1 class="m-0 text-2xl font-extrabold tracking-tight">SecureCart</h1>
        </RouterLink>
        <p class="mt-0.5 text-sm text-slate-300">
          Secure E-Commerce Website Demo
        </p>
      </div>

      <nav class="flex gap-5 flex-wrap">
        <RouterLink to="/#home" class="nav-link">Home</RouterLink>
        <RouterLink to="/shop" class="nav-link">Shop</RouterLink>
        <RouterLink to="/#security" class="nav-link">Security</RouterLink>
        <RouterLink to="/#workflow" class="nav-link">Checkout</RouterLink>
        <RouterLink to="/#about" class="nav-link">About</RouterLink>
        <RouterLink
          v-if="user?.roles?.includes('admin')"
          to="/admin"
          class="text-amber-400 font-bold no-underline hover:text-amber-300 transition-colors"
          >Admin</RouterLink
        >
      </nav>

      <div class="flex items-center gap-3">
        <!-- Auth: login button or user menu -->
        <RouterLink
          v-if="!isLoggedIn"
          to="/login"
          id="login-button"
          class="btn-base bg-white/10 hover:bg-white/20 border border-white/20 text-white"
        >
          Sign In
        </RouterLink>
        <UserMenu v-else />

        <!-- Cart -->
        <button
          v-if="canUseCart"
          id="cart-button"
          class="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-sm font-bold"
          @click="toggleCart"
        >
          Cart ({{ cartCount }})
        </button>
      </div>
    </div>
  </header>
</template>
