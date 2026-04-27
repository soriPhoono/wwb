<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuth } from "../composables/useAuth";

const { user: currentUser } = useAuth();
const users = ref([]);
const availableRoles = ref([]);
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");

// Fetch roles and users
async function fetchData() {
  loading.value = true;
  error.value = "";
  try {
    const [rolesRes, usersRes] = await Promise.all([
      fetch("/api/admin/roles"),
      fetch("/api/admin/users"),
    ]);

    if (!rolesRes.ok || !usersRes.ok) throw new Error("Failed to fetch data");

    availableRoles.value = await rolesRes.json();
    users.value = await usersRes.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Toggle role for a user
async function toggleRole(user, role) {
  // Prevent self-demotion check on frontend for better UX
  if (role === "admin" && user._id === currentUser.value?._id) {
    alert(
      "Safety Check: You cannot remove your own administrator permissions.",
    );
    // Force Vue to re-render the checkbox by triggering a reactive update
    const index = users.value.findIndex((u) => u._id === user._id);
    if (index !== -1) {
      users.value[index] = { ...users.value[index] };
    }
    return;
  }

  const newRoles = user.roles.includes(role)
    ? user.roles.filter((r) => r !== role)
    : [...user.roles, role];

  try {
    const res = await fetch(`/api/admin/users/${user._id}/roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles: newRoles }),
    });

    if (!res.ok) {
      const data = await res.json();
      // Force refresh on failure to ensure UI matches DB
      const index = users.value.findIndex((u) => u._id === user._id);
      if (index !== -1) {
        users.value[index] = { ...users.value[index] };
      }
      throw new Error(data.error || "Failed to update roles");
    }

    const updatedUser = await res.json();
    const index = users.value.findIndex((u) => u._id === user._id);
    if (index !== -1) users.value[index] = updatedUser;
  } catch (err) {
    alert(err.message);
    // Final fallback: re-fetch to be absolutely sure
    fetchData();
  }
}

// Delete user
async function deleteUser(userId) {
  if (
    !confirm(
      "Are you sure you want to delete this user? This action cannot be undone.",
    )
  ) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete user");
    }

    users.value = users.value.filter((u) => u._id !== userId);
  } catch (err) {
    alert(err.message);
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value;
  const query = searchQuery.value.toLowerCase();
  return users.value.filter((u) => u.email.toLowerCase().includes(query));
});

onMounted(fetchData);
</script>

<template>
  <div
    class="max-w-7xl mx-auto px-4 py-16 min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_600px),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1),transparent_600px)]"
  >
    <!-- Header / Hero Section -->
    <div class="mb-16 text-center animate-[fadeInDown_0.8s_ease-out]">
      <div
        class="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase"
      >
        Management Center
      </div>
      <h1
        class="text-5xl sm:text-7xl font-black mb-4 tracking-tight bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        Admin Dashboard
      </h1>
      <p class="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
        Orchestrate your platform's users, permissions, and inventory from a
        unified command center.
      </p>

      <div
        class="mt-10 flex justify-center gap-3 p-1.5 bg-slate-900/40 rounded-full border border-white/5 w-fit mx-auto backdrop-blur-md"
      >
        <router-link
          to="/admin"
          class="px-8 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center gap-2"
          active-class="bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          exact-active-class="bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Users
        </router-link>
        <router-link
          to="/admin/inventory"
          class="px-8 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center gap-2 text-slate-400 hover:text-white"
          active-class="bg-blue-600 text-white shadow-lg shadow-blue-600/20"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m7.5 4.27 9 5.15" />
            <path
              d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
            />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
          Inventory
        </router-link>
      </div>
    </div>

    <!-- Search & Filters -->
    <div
      class="flex flex-col sm:flex-row gap-4 mb-12 items-center p-2 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl"
    >
      <div class="relative flex-1 w-full group">
        <div
          class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by email..."
          class="w-full bg-slate-900/60 border border-white/5 pl-14 pr-6 py-4 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-600"
        />
      </div>
      <button
        @click="fetchData"
        class="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2 group disabled:opacity-50"
        :disabled="loading"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :class="{ 'animate-spin': loading }"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        <span>{{ loading ? "Updating..." : "Refresh" }}</span>
      </button>
    </div>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-4 opacity-0"
    >
      <div
        v-if="error"
        class="mb-8 p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ error }}
      </div>
    </transition>

    <!-- User Grid -->
    <transition-group
      tag="div"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-8"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      move-class="transition duration-500 ease-in-out"
      leave-active-class="transition duration-300 ease-in absolute"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="user in filteredUsers"
        :key="user._id"
        class="flex flex-col p-8 rounded-[32px] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden bg-slate-900/40 backdrop-blur-xl border border-white/10 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(59,130,246,0.1)] group"
      >
        <!-- Card background glow -->
        <div
          class="absolute -right-20 -top-20 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all duration-700"
        ></div>

        <div class="flex gap-5 items-start mb-8 relative">
          <div
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-blue-500/20 shrink-0 transform group-hover:scale-105 transition-transform duration-500"
          >
            {{ user.email[0].toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-xl font-bold text-slate-100 truncate">
                {{ user.email.split("@")[0]
                }}<span class="text-slate-500 font-medium"
                  >@{{ user.email.split("@")[1] }}</span
                >
              </h3>
            </div>

            <div class="flex flex-wrap gap-2 mt-2">
              <span
                v-if="user.roles.includes('admin')"
                class="px-2.5 py-0.5 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider"
              >
                Administrator
              </span>
              <span
                v-else
                class="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-wider"
              >
                Standard User
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-4 mb-8">
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">System ID</span>
            <span class="text-slate-300 font-mono">{{
              user._id.slice(-8)
            }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Member Since</span>
            <span class="text-slate-300">{{
              new Date(user.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            }}</span>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 p-4 bg-slate-950/40 rounded-2xl border border-white/5 relative"
        >
          <span
            class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1"
            >Permissions</span
          >
          <div class="flex flex-wrap gap-2">
            <label
              v-for="role in availableRoles"
              :key="role.id"
              class="flex items-center gap-2 cursor-pointer text-xs font-bold px-3 py-2 rounded-xl transition-all duration-200 border border-white/5"
              :class="[
                user.roles.includes(role.id)
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              ]"
              :title="role.description"
            >
              <input
                type="checkbox"
                :checked="user.roles.includes(role.id)"
                @click.prevent="toggleRole(user, role.id)"
                :disabled="role.id === 'admin' && user._id === currentUser?._id"
                class="w-4 h-4 accent-blue-500 cursor-pointer hidden"
              />
              <div
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="
                  user.roles.includes(role.id)
                    ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]'
                    : 'bg-slate-700'
                "
              ></div>
              <span>{{ role.name }}</span>
            </label>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-white/5">
          <button
            @click="deleteUser(user._id)"
            class="w-full group/btn relative overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all duration-300"
            :class="[
              user._id === currentUser?._id
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'
                : 'bg-red-500/5 text-red-500/70 border border-red-500/10 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20',
            ]"
            :disabled="user._id === currentUser?._id"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="transition-transform group-hover/btn:scale-110"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            {{
              user._id === currentUser?._id
                ? "Self (Protected)"
                : "Terminate User"
            }}
          </button>
        </div>
      </div>
    </transition-group>

    <div
      v-if="!loading && filteredUsers.length === 0"
      class="text-center py-32 animate-pulse"
    >
      <div class="text-slate-700 mb-4 flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
        </svg>
      </div>
      <p class="text-slate-500 italic text-xl">No users match your criteria.</p>
    </div>
  </div>
</template>
