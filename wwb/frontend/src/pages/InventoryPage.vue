<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuth } from "../composables/useAuth";

const { user } = useAuth();
const products = ref([]);
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");

// Form state
const showModal = ref(false);
const editingProduct = ref(null);
const form = ref({
  name: "",
  description: "",
  price: 0,
  category: "General",
  stock: 0,
  isActive: true,
  image: null,
  productId: null,
});

const imagePreview = ref(null);
const imageFile = ref(null);
const isSubmitting = ref(false);

async function fetchProducts() {
  loading.value = true;
  try {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error("Failed to fetch products");
    products.value = await res.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function handleImageChange(e) {
  const file = e.target.files[0];
  if (!file) return;

  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function uploadImage() {
  if (!imageFile.value) return form.value.image;

  const formData = new FormData();
  formData.append("image", imageFile.value);

  const res = await fetch("/api/products/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Image upload failed");
  const data = await res.json();
  return data.url;
}

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const imageUrl = await uploadImage();
    const productData = { ...form.value, image: imageUrl };

    const url = editingProduct.value
      ? `/api/products/${editingProduct.value._id}`
      : "/api/products";
    const method = editingProduct.value ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save product");
    }

    await fetchProducts();
    closeModal();
  } catch (err) {
    alert(err.message);
  } finally {
    isSubmitting.value = false;
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete product");
    products.value = products.value.filter((p) => p._id !== id);
  } catch (err) {
    alert(err.message);
  }
}

function openAddModal() {
  editingProduct.value = null;
  form.value = {
    name: "",
    description: "",
    price: 0,
    category: "General",
    stock: 0,
    isActive: true,
    image: null,
    productId: Math.floor(Math.random() * 1000000), // Temp numeric ID
  };
  imagePreview.value = null;
  imageFile.value = null;
  showModal.value = true;
}

function openEditModal(product) {
  editingProduct.value = product;
  form.value = { ...product };
  imagePreview.value = product.image;
  imageFile.value = null;
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingProduct.value = null;
}

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const q = searchQuery.value.toLowerCase();
  return products.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  );
});

onMounted(fetchProducts);
</script>

