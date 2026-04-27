<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const {
  register,
  mfaPending,
  mfaPhoneMasked,
  verifyMfa,
  resendMfaCode,
  cancelMfa,
} = useAuth();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const phone = ref("");
const mfaCode = ref("");
const error = ref("");
const loading = ref(false);
const resending = ref(false);

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
    const user = await register(email.value, password.value, phone.value);
    if (user) {
      router.push("/");
    }
    // If user is null, mfaPending is true, handled by UI
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleVerifyMfa() {
  if (mfaCode.value.length !== 6) {
    error.value = "Please enter a valid 6-digit code.";
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    await verifyMfa(mfaCode.value);
    router.push("/");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleResendCode() {
  resending.value = true;
  error.value = "";
  try {
    await resendMfaCode();
    // Maybe show a success message?
  } catch (err) {
    error.value = err.message;
  } finally {
    resending.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-16"
  >
    <div class="w-full max-w-md">
      <!-- Card -->
      <div
        class="bg-slate-900/40 rounded-3xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-xl"
      >
        <!-- Header -->
        <div
          class="bg-slate-900/50 px-8 pt-10 pb-8 text-center border-b border-white/5"
        >
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-5 shadow-lg shadow-emerald-500/30"
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
          <h1 class="text-2xl font-extrabold text-white m-0 tracking-tight">
            Create Account
          </h1>
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
            class="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠</span>
            <span>{{ error }}</span>
          </div>

          <!-- Email -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-300 mb-1.5"
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
              class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-600"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-300 mb-1.5"
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
              class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-600"
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-300 mb-1.5"
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
              class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-600"
            />
          </div>

          <!-- Phone -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-300 mb-1.5"
              for="register-phone"
            >
              Phone number
              <span class="text-slate-500 font-normal ml-1"
                >(optional — for SMS verification)</span
              >
            </label>
            <input
              id="register-phone"
              v-model="phone"
              type="tel"
              autocomplete="tel"
              placeholder="+1 555 000 0000"
              class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition placeholder:text-slate-600"
            />
          </div>

          <p class="text-xs text-slate-500 leading-relaxed -mt-1">
            By creating an account you agree that your cart and order data will
            be stored securely.
          </p>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 cursor-pointer border-none text-sm"
          >
            {{ loading ? "Creating account…" : "Create Account" }}
          </button>

          <!-- Login link -->
          <div class="pt-2 text-center">
            <p class="text-sm text-slate-500 m-0">
              Already have an account?
              <RouterLink
                to="/login"
                class="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
              >
                Sign in
              </RouterLink>
            </p>
          </div>
        </form>
      </div>
    </div>

    <!-- MFA Modal -->
    <div
      v-if="mfaPending"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        class="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10"
      >
        <div class="bg-slate-950/50 p-8 text-center border-b border-white/5">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-5 shadow-lg shadow-blue-600/30"
          >
            <svg
              class="w-7 h-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white m-0 tracking-tight">
            Verify your phone
          </h2>
          <p class="text-slate-400 text-sm mt-2 m-0">
            We sent a code to {{ mfaPhoneMasked }}
          </p>
        </div>

        <div class="p-8 space-y-6">
          <div
            v-if="error"
            class="bg-red-500/10 text-red-400 text-xs font-medium p-3 rounded-lg border border-red-500/20 flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{{ error }}</span>
          </div>

          <div>
            <label
              class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
            >
              Verification Code
            </label>
            <input
              v-model="mfaCode"
              type="text"
              maxlength="6"
              placeholder="000000"
              class="w-full bg-slate-950/50 text-center text-3xl font-mono tracking-[0.5em] border-2 border-white/10 rounded-2xl py-4 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-800"
              @keyup.enter="handleVerifyMfa"
            />
          </div>

          <button
            @click="handleVerifyMfa"
            :disabled="loading || mfaCode.length !== 6"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-none"
          >
            {{ loading ? "Verifying..." : "Verify & Complete" }}
          </button>

          <div class="flex items-center justify-between pt-2">
            <button
              @click="handleResendCode"
              :disabled="resending"
              class="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              {{ resending ? "Sending..." : "Resend code" }}
            </button>
            <button
              @click="cancelMfa"
              class="text-sm font-semibold text-red-400 hover:text-red-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
