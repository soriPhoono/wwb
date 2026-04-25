import { ref, computed } from 'vue';

// Global singleton auth state — mirrors useCart pattern
const user = ref(null);
const authLoading = ref(true); // true until fetchMe resolves on app load

export function useAuth() {
  const isLoggedIn = computed(() => user.value !== null);

  async function register(email, password, phone) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, phone: phone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    user.value = data.user;
    return data.user;
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    user.value = data.user;
    return data.user;
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    user.value = null;
  }

  // Called once on app mount to rehydrate session from HttpOnly cookie
  async function fetchMe() {
    try {
      authLoading.value = true;
      const res = await fetch('/api/auth/me', { credentials: 'include' });
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

  return { user, isLoggedIn, authLoading, register, login, logout, fetchMe };
}
