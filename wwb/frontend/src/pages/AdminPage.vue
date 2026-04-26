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
  <div class="admin-container">
    <div class="admin-header">
      <h1>Admin Dashboard</h1>
      <p>Manage user roles and platform permissions</p>
    </div>

    <div class="admin-controls card glass">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users by email..."
          class="search-input"
        />
      </div>
      <button @click="fetchData" class="refresh-btn" :disabled="loading">
        <span v-if="loading">Loading...</span>
        <span v-else>Refresh</span>
      </button>
    </div>

    <div v-if="error" class="error-msg card">
      {{ error }}
    </div>

    <div class="users-grid">
      <div
        v-for="user in filteredUsers"
        :key="user._id"
        class="user-card card glass"
      >
        <div class="user-info">
          <div class="user-avatar">
            {{ user.email[0].toUpperCase() }}
          </div>
          <div class="user-details">
            <h3 class="user-email">{{ user.email }}</h3>
            <p class="user-id">ID: {{ user._id }}</p>
            <p class="user-date">
              Joined: {{ new Date(user.createdAt).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div class="role-management">
          <label
            v-for="role in availableRoles"
            :key="role.id"
            class="role-toggle"
            :title="role.description"
          >
            <input
              type="checkbox"
              :checked="user.roles.includes(role.id)"
              @click.prevent="toggleRole(user, role.id)"
              :disabled="role.id === 'admin' && user._id === currentUser?._id"
            />
            <span class="toggle-label">{{ role.name }}</span>
          </label>
        </div>

        <div class="user-actions">
          <button
            @click="deleteUser(user._id)"
            class="delete-btn"
            :disabled="user._id === currentUser?._id"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredUsers.length === 0" class="no-results">
      No users found matching your search.
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
  min-height: 100vh;
  background:
    radial-gradient(
      circle at top right,
      rgba(59, 130, 246, 0.15),
      transparent 400px
    ),
    radial-gradient(
      circle at bottom left,
      rgba(139, 92, 246, 0.15),
      transparent 400px
    );
}

.admin-header {
  margin-bottom: 60px;
  text-align: center;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-header h1 {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.admin-header p {
  color: #94a3b8;
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
}

.card {
  border-radius: 28px;
  padding: 28px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.glass {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.admin-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 50px;
  align-items: center;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.3);
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 24px;
  border-radius: 16px;
  color: white;
  font-size: 1.1rem;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(15, 23, 42, 0.8);
  box-shadow:
    0 0 0 4px rgba(59, 130, 246, 0.2),
    0 0 20px rgba(59, 130, 246, 0.2);
  transform: scale(1.01);
}

.refresh-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 30px;
}

.user-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.user-card:hover::before {
  opacity: 1;
}

.user-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.user-avatar {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 900;
  color: white;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
}

.user-email {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f8fafc;
  word-break: break-all;
}

.user-id {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #64748b;
  font-family: monospace;
}

.user-date {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.role-management {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.role-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 12px;
  transition: background 0.2s ease;
  color: #cbd5e1;
}

.role-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.role-toggle input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #3b82f6;
}

.user-actions {
  margin-top: auto;
}

.delete-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 12px;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
  transform: scale(1.02);
  box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
}

.delete-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.error-msg {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
  margin-bottom: 24px;
}

.no-results {
  text-align: center;
  padding: 60px;
  color: #94a3b8;
  font-style: italic;
}

@media (max-width: 640px) {
  .admin-controls {
    flex-direction: column;
  }
  .refresh-btn {
    width: 100%;
  }
}
</style>
