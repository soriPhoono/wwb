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
      throw new Error(data.error || "Failed to update roles");
    }

    const updatedUser = await res.json();
    const index = users.value.findIndex((u) => u._id === user._id);
    if (index !== -1) users.value[index] = updatedUser;
  } catch (err) {
    alert(err.message);
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
              @change="toggleRole(user, role.id)"
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
  padding: 40px 20px;
  min-height: 80vh;
}

.admin-header {
  margin-bottom: 40px;
  text-align: center;
}

.admin-header h1 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.admin-header p {
  color: #94a3b8;
  font-size: 1.1rem;
}

.card {
  border-radius: 24px;
  padding: 24px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.admin-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  align-items: center;
}

.search-box {
  flex: 1;
}

.search-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.user-card {
  display: flex;
  flex-direction: column;
  gap: 24px;
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
}

.user-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.2);
}

.user-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.user-email {
  margin: 0;
  font-size: 1.2rem;
  word-break: break-all;
}

.user-id,
.user-date {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.role-management {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 16px;
}

.role-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.role-toggle input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.user-actions {
  margin-top: auto;
}

.delete-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 10px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
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
