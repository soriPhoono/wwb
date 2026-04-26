import { createRouter, createWebHistory } from "vue-router";
import { useAuth } from "../composables/useAuth";

import HomePage from "../pages/HomePage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import AccountPage from "../pages/AccountPage.vue";
import AdminPage from "../pages/AdminPage.vue";

const routes = [
  { path: "/", name: "home", component: HomePage },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterPage,
    meta: { guest: true },
  },
  {
    path: "/account",
    name: "account",
    component: AccountPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    name: "admin",
    component: AdminPage,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Handle hash links (e.g. /#catalog)
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// Navigation guards
router.beforeEach(async (to, from) => {
  const { isLoggedIn, authLoading } = useAuth();

  // Wait for auth to finish loading before guarding
  if (authLoading.value) {
    await new Promise((resolve) => {
      const unwatch = setInterval(() => {
        if (!authLoading.value) {
          clearInterval(unwatch);
          resolve();
        }
      }, 50);
    });
  }

  // Redirect authenticated users away from guest-only pages
  if (to.meta.guest && isLoggedIn.value) {
    return { name: "home" };
  }

  // Redirect unauthenticated users away from protected pages
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Redirect non-admins away from admin-only pages
  if (to.meta.requiresAdmin) {
    const { user } = useAuth();
    if (!user.value?.roles?.includes("admin")) {
      return { name: "home" };
    }
  }
});

export default router;
