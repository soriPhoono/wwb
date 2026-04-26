<script setup>
import { useCart } from "../composables/useCart";
import { useAuth } from "../composables/useAuth";
import UserMenu from "./UserMenu.vue";

const { cartCount, toggleCart } = useCart();
const { isLoggedIn, user } = useAuth();
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
    <div
      class="max-w-[1120px] w-[92%] mx-auto flex items-center justify-between gap-5 py-4 flex-wrap"
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
        <RouterLink
          to="/#home"
          class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors"
          >Home</RouterLink
        >
        <RouterLink
          to="/#catalog"
          class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors"
          >Catalog</RouterLink
        >
        <RouterLink
          to="/#security"
          class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors"
          >Security</RouterLink
        >
        <RouterLink
          to="/#workflow"
          class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors"
          >Checkout</RouterLink
        >
        <RouterLink
          to="/#about"
          class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors"
          >About</RouterLink
        >
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
          class="cursor-pointer rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 font-semibold text-sm transition-colors border border-white/20 no-underline"
        >
          Sign In
        </RouterLink>
        <UserMenu v-else />

        <!-- Cart -->
        <button
          id="cart-button"
          class="cursor-pointer rounded-xl bg-blue-600 text-white px-4 py-2.5 font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm"
          @click="toggleCart"
        >
          Cart ({{ cartCount }})
        </button>
      </div>
    </div>
  </header>
</template>
