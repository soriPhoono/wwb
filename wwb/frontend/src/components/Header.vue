<script setup>
import { useCart } from '../composables/useCart';
import { useAuth } from '../composables/useAuth';
import UserMenu from './UserMenu.vue';

const { cartCount, toggleCart } = useCart();
const { isLoggedIn } = useAuth();

const emit = defineEmits(['open-auth']);
</script>

<template>
  <header class="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
    <div class="max-w-[1120px] w-[92%] mx-auto flex items-center justify-between gap-5 py-4 flex-wrap">
      <div class="brand">
        <h1 class="m-0 text-2xl font-extrabold tracking-tight">SecureCart</h1>
        <p class="mt-0.5 text-sm text-slate-300">Secure E-Commerce Website Demo</p>
      </div>

      <nav class="flex gap-5 flex-wrap">
        <a href="#home" class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors">Home</a>
        <a href="#catalog" class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors">Catalog</a>
        <a href="#security" class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors">Security</a>
        <a href="#workflow" class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors">Checkout</a>
        <a href="#about" class="text-slate-200 font-semibold no-underline hover:text-blue-300 transition-colors">About</a>
      </nav>

      <div class="flex items-center gap-3">
        <!-- Auth: login button or user menu -->
        <button
          v-if="!isLoggedIn"
          id="login-button"
          class="cursor-pointer rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 font-semibold text-sm transition-colors border border-white/20"
          @click="$emit('open-auth')"
        >
          Sign In
        </button>
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

