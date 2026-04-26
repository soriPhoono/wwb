<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, logout } = useAuth();
const open = ref(false);

async function handleLogout() {
  open.value = false;
  await logout();
  router.push("/");
}

// Derive display initials from email
function initials(email) {
  return email ? email[0].toUpperCase() : "?";
}
</script>

<template>
  <div class="relative" v-if="user">
    <!-- Avatar button -->
    <button
      id="user-menu-button"
      class="flex items-center gap-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl px-3 py-2 cursor-pointer border-none transition-colors"
      @click="open = !open"
    >
      <!-- Avatar circle -->
      <span
        class="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 text-white text-sm font-extrabold shrink-0"
      >
        {{ initials(user.email) }}
      </span>
      <span
        class="text-sm font-semibold max-w-[120px] truncate hidden sm:block"
        >{{ user.email }}</span
      >
      <!-- Chevron -->
      <svg
        class="w-4 h-4 text-slate-300 transition-transform duration-200 shrink-0"
        :class="open ? 'rotate-180' : ''"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 py-2 z-[1100]"
        @click.stop
      >
        <!-- User info header -->
        <div class="px-4 py-3 border-b border-slate-100">
          <p
            class="text-xs text-slate-400 font-semibold uppercase tracking-wider m-0"
          >
            Signed in as
          </p>
          <p class="text-sm font-bold text-slate-800 truncate m-0 mt-0.5">
            {{ user.email }}
          </p>
        </div>

        <!-- Menu items -->
        <div class="py-1">
          <RouterLink
            to="/account"
            class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-none no-underline"
            @click="open = false"
          >
            <svg
              class="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Account
          </RouterLink>

          <hr class="my-1 border-slate-100" />

          <button
            class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-transparent border-none"
            @click="handleLogout"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </Transition>

    <!-- Click-outside overlay -->
    <div v-if="open" class="fixed inset-0 z-[1099]" @click="open = false"></div>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
