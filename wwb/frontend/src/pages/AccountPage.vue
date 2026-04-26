<script setup>
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";

const {
  user,
  fetchMe,
  mfaPending,
  mfaPhoneMasked,
  mfaToken,
  verifyMfa,
  resendMfaCode,
  cancelMfa,
} = useAuth();

const mfaCode = ref("");
const mfaLoading = ref(false);
const mfaError = ref("");

// Profile form
const profileEmail = ref("");
const profilePhone = ref("");
const profileError = ref("");
const profileSuccess = ref("");
const profileLoading = ref(false);

// Password form
const currentPassword = ref("");
const newPassword = ref("");
const confirmNewPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const passwordLoading = ref(false);

onMounted(() => {
  if (user.value) {
    profileEmail.value = user.value.email || "";
    profilePhone.value = user.value.phone || "";
  }
});

async function handleProfileUpdate() {
  profileError.value = "";
  profileSuccess.value = "";

  if (!profileEmail.value) {
    profileError.value = "Email is required.";
    return;
  }

  profileLoading.value = true;
  try {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: profileEmail.value,
        phone: profilePhone.value || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed.");

    // Check if verification is required
    if (data.mfaRequired) {
      mfaPending.value = true;
      mfaToken.value = data.mfaToken;
      mfaPhoneMasked.value = data.phoneMasked || "";
      profileSuccess.value = "Verification code sent to your new number.";
      return;
    }

    // Refresh user state
    await fetchMe();
    profileSuccess.value = "Profile updated successfully.";
  } catch (err) {
    profileError.value = err.message;
  } finally {
    profileLoading.value = false;
  }
}

async function handleVerifyMfa() {
  if (mfaCode.value.length !== 6) {
    mfaError.value = "Please enter a valid 6-digit code.";
    return;
  }

  mfaLoading.value = true;
  mfaError.value = "";
  try {
    await verifyMfa(mfaCode.value);
    mfaCode.value = "";
    profileSuccess.value = "Phone number updated successfully.";
    // Refresh user state is already handled by verifyMfa setting user.value
  } catch (err) {
    mfaError.value = err.message;
  } finally {
    mfaLoading.value = false;
  }
}

