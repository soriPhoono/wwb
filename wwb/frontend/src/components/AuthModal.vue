<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../composables/useAuth';

const emit = defineEmits(['close']);
const { register, login } = useAuth();

// Tab state: 'login' | 'register'
const activeTab = ref('login');

// Form fields
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const phone = ref('');

// UI state
const error = ref('');
const loading = ref(false);

// Clear errors when switching tabs
watch(activeTab, () => {
  error.value = '';
  password.value = '';
  confirmPassword.value = '';
});

function switchTo(tab) {
  activeTab.value = tab;
}

async function handleSubmit() {
  error.value = '';

  if (!email.value || !password.value) {
    error.value = 'Email and password are required.';
    return;
  }

  if (activeTab.value === 'register') {
    if (password.value.length < 8) {
      error.value = 'Password must be at least 8 characters.';
      return;
    }
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match.';
      return;
    }
  }

  loading.value = true;
  try {
    if (activeTab.value === 'register') {
      await register(email.value, password.value, phone.value);
    } else {
      await login(email.value, password.value);
    }
    emit('close');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <!-- Modal card -->
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[slideUp_0.2s_ease-out]">
        <!-- Header -->
        <div class="bg-slate-900 px-8 pt-8 pb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-extrabold text-white m-0">SecureCart</h2>
            <button
              class="text-slate-400 hover:text-white transition-colors text-2xl leading-none bg-transparent border-none cursor-pointer"
              @click="$emit('close')"
            >&times;</button>
          </div>

          <!-- Tabs -->
          <div class="flex rounded-xl bg-slate-800 p-1">
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer border-none"
              :class="activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-transparent text-slate-400 hover:text-slate-200'"
              @click="switchTo('login')"
            >Sign In</button>
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer border-none"
              :class="activeTab === 'register'
                ? 'bg-white text-slate-900 shadow-md'
                : 'bg-transparent text-slate-400 hover:text-slate-200'"
              @click="switchTo('register')"
            >Create Account</button>
          </div>
        </div>

        <!-- Form body -->
        <form class="px-8 py-7 space-y-5" @submit.prevent="handleSubmit" novalidate>
          <!-- Error banner -->
          <div
            v-if="error"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠</span>
            <span>{{ error }}</span>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="auth-email">Email address</label>
            <input
              id="auth-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="auth-password">Password</label>
            <input
              id="auth-password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Register-only fields -->
          <template v-if="activeTab === 'register'">
            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="auth-confirm">Confirm password</label>
              <input
                id="auth-confirm"
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
              />
            </div>

            <!-- Phone — optional, for MFA -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5" for="auth-phone">
                Phone number
                <span class="text-slate-400 font-normal ml-1">(optional — used for SMS verification)</span>
              </label>
              <input
                id="auth-phone"
                v-model="phone"
                type="tel"
                autocomplete="tel"
                placeholder="+1 555 000 0000"
                class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
              />
            </div>

            <p class="text-xs text-slate-400 leading-relaxed -mt-1">
              By creating an account you agree that your cart and order data will be stored securely.
            </p>
          </template>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 cursor-pointer border-none text-sm"
          >
            <span v-if="loading">
              {{ activeTab === 'login' ? 'Signing in…' : 'Creating account…' }}
            </span>
            <span v-else>
              {{ activeTab === 'login' ? 'Sign In' : 'Create Account' }}
            </span>
          </button>

          <!-- Tab switcher hint -->
          <p class="text-center text-sm text-slate-500 m-0">
            <span v-if="activeTab === 'login'">
              Don't have an account?
              <button type="button" class="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0" @click="switchTo('register')">Sign up</button>
            </span>
            <span v-else>
              Already have an account?
              <button type="button" class="text-blue-600 font-semibold hover:underline bg-transparent border-none cursor-pointer p-0" @click="switchTo('login')">Sign in</button>
            </span>
          </p>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
</style>
