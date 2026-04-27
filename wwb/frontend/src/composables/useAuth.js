import { ref, computed } from "vue";
import { user, authLoading } from "./useAuthState.js";
import { useCart } from "./useCart.js";

// MFA challenge state
const mfaPending = ref(false);
const mfaToken = ref(null);
const mfaPhoneMasked = ref("");

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null);

  async function register(email, password, phone) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, phone: phone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed.");

    // Check if MFA challenge was returned
    if (data.mfaRequired) {
      mfaPending.value = true;
      mfaToken.value = data.mfaToken;
      mfaPhoneMasked.value = data.phoneMasked || "";
      return null; // signal to the UI: show MFA step
    }

    user.value = data.user;
    return data.user;
  }

  async function login(email, password) {
    // Reset MFA state
    mfaPending.value = false;
    mfaToken.value = null;
    mfaPhoneMasked.value = "";

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed.");

    // Check if MFA challenge was returned
    if (data.mfaRequired) {
      mfaPending.value = true;
      mfaToken.value = data.mfaToken;
      mfaPhoneMasked.value = data.phoneMasked || "";
      return null; // signal to the UI: show MFA step
    }

    user.value = data.user;
    return data.user;
  }

  async function verifyMfa(code) {
    const res = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mfaToken: mfaToken.value, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed.");

    // MFA passed — clear challenge state, set user
    mfaPending.value = false;
    mfaToken.value = null;
    mfaPhoneMasked.value = "";
    user.value = data.user;
    return data.user;
  }

  async function resendMfaCode() {
    const res = await fetch("/api/auth/mfa/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mfaToken: mfaToken.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to resend code.");
    return data.message;
  }

  function cancelMfa() {
    mfaPending.value = false;
    mfaToken.value = null;
    mfaPhoneMasked.value = "";
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    user.value = null;
  }

  // Called once on app mount to rehydrate session from HttpOnly cookie
  async function fetchMe() {
    try {
      authLoading.value = true;
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        user.value = data.user;
      } else {
        user.value = null;
      }
    } catch {
      user.value = null;
    } finally {
      authLoading.value = false;
    }
  }

  const isStaff = computed(() => {
    if (!user.value || !user.value.roles) return false;
    // Common staff roles: admin, content-creator
    return user.value.roles.some((role) =>
      ["admin", "content-creator"].includes(role),
    );
  });

  async function updateProfile({ email, phone }) {
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profile update failed.");

    // Check if MFA challenge was returned
    if (data.mfaRequired) {
      mfaPending.value = true;
      mfaToken.value = data.mfaToken;
      mfaPhoneMasked.value = data.phoneMasked || "";
      return null;
    }

    user.value = data.user;
    return data.user;
  }

  async function updatePassword(currentPassword, newPassword) {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Password update failed.");
    return data.message;
  }

  return {
    user,
    isLoggedIn,
    isStaff,
    authLoading,
    mfaPending,
    mfaToken,
    mfaPhoneMasked,
    register,
    login,
    verifyMfa,
    resendMfaCode,
    cancelMfa,
    logout,
    fetchMe,
    updateProfile,
    updatePassword,
  };
}