async function handlePasswordChange() {
  passwordError.value = "";
  passwordSuccess.value = "";

  if (!currentPassword.value || !newPassword.value) {
    passwordError.value = "Both current and new passwords are required.";
    return;
  }
  if (newPassword.value.length < 8) {
    passwordError.value = "New password must be at least 8 characters.";
    return;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    passwordError.value = "New passwords do not match.";
    return;
  }

  passwordLoading.value = true;
  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password change failed.");
    passwordSuccess.value = "Password changed successfully.";
    currentPassword.value = "";
    newPassword.value = "";
    confirmNewPassword.value = "";
  } catch (err) {
    passwordError.value = err.message;
  } finally {
    passwordLoading.value = false;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4"
  >
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- Page heading -->
      <div class="mb-10">
        <h1
          class="text-4xl font-black text-slate-900 m-0 tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent"
        >
          Account Settings
        </h1>
        <p class="text-slate-500 mt-2 m-0 text-lg">
          Manage your profile and security settings
        </p>
      </div>

      <!-- Account Details Card -->
      <div
        class="bg-white rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden"
      >
        <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2
            class="text-lg font-bold text-slate-800 m-0 flex items-center gap-2.5"
          >
            <svg
              class="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Account Details
          </h2>
        </div>
        <div class="px-8 py-6" v-if="user">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p
                class="text-xs text-slate-400 font-semibold uppercase tracking-wider m-0"
              >
                Member Since
              </p>
              <p class="text-sm font-semibold text-slate-800 mt-1 m-0">
                {{ formatDate(user.createdAt) }}
              </p>
            </div>
            <div>
              <p
                class="text-xs text-slate-400 font-semibold uppercase tracking-wider m-0"
              >
                MFA Status
              </p>
              <p class="mt-1 m-0">
                <span
                  class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                  :class="
                    user.mfaEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  "
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="user.mfaEnabled ? 'bg-emerald-500' : 'bg-amber-500'"
                  ></span>
                  {{ user.mfaEnabled ? "Enabled" : "Not enabled" }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Card -->
      <div
        class="bg-white rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden"
      >
        <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2
            class="text-lg font-bold text-slate-800 m-0 flex items-center gap-2.5"
          >
            <svg
              class="w-5 h-5 text-slate-400"
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
            Profile Information
          </h2>
        </div>
        <form
          class="px-8 py-6 space-y-5"
          @submit.prevent="handleProfileUpdate"
          novalidate
        >
          <!-- Success / Error -->
          <div
            v-if="profileSuccess"
            class="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">✓</span>
            <span>{{ profileSuccess }}</span>
          </div>
          <div
            v-if="profileError"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠</span>
            <span>{{ profileError }}</span>
          </div>

          <!-- Email -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="profile-email"
            >
              Email address
            </label>
            <input
              id="profile-email"
              v-model="profileEmail"
              type="email"
              autocomplete="email"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Phone -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="profile-phone"
            >
              Phone number
              <span class="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="profile-phone"
              v-model="profilePhone"
              type="tel"
              autocomplete="tel"
              placeholder="+1 555 000 0000"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="profileLoading"
              class="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 cursor-pointer border-none text-sm"
            >
              {{ profileLoading ? "Saving…" : "Save Changes" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Password Card -->
      <div
        class="bg-white rounded-2xl shadow-lg shadow-slate-200/40 border border-slate-100 overflow-hidden"
      >
        <div class="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2
            class="text-lg font-bold text-slate-800 m-0 flex items-center gap-2.5"
          >
            <svg
              class="w-5 h-5 text-slate-400"
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
            Change Password
          </h2>
        </div>
        <form
          class="px-8 py-6 space-y-5"
          @submit.prevent="handlePasswordChange"
          novalidate
        >
          <!-- Success / Error -->
          <div
            v-if="passwordSuccess"
            class="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">✓</span>
            <span>{{ passwordSuccess }}</span>
          </div>
          <div
            v-if="passwordError"
            class="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl"
          >
            <span class="mt-0.5 shrink-0">⚠</span>
            <span>{{ passwordError }}</span>
          </div>

          <!-- Current password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="current-password"
            >
              Current password
            </label>
            <input
              id="current-password"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- New password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="new-password"
            >
              New password
            </label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Min. 8 characters"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <!-- Confirm new password -->
          <div>
            <label
              class="block text-sm font-semibold text-slate-700 mb-1.5"
              for="confirm-new-password"
            >
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              v-model="confirmNewPassword"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-400"
            />
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="passwordLoading"
              class="bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-slate-800/20 transition-all duration-200 cursor-pointer border-none text-sm"
            >
              {{ passwordLoading ? "Updating…" : "Update Password" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MFA Modal -->
    <div
      v-if="mfaPending"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div class="bg-slate-900 p-8 text-center">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 mb-5 shadow-lg shadow-blue-500/30"
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
          <h2 class="text-xl font-bold text-white m-0">Verify your phone</h2>
          <p class="text-slate-400 text-sm mt-2 m-0">
            We sent a code to {{ mfaPhoneMasked }}
          </p>
        </div>

        <div class="p-8 space-y-6">
          <div
            v-if="mfaError"
            class="bg-red-50 text-red-600 text-xs font-medium p-3 rounded-lg border border-red-100 flex items-center gap-2"
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
              class="w-full text-center text-3xl font-mono tracking-[0.5em] border-2 border-slate-100 rounded-2xl py-4 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-200"
              @keyup.enter="handleVerifyMfa"
            />
          </div>

          <button
            @click="handleVerifyMfa"
            :disabled="mfaLoading || mfaCode.length !== 6"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer border-none"
          >
            {{ mfaLoading ? "Verifying..." : "Verify & Update" }}
          </button>

          <div class="flex items-center justify-between pt-2">
            <button
              @click="resendMfaCode"
              class="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-transparent border-none cursor-pointer"
            >
              Resend code
            </button>
            <button
              @click="cancelMfa"
              class="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
