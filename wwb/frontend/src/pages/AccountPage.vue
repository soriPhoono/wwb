<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";

const route = useRoute();
const orderSuccess = ref(false);
const orderId = ref("");

const {
  user,
  updateProfile,
  updatePassword,
  verifyMfa,
  resendMfaCode,
  cancelMfa,
  mfaPending,
  mfaPhoneMasked,
} = useAuth();

const profileEmail = ref("");
const profilePhone = ref("");
const profileSuccess = ref("");
const profileError = ref("");

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordSuccess = ref("");
const passwordError = ref("");

const mfaCode = ref("");
const mfaError = ref("");

const loading = ref(false);

onMounted(() => {
  if (user.value) {
    profileEmail.value = user.value.email;
    profilePhone.value = user.value.phone || "";
  }

  if (route.query.orderSuccess === "true") {
    orderSuccess.value = true;
    orderId.value = route.query.orderId;
  }
});

async function handleUpdateProfile() {
  profileSuccess.value = "";
  profileError.value = "";
  loading.value = true;
  try {
    await updateProfile({
      email: profileEmail.value,
      phone: profilePhone.value,
    });
    profileSuccess.value = "Profile updated successfully.";
  } catch (err) {
    profileError.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleUpdatePassword() {
  passwordSuccess.value = "";
  passwordError.value = "";

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "New passwords do not match.";
    return;
  }

  loading.value = true;
  try {
    await updatePassword(currentPassword.value, newPassword.value);
    passwordSuccess.value = "Password updated successfully.";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    passwordError.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function handleVerifyMfa() {
  mfaError.value = "";
  loading.value = true;
  try {
    await verifyMfa(mfaCode.value);
    mfaCode.value = "";
  } catch (err) {
    mfaError.value = err.message;
  } finally {
    loading.value = false;
  }
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
</script>

<template>
  <div class="min-h-[calc(100vh-80px)] py-12 px-4">
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Page heading -->
      <div class="flex items-end justify-between">
        <h1 class="text-4xl font-black text-white m-0 tracking-tight">
          Account Settings
        </h1>
        <p class="text-slate-500 font-medium m-0">Manage your profile</p>
      </div>

      <!-- Order Success Notification -->
      <div
        v-if="orderSuccess"
        class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
      >
        <div
          class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-white m-0">
            Order Placed Successfully!
          </h3>
          <p class="text-slate-400 text-sm m-0">
            Your order #{{ orderId }} has been received and is being processed.
          </p>
        </div>
        <button
          @click="orderSuccess = false"
          class="ml-auto text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Quick Summary Card -->
      <div
        class="bg-slate-900/40 rounded-2xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-xl"
      >
        <div class="px-8 py-5 border-b border-white/5 bg-slate-950/30">
          <h2
            class="text-lg font-bold text-white m-0 flex items-center gap-2.5"
          >
            <span class="w-2 h-6 bg-blue-500 rounded-full"></span>
            Profile Summary
          </h2>
        </div>
        <div class="p-8">
          <div class="flex items-center gap-6">
            <div
              class="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-blue-500/20"
            >
              {{ user?.email?.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p
                    class="text-xs font-bold text-slate-500 uppercase tracking-wider m-0"
                  >
                    Email Identity
                  </p>
                  <p class="text-xl font-bold text-white mt-1 m-0">
                    {{ user?.email }}
                  </p>
                </div>
                <div class="text-right">
                  <p
                    class="text-xs font-bold text-slate-500 uppercase tracking-wider m-0"
                  >
                    Member Since
                  </p>
                  <p class="text-sm font-semibold text-white mt-1 m-0">
                    {{ formatDate(user?.createdAt) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <div
                  class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                  :class="
                    user?.mfaEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  "
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="
                      user?.mfaEnabled ? 'bg-emerald-400' : 'bg-amber-400'
                    "
                  ></span>
                  MFA {{ user?.mfaEnabled ? "Enabled" : "Disabled" }}
                </div>
                <span
                  v-if="user?.phone"
                  class="text-xs text-slate-500 font-medium"
                >
                  Verified: {{ user.phone }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Profile -->
      <div
        class="bg-slate-900/40 rounded-2xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-xl"
      >
        <div class="px-8 py-5 border-b border-white/5 bg-slate-950/30">
          <h2
            class="text-lg font-bold text-white m-0 flex items-center gap-2.5"
          >
            <span class="w-2 h-6 bg-emerald-500 rounded-full"></span>
            Contact Information
          </h2>
        </div>
        <form @submit.prevent="handleUpdateProfile" class="p-8 space-y-6">
          <div
            v-if="profileSuccess"
            class="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0 text-emerald-400">✓</span>
            <span class="text-emerald-400">{{ profileSuccess }}</span>
          </div>
          <div
            v-if="profileError"
            class="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠️</span>
            <span>{{ profileError }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                class="block text-sm font-semibold text-slate-300 mb-1.5"
                for="profile-email"
              >
                Email Address
              </label>
              <input
                id="profile-email"
                v-model="profileEmail"
                type="email"
                autocomplete="email"
                class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-600"
              />
            </div>

            <div>
              <label
                class="block text-sm font-semibold text-slate-300 mb-1.5"
                for="profile-phone"
              >
                Phone Number
              </label>
              <input
                id="profile-phone"
                v-model="profilePhone"
                type="tel"
                autocomplete="tel"
                placeholder="+1 555 000 0000"
                class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-600"
              />
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-none"
            >
              {{ loading ? "Saving..." : "Update Profile" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Update Password -->
      <div
        class="bg-slate-900/40 rounded-2xl shadow-2xl border border-white/5 overflow-hidden backdrop-blur-xl"
      >
        <div class="px-8 py-5 border-b border-white/5 bg-slate-950/30">
          <h2
            class="text-lg font-bold text-white m-0 flex items-center gap-2.5"
          >
            <span class="w-2 h-6 bg-amber-500 rounded-full"></span>
            Security & Password
          </h2>
        </div>
        <form @submit.prevent="handleUpdatePassword" class="p-8 space-y-6">
          <div
            v-if="passwordSuccess"
            class="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0 text-emerald-400">✓</span>
            <span class="text-emerald-400">{{ passwordSuccess }}</span>
          </div>
          <div
            v-if="passwordError"
            class="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠️</span>
            <span>{{ passwordError }}</span>
          </div>

          <div class="space-y-5">
            <div>
              <label
                class="block text-sm font-semibold text-slate-300 mb-1.5"
                for="current-password"
              >
                Current Password
              </label>
              <input
                id="current-password"
                v-model="currentPassword"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-600"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  class="block text-sm font-semibold text-slate-300 mb-1.5"
                  for="new-password"
                >
                  New Password
                </label>
                <input
                  id="new-password"
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Min. 8 characters"
                  class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-600"
                />
              </div>

              <div>
                <label
                  class="block text-sm font-semibold text-slate-300 mb-1.5"
                  for="confirm-password"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="••••••••"
                  class="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              :disabled="loading"
              class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-none"
            >
              {{ loading ? "Saving..." : "Change Password" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MFA Verification Modal (similar to register/login for consistency) -->
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
            Verify Security Action
          </h2>
          <p class="text-slate-400 text-sm mt-2 m-0">
            We sent a code to {{ mfaPhoneMasked }}
          </p>
        </div>

        <div class="p-8 space-y-6">
          <div
            v-if="mfaError"
            class="bg-red-500/10 text-red-400 text-xs font-medium p-3 rounded-lg border border-red-500/20 flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{{ mfaError }}</span>
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
            {{ loading ? "Verifying..." : "Confirm Action" }}
          </button>

          <div class="flex items-center justify-between pt-2">
            <button
              @click="resendMfaCode"
              class="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              Resend code
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