<template>
  <div
    class="max-w-7xl mx-auto px-4 py-16 min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_400px)]"
  >
    <div
      class="flex flex-col md:flex-row justify-between items-center mb-12 gap-6"
    >
      <div>
        <h1
          class="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent"
        >
          Inventory
        </h1>
        <p class="text-slate-400 mt-2">
          Manage your site's available items and stock
        </p>
        <div class="mt-8 flex gap-4">
          <router-link
            to="/admin"
            class="px-6 py-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all font-bold"
          >
            Users
          </router-link>
          <router-link
            to="/admin/inventory"
            class="px-6 py-2 rounded-full border border-blue-500/30 bg-blue-500 text-white font-bold"
          >
            Inventory
          </router-link>
        </div>
      </div>
      <button
        @click="openAddModal"
        class="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
      >
        <span class="text-2xl">+</span> Add New Item
      </button>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-col sm:flex-row gap-5 mb-12 items-center px-6 py-4 bg-slate-900/30 card-premium glass"
    >
      <div class="flex-1 w-full">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search inventory..."
          class="w-full bg-slate-900/60 border border-white/10 px-6 py-3 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>
      <div class="text-slate-500 text-sm font-medium">
        Showing {{ filteredProducts.length }} items
      </div>
    </div>

    <!-- Product Grid -->
    <div v-if="loading" class="text-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"
      ></div>
    </div>

    <div
      v-else-if="filteredProducts.length === 0"
      class="text-center py-20 text-slate-500 italic card-premium glass"
    >
      No products found. Start by adding one!
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div
        v-for="product in filteredProducts"
        :key="product._id"
        class="card-premium glass group overflow-hidden flex flex-col"
      >
        <div class="aspect-video overflow-hidden relative bg-slate-800">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-slate-600 italic"
          >
            No image
          </div>
          <div
            class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-md"
          >
            {{ product.category }}
          </div>
        </div>

        <div class="p-6 flex-1 flex flex-col">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-white">{{ product.name }}</h3>
            <span class="text-xl font-black text-blue-400"
              >${{ product.price }}</span
            >
          </div>
          <p class="text-slate-400 text-sm line-clamp-2 mb-4">
            {{ product.description }}
          </p>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <span
                class="text-[10px] uppercase tracking-wider text-slate-500 block mb-1"
                >Stock</span
              >
              <span
                class="text-white font-bold"
                :class="{ 'text-red-400': product.stock === 0 }"
                >{{ product.stock }} units</span
              >
            </div>
            <div class="bg-slate-900/40 p-3 rounded-xl border border-white/5">
              <span
                class="text-[10px] uppercase tracking-wider text-slate-500 block mb-1"
                >Status</span
              >
              <span
                :class="product.isActive ? 'text-green-400' : 'text-yellow-400'"
                class="font-bold"
              >
                {{ product.isActive ? "Active" : "Hidden" }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 mt-auto">
            <button
              @click="openEditModal(product)"
              class="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all border border-white/10"
            >
              Edit
            </button>
            <button
              @click="deleteProduct(product._id)"
              class="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-5 py-3 rounded-xl font-bold transition-all border border-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        class="absolute inset-0 bg-black/80 backdrop-blur-sm"
        @click="closeModal"
      ></div>
      <div
        class="card-premium glass w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div
          class="p-6 border-b border-white/10 flex justify-between items-center"
        >
          <h2 class="text-2xl font-black text-white">
            {{ editingProduct ? "Edit Item" : "New Item" }}
          </h2>
          <button
            @click="closeModal"
            class="text-slate-400 hover:text-white text-3xl"
          >
            &times;
          </button>
        </div>

        <form
          @submit.prevent="handleSubmit"
          class="p-6 overflow-y-auto space-y-6"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label
                class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                >Item Name</label
              >
              <input
                v-model="form.name"
                required
                type="text"
                class="w-full bg-slate-900/60 border border-white/10 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                >Category</label
              >
              <input
                v-model="form.category"
                required
                type="text"
                class="w-full bg-slate-900/60 border border-white/10 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                >Price ($)</label
              >
              <input
                v-model.number="form.price"
                required
                type="number"
                step="0.01"
                class="w-full bg-slate-900/60 border border-white/10 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-sm font-bold text-slate-400 uppercase tracking-wider"
                >Stock Level</label
              >
              <input
                v-model.number="form.stock"
                required
                type="number"
                class="w-full bg-slate-900/60 border border-white/10 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-bold text-slate-400 uppercase tracking-wider"
              >Description</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full bg-slate-900/60 border border-white/10 p-4 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
            ></textarea>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm font-bold text-slate-400 uppercase tracking-wider"
              >Item Image</label
            >
            <div class="flex flex-col md:flex-row gap-6 items-start">
              <div
                class="w-full md:w-48 aspect-video bg-slate-900/60 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative"
              >
                <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-slate-600 text-xs text-center px-4"
                  >Click to upload image</span
                >
                <input
                  type="file"
                  @change="handleImageChange"
                  class="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                />
              </div>
              <div class="flex-1 text-xs text-slate-500 space-y-2">
                <p>Supports: JPG, PNG, WEBP, GIF</p>
                <p>Max size: 5MB</p>
                <button
                  type="button"
                  @click="
                    imagePreview = null;
                    imageFile = null;
                    form.image = null;
                  "
                  class="text-red-400 hover:underline"
                >
                  Clear Image
                </button>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <input
              type="checkbox"
              v-model="form.isActive"
              id="isActive"
              class="w-5 h-5 accent-blue-500"
            />
            <label for="isActive" class="text-white font-bold cursor-pointer"
              >Visible for customers</label
            >
          </div>

          <div class="pt-6 flex gap-4">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {{
                isSubmitting
                  ? "Saving..."
                  : editingProduct
                    ? "Update Item"
                    : "Add Item"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
