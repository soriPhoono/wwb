<script setup>
import { ref, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const route = useRoute();
const {
  login,
  verifyMfa,
  resendMfaCode,
  cancelMfa,
  mfaPending,
  mfaPhoneMasked,
} = useAuth();

const email = ref("");
const password = ref("");
const mfaCode = ref("");
const error = ref("");
const loading = ref(false);
const resendCooldown = ref(0);

let cooldownTimer = null;

function startCooldown(seconds = 30) {
  resendCooldown.value = seconds;
  cooldownTimer = setInterval(() => {
    resendCooldown.value--;
    if (resendCooldown.value <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer);
  cancelMfa();
});

async function handleLogin() {
  error.value = "";

  if (!email.value || !password.value) {
    error.value = "Email and password are required.";
    return;
  }

  loading.value = true;
  try {
    const result = await login(email.value, password.value);

    if (result === null) {
      // MFA required — composable has set mfaPending, stay on page
      startCooldown(30);
      return;
    }

    // No MFA — logged in directly
    const redirect = route.query.redirect || "/";
    router.push(redirect);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleVerify() {
  error.value = "";

  if (!mfaCode.value || mfaCode.value.length < 4) {
    error.value = "Please enter the verification code.";
    return;
  }

  loading.value = true;
  try {
    await verifyMfa(mfaCode.value);
    const redirect = route.query.redirect || "/";
    router.push(redirect);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleResend() {
  error.value = "";
  try {
    await resendMfaCode();
    startCooldown(30);
  } catch (err) {
    error.value = err.message;
  }
}

function handleBack() {
  error.value = "";
  mfaCode.value = "";
  cancelMfa();
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
        <!-- ═══════════════════════════════════════════════════════════════
             STEP 1 — Email & Password
             ═══════════════════════════════════════════════════════════ -->
        <template v-if="!mfaPending">
          <!-- Header -->
          <div class="bg-slate-900 px-8 pt-10 pb-8 text-center">
            <div
              class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-5 shadow-lg shadow-blue-600/30"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-extrabold text-white m-0">Welcome Back</h1>
            <p class="text-slate-400 text-sm mt-2 m-0">
              Sign in to your SecureCart account
            </p>
          </div>

          <!-- Form -->
          <form
            class="px-8 py-8 space-y-5"
            @submit.prevent="handleLogin"
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
                for="login-email"
              >
                Email address
              </label>
              <input
                id="login-email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
              />
            </div>

            <!-- Password -->
            <div>
              <label
                class="block text-sm font-semibold text-slate-700 mb-1.5"
                for="login-password"
              >
                Password
              </label>
              <input
                id="login-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
              />
            </div>

            <!-- Submit -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 cursor-pointer border-none text-sm"
            >
              {{ loading ? "Signing in…" : "Sign In" }}
            </button>

            <!-- Register link -->
            <p class="text-center text-sm text-slate-500 m-0">
              Don't have an account?
              <RouterLink
                to="/register"
                class="text-blue-600 font-semibold hover:underline"
              >
                Create one
              </RouterLink>
            </p>
          </form>
        </template>

        <!-- ═══════════════════════════════════════════════════════════════
             STEP 2 — MFA Code Verification
             ═══════════════════════════════════════════════════════════ -->
        <template v-else>
          <!-- Header -->
          <div class="bg-slate-900 px-8 pt-10 pb-8 text-center">
            <div
              class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-5 shadow-lg shadow-amber-500/30"
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 class="text-2xl font-extrabold text-white m-0">
              Verify Your Identity
            </h1>
            <p class="text-slate-400 text-sm mt-2 m-0">
              We sent a verification code to
              <span class="text-slate-300 font-medium">{{
                mfaPhoneMasked
              }}</span>
            </p>
          </div>

          <!-- Form -->
          <form
            class="px-8 py-8 space-y-5"
            @submit.prevent="handleVerify"
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

            <!-- Info banner -->
            <div
              class="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-3 rounded-xl"
            >
              <span class="mt-0.5 shrink-0">🔒</span>
              <span
                >Enter the 6-digit code from the SMS we just sent. It expires in
                10 minutes.</span
              >
            </div>

            <!-- Code input -->
            <div>
              <label
                class="block text-sm font-semibold text-slate-700 mb-1.5"
                for="mfa-code"
              >
                Verification code
              </label>
              <input
                id="mfa-code"
                v-model="mfaCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="000000"
                class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition placeholder:text-slate-400 placeholder:tracking-[0.5em]"
              />
            </div>

            <!-- Verify button -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all duration-200 cursor-pointer border-none text-sm"
            >
              {{ loading ? "Verifying…" : "Verify Code" }}
            </button>

            <!-- Resend / Back -->
            <div class="flex items-center justify-between">
              <button
                type="button"
                class="text-sm text-slate-500 hover:text-slate-700 font-medium cursor-pointer border-none bg-transparent p-0 transition"
                @click="handleBack"
              >
                ← Back to login
              </button>

              <button
                type="button"
                :disabled="resendCooldown > 0"
                class="text-sm font-semibold cursor-pointer border-none bg-transparent p-0 transition"
                :class="
                  resendCooldown > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                "
                @click="handleResend"
              >
                {{
                  resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend code"
                }}
              </button>
            </div>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
