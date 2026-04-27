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
  details: "",
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
    details: "",
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
    class="max-w-7xl mx-auto px-4 py-16 min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_600px),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.1),transparent_600px)]"
  >
    <!-- Header / Hero Section -->
    <div
      class="mb-16 flex flex-col md:flex-row justify-between items-center gap-8 animate-[fadeInDown_0.8s_ease-out]"
    >
      <div class="text-center md:text-left">
        <div
          class="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase"
        >
          Product Management
        </div>
        <h1
          class="text-5xl sm:text-7xl font-black mb-4 tracking-tight text-white"
        >
          Inventory
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Manage your digital catalog, track stock levels, and update product
          specifications in real-time.
        </p>

        <div
          class="mt-10 flex justify-center md:justify-start gap-3 p-1.5 bg-slate-900/40 rounded-full border border-white/5 w-fit backdrop-blur-md shadow-sm"
        >
          <router-link
            to="/admin"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </router-link>
          <router-link
            to="/admin/inventory"
            class="px-8 py-2.5 rounded-full font-bold transition-all duration-300 flex items-center gap-2"
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

      <button
        @click="openAddModal"
        class="group relative bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black transition-all shadow-xl shadow-blue-600/30 flex items-center gap-3 active:scale-95 overflow-hidden"
      >
        <div
          class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
        ></div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Product
      </button>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-col sm:flex-row gap-5 mb-12 items-center p-2 bg-slate-900/30 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl"
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
          placeholder="Search products by name or category..."
          class="w-full bg-white/10 border border-white/5 pl-14 pr-6 py-4 rounded-2xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all placeholder:text-slate-600"
        />
      </div>
      <div
        class="px-6 py-2 bg-white/5 rounded-xl border border-white/5 text-slate-400 font-bold whitespace-nowrap"
      >
        {{ filteredProducts.length }}
        <span class="text-slate-600 font-medium">Results</span>
      </div>
    </div>

    <!-- Product Grid -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center py-32 gap-4"
    >
      <div
        class="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"
      ></div>
      <p
        class="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs"
      >
        Syncing Catalog...
      </p>
    </div>

    <transition-group
      v-else
      tag="div"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-8"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      move-class="transition duration-500 ease-in-out"
    >
      <div
        v-for="product in filteredProducts"
        :key="product._id"
        class="group relative flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3),0_0_20px_rgba(59,130,246,0.1)]"
      >
        <div class="aspect-[16/10] overflow-hidden relative bg-slate-950">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
          <div
            v-else
            class="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="mb-2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span class="text-xs font-black uppercase tracking-tighter"
              >No Media Asset</span
            >
          </div>

          <div
            class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"
          ></div>

          <div class="absolute top-4 left-4">
            <span
              class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg shadow-blue-600/40"
            >
              {{ product.category }}
            </span>
          </div>

          <div
            class="absolute bottom-4 right-6 text-2xl font-black text-white drop-shadow-lg"
          >
            ${{ product.price }}
          </div>
        </div>

        <div class="p-8 flex-1 flex flex-col relative">
          <div class="mb-4">
            <h3
              class="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors truncate"
            >
              {{ product.name }}
            </h3>
            <p class="text-slate-500 text-sm line-clamp-2 mt-2 leading-relaxed">
              {{ product.description }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-8">
            <div
              class="bg-slate-950/40 p-4 rounded-2xl border border-white/5 transition-colors group-hover:border-blue-500/10"
            >
              <span
                class="text-[10px] uppercase tracking-widest text-slate-600 font-black block mb-1"
                >Availability</span
              >
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="
                    product.stock > 0
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  "
                ></div>
                <span class="text-slate-200 font-bold"
                  >{{ product.stock }} Units</span
                >
              </div>
            </div>
            <div
              class="bg-slate-950/40 p-4 rounded-2xl border border-white/5 transition-colors group-hover:border-blue-500/10"
            >
              <span
                class="text-[10px] uppercase tracking-widest text-slate-600 font-black block mb-1"
                >Visibility</span
              >
              <span
                :class="product.isActive ? 'text-blue-400' : 'text-slate-500'"
                class="font-bold"
              >
                {{ product.isActive ? "Live" : "Draft" }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 mt-auto">
            <button
              @click="openEditModal(product)"
              class="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2 group/btn"
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
                class="transition-transform group-hover/btn:rotate-12"
              >
                <path d="M12 20h9" />
                <path
                  d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                />
              </svg>
              Edit
            </button>
            <button
              @click="deleteProduct(product._id)"
              class="bg-red-500/5 hover:bg-red-500 text-red-500/70 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all border border-red-500/10 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20"
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
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition-group>

    <div
      v-if="!loading && filteredProducts.length === 0"
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
          <path d="m21 21-4.3-4.3" />
          <circle cx="11" cy="11" r="8" />
          <path d="m11 8 3 3-3 3" />
          <path d="m8 11 3-3 3 3-3 3z" />
        </svg>
      </div>
      <p class="text-slate-500 italic text-xl">
        No products match your current filters.
      </p>
    </div>

    <!-- Add/Edit Modal -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-slate-950/60"
      >
        <div class="absolute inset-0" @click="closeModal"></div>

        <transition
          appear
          enter-active-class="transition duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
          enter-from-class="opacity-0 scale-90 translate-y-10"
          enter-to-class="opacity-100 scale-100 translate-y-0"
        >
          <div
            class="bg-slate-900 border border-white/10 w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
          >
            <!-- Modal Header -->
            <div
              class="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50"
            >
              <div>
                <h2 class="text-3xl font-black text-white tracking-tight">
                  {{ editingProduct ? "Refine Product" : "Archive New Item" }}
                </h2>
                <p class="text-slate-500 text-sm mt-1">
                  Update the global catalog specifications.
                </p>
              </div>
              <button
                @click="closeModal"
                class="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center border border-white/5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form
              @submit.prevent="handleSubmit"
              class="p-10 overflow-y-auto custom-scrollbar space-y-8"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-3">
                  <label
                    class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                    >Asset Name</label
                  >
                  <input
                    v-model="form.name"
                    required
                    type="text"
                    placeholder="E.g. Quantum Processor"
                    class="w-full bg-slate-950/60 border border-white/5 p-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
                <div class="space-y-3">
                  <label
                    class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                    >Classification</label
                  >
                  <input
                    v-model="form.category"
                    required
                    type="text"
                    placeholder="E.g. Electronics"
                    class="w-full bg-slate-950/60 border border-white/5 p-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
                <div class="space-y-3">
                  <label
                    class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                    >Valuation ($)</label
                  >
                  <div class="relative">
                    <span
                      class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold"
                      >$</span
                    >
                    <input
                      v-model.number="form.price"
                      required
                      type="number"
                      step="0.01"
                      class="w-full bg-slate-950/60 border border-white/5 pl-8 pr-4 py-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                    />
                  </div>
                </div>
                <div class="space-y-3">
                  <label
                    class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                    >Stock Reservoir</label
                  >
                  <input
                    v-model.number="form.stock"
                    required
                    type="number"
                    class="w-full bg-slate-950/60 border border-white/5 p-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div class="space-y-3">
                <label
                  class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Brief Abstract</label
                >
                <textarea
                  v-model="form.description"
                  rows="2"
                  class="w-full bg-slate-950/60 border border-white/5 p-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div class="space-y-3">
                <label
                  class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Technical Manifest (Full Details)</label
                >
                <textarea
                  v-model="form.details"
                  rows="4"
                  class="w-full bg-slate-950/60 border border-white/5 p-4 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/30 outline-none transition-all resize-none font-mono text-sm"
                ></textarea>
              </div>

              <div class="space-y-3">
                <label
                  class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1"
                  >Visual Representation</label
                >
                <div
                  class="flex flex-col md:flex-row gap-8 items-start bg-slate-950/30 p-6 rounded-[24px] border border-white/5"
                >
                  <div
                    class="w-full md:w-56 aspect-[4/3] bg-slate-950/60 rounded-[20px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group/upload"
                  >
                    <img
                      v-if="imagePreview"
                      :src="imagePreview"
                      class="w-full h-full object-cover transition-transform group-hover/upload:scale-110"
                    />
                    <div
                      v-else
                      class="flex flex-col items-center gap-2 p-4 text-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="text-slate-700"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span
                        class="text-slate-700 text-[10px] font-black uppercase"
                        >Upload Media</span
                      >
                    </div>
                    <input
                      type="file"
                      @change="handleImageChange"
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                  </div>
                  <div class="flex-1 space-y-4">
                    <div class="space-y-1">
                      <p class="text-white font-bold text-sm">
                        Media Guidelines
                      </p>
                      <p class="text-slate-500 text-xs leading-relaxed">
                        Optimal aspect ratio 16:10. Supports high-res WEBP, PNG,
                        and JPG up to 10MB.
                      </p>
                    </div>
                    <button
                      v-if="imagePreview"
                      type="button"
                      @click="
                        imagePreview = null;
                        imageFile = null;
                        form.image = null;
                      "
                      class="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-tighter hover:bg-red-500 hover:text-white transition-all"
                    >
                      Purge Media
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="flex items-center gap-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 w-fit"
              >
                <div class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="form.isActive"
                    id="isActive"
                    class="sr-only peer"
                  />
                  <div
                    class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
                  ></div>
                </div>
                <label
                  for="isActive"
                  class="text-white font-bold text-sm cursor-pointer"
                  >Publish to Customer Storefront</label
                >
              </div>

              <div class="pt-8 flex gap-4">
                <button
                  type="button"
                  @click="closeModal"
                  class="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-[24px] font-black transition-all border border-white/5 uppercase tracking-widest text-xs"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="flex-[2] relative bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[24px] font-black transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 uppercase tracking-widest text-xs overflow-hidden active:scale-95"
                >
                  <div
                    v-if="isSubmitting"
                    class="flex items-center justify-center gap-3"
                  >
                    <div
                      class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
                    ></div>
                    Writing to Ledger...
                  </div>
                  <span v-else>{{
                    editingProduct ? "Synchronize Changes" : "Confirm Archive"
                  }}</span>
                </button>
              </div>
            </form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
