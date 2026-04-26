<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { register } = useAuth();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const phone = ref("");
const error = ref("");
const loading = ref(false);

async function handleSubmit() {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }
  if (password.value.length < 8) {
    error.value = "Password must be at least 8 characters.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await register(email.value, password.value, phone.value);
    router.push("/");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-slate-50 to-slate-100"
  >
    <div class="w-full max-w-md">
      <!-- Card -->
      <div
        class="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden"
      >
        <!-- Header -->
        <div class="bg-slate-900 px-8 pt-10 pb-8 text-center">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500 mb-5 shadow-lg shadow-emerald-500/30"
          >
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 class="text-2xl font-extrabold text-white m-0">Create Account</h1>
          <p class="text-slate-400 text-sm mt-2 m-0">
            Join SecureCart to start shopping securely
          </p>
        </div>

        <!-- Form -->
        <form
          class="px-8 py-8 space-y-5"
          @submit.prevent="handleSubmit"
          novalidate
        >
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
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="register-email"
            >
              Email address
            </label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="register-password"
            >
              Password
            </label>
            <input
              id="register-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="Min. 8 characters"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="register-confirm"
            >
              Confirm password
            </label>
            <input
              id="register-confirm"
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Phone -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="register-phone"
            >
              Phone number
              <span class="text-slate-400 font-normal ml-1"
                >(optional — for SMS verification)</span
              >
            </label>
            <input
              id="register-phone"
              v-model="phone"
              type="tel"
              autocomplete="tel"
              placeholder="+1 555 000 0000"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <p class="text-xs text-slate-400 leading-relaxed -mt-1">
            By creating an account you agree that your cart and order data will
            be stored securely.
          </p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer border-none text-sm"
          >
            {{ loading ? "Creating account…" : "Create Account" }}
          </button>

          <!-- Login link -->
          <p class="text-center text-sm text-slate-500 m-0">
            Already have an account?
            <RouterLink
              to="/login"
              class="text-blue-600 font-semibold hover:underline"
            >
              Sign in
            </RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
