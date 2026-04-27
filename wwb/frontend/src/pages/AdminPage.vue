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
    class="max-w-7xl mx-auto px-4 py-16 min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_400px),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.15),transparent_400px)]"
  >
    <div class="mb-14 text-center animate-[fadeInDown_0.8s_ease-out]">
      <h1
        class="text-4xl sm:text-6xl font-black mb-3 tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
      >
        Admin Dashboard
      </h1>
      <p class="text-slate-400 text-lg max-w-xl mx-auto">
        Manage user roles and platform permissions
      </p>
      <div class="mt-8 flex justify-center gap-4">
        <router-link
          to="/admin"
          class="px-6 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold"
          active-class="bg-blue-500 text-white"
        >
          Users
        </router-link>
        <router-link
          to="/admin/inventory"
          class="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all font-bold"
          active-class="bg-blue-500 text-white border-blue-500"
        >
          Inventory
        </router-link>
      </div>
    </div>

    <div
      class="flex flex-col sm:flex-row gap-5 mb-12 items-center px-6 py-4 bg-slate-900/30 card-premium glass"
    >
      <div class="flex-1 w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by email..."
          class="w-full bg-slate-900/60 border border-white/10 px-6 py-3.5 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
        />
      </div>
      <button
        @click="fetchData"
        class="w-full sm:w-auto bg-gradient-to-br from-blue-500 to-blue-700 text-white px-7 py-3.5 rounded-2xl font-bold hover:-translate-y-0.5 hover:shadow-blue-600/40 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
        :disabled="loading"
      >
        <span v-if="loading">Loading...</span>
        <span v-else>Refresh</span>
      </button>
    </div>

    <div
      v-if="error"
      class="mb-6 p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl"
    >
      {{ error }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="user in filteredUsers"
        :key="user._id"
        class="flex flex-col gap-6 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-2xl relative overflow-hidden card-premium glass group border-t-4 border-t-transparent hover:border-t-blue-500"
      >
        <div class="flex gap-5 items-center">
          <div
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-blue-500/20 shrink-0"
          >
            {{ user.email[0].toUpperCase() }}
          </div>
          <div class="min-w-0">
            <h3 class="text-xl font-bold text-slate-100 truncate m-0">
              {{ user.email }}
            </h3>
            <p class="text-[0.7rem] text-slate-500 font-mono mt-1 truncate m-0">
              ID: {{ user._id }}
            </p>
            <p class="text-xs text-slate-400 mt-1 m-0">
              Joined: {{ new Date(user.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div
          class="flex flex-wrap gap-3 p-5 bg-slate-900/50 rounded-2xl border border-white/5"
        >
          <label
            v-for="role in availableRoles"
            :key="role.id"
            class="flex items-center gap-2.5 cursor-pointer text-sm font-semibold p-2 rounded-xl transition-colors text-slate-300 hover:bg-white/5 hover:text-white"
            :title="role.description"
          >
            <input
              type="checkbox"
              :checked="user.roles.includes(role.id)"
              @click.prevent="toggleRole(user, role.id)"
              :disabled="role.id === 'admin' && user._id === currentUser?._id"
              class="w-5 h-5 accent-blue-500 cursor-pointer"
            />
            <span>{{ role.name }}</span>
          </label>
        </div>

        <div class="mt-auto">
          <button
            @click="deleteUser(user._id)"
            class="w-full bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
            :disabled="user._id === currentUser?._id"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="!loading && filteredUsers.length === 0"
      class="text-center py-20 text-slate-500 italic"
    >
      No users found matching your search.
    </div>
  </div>
</template>
