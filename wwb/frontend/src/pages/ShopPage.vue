<script setup>
import { computed, ref, onMounted } from "vue";
import { useCart, products, fetchProducts } from "../composables/useCart";

const { addToCart, canUseCart, getAvailableStock, getRemainingToClaim } =
  useCart();

const selectedProduct = ref(null);

const loading = ref(true);

onMounted(async () => {
  await fetchProducts();
  loading.value = false;
});

const groupedProducts = computed(() => {
  const groups = {};
  products.value.forEach((p) => {
    const cat = p.category || "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  return groups;
});

const categories = computed(() => Object.keys(groupedProducts.value).sort());

const openModal = (product) => {
  selectedProduct.value = product;
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  selectedProduct.value = null;
  document.body.style.overflow = "auto";
};
</script>

<template>
  <div class="min-h-screen pt-10 pb-20">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <!-- Header -->
      <header class="mb-12 text-center md:text-left">
        <h1
          class="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
        >
          Browse Our Collection
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Explore our wide range of high-quality items, automatically organized
          for your convenience.
        </p>
      </header>

      <!-- Category Navigation -->
      <nav
        class="sticky top-20 z-30 mb-12 bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl shadow-2xl border border-white/5 flex gap-2 overflow-x-auto no-scrollbar"
      >
        <a
          v-for="cat in categories"
          :key="cat"
          :href="'#' + cat.toLowerCase().replace(/\s+/g, '-')"
          class="px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 hover:bg-white/5 hover:text-blue-400 text-slate-400 no-underline"
        >
          {{ cat }}
        </a>
      </nav>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 text-center">
        <div
          class="inline-block w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"
        ></div>
        <p class="text-slate-500 font-medium">Fetching our collection...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="categories.length === 0"
        class="py-20 text-center bg-slate-900/40 rounded-[40px] border border-white/5 shadow-2xl"
      >
        <div
          class="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-white mb-2">No products found</h3>
        <p class="text-slate-500 max-w-md mx-auto">
          We couldn't find any active products in our inventory. Please check
          back later or contact an administrator.
        </p>
      </div>

      <!-- Sections -->
      <div
        v-else
        v-for="cat in categories"
        :key="cat"
        :id="cat.toLowerCase().replace(/\s+/g, '-')"
        class="mb-20 scroll-mt-40"
      >
        <div class="flex items-center gap-4 mb-8">
          <h2 class="text-2xl font-bold text-white m-0">{{ cat }}</h2>
          <div class="h-px bg-white/5 flex-1"></div>
          <span
            class="text-xs font-bold text-slate-400 uppercase tracking-widest"
            >{{ groupedProducts[cat].length }} Items</span
          >
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <article
            v-for="product in groupedProducts[cat]"
            :key="product.productId || product._id || product.id"
            class="bg-slate-900/40 rounded-3xl shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 border border-white/5 flex flex-col group overflow-hidden cursor-pointer"
            @click="openModal(product)"
          >
            <!-- Image Container -->
            <div class="aspect-square overflow-hidden bg-slate-800/50 relative">
              <img
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-slate-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 opacity-20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <!-- Quick Add Overlay -->
              <div
                class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent"
              >
                <button
                  v-if="canUseCart"
                  class="w-full bg-white text-slate-950 font-bold py-3 rounded-xl shadow-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                  @click.stop="
                    addToCart(product.productId || product._id || product.id)
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 100-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                    />
                  </svg>
                  Quick Add
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6 flex flex-col flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-bold text-white m-0 leading-tight">
                  {{ product.name }}
                </h3>
                <p class="text-xl font-black text-blue-400 m-0">
                  ${{ (product.price ?? 0).toFixed(2) }}
                </p>
              </div>
              <p class="text-slate-400 text-sm line-clamp-2 mb-4">
                {{ product.description }}
              </p>

              <!-- Stock Badge -->
              <div class="mt-auto">
                <span
                  class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border"
                  :class="
                    getRemainingToClaim(product) > 0
                      ? 'text-green-400 border-green-500/20 bg-green-500/10'
                      : 'text-red-400 border-red-500/20 bg-red-500/10'
                  "
                >
                  {{ getRemainingToClaim(product) }}
                  Available
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- Product Modal -->
    <Transition name="fade">
      <div
        v-if="selectedProduct"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          @click="closeModal"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative bg-slate-900 w-full max-w-4xl rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          <button
            @click="closeModal"
            class="absolute top-6 right-6 z-10 bg-slate-800/80 hover:bg-slate-700 backdrop-blur shadow-md p-2 rounded-full transition-colors cursor-pointer border-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div class="w-full md:w-1/2 bg-slate-950 h-64 md:h-auto">
            <img
              v-if="selectedProduct.image"
              :src="selectedProduct.image"
              :alt="selectedProduct.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-slate-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-24 w-24 opacity-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <div class="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
            <span
              class="inline-block px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full mb-4 uppercase tracking-widest border border-blue-500/20"
              >{{ selectedProduct.category }}</span
            >
            <h2
              class="text-3xl md:text-4xl font-black text-white mb-2 leading-tight"
            >
              {{ selectedProduct.name }}
            </h2>
            <p class="text-3xl font-extrabold text-blue-400 mb-8">
              ${{ (selectedProduct.price || 0).toFixed(2) }}
            </p>

            <div class="prose prose-slate mb-10">
              <h4
                class="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3"
              >
                Product Description
              </h4>
              <p class="text-slate-400 text-lg leading-relaxed">
                {{ selectedProduct.description }}
              </p>

              <div
                v-if="selectedProduct.details"
                class="mt-6 p-6 bg-slate-950/40 rounded-2xl border border-white/5"
              >
                <h4 class="text-xs font-bold uppercase text-white mb-2">
                  Specifications
                </h4>
                <p class="text-sm text-slate-400 m-0">
                  {{ selectedProduct.details }}
                </p>
              </div>
            </div>

            <div class="mt-auto space-y-4">
              <div
                class="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-white/5"
              >
                <span
                  class="text-sm font-bold text-slate-500 uppercase tracking-widest"
                  >Availability</span
                >
                <span class="font-black text-white"
                  >{{ getRemainingToClaim(selectedProduct) }} Units</span
                >
              </div>

              <button
                v-if="canUseCart"
                class="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                @click="
                  addToCart(
                    selectedProduct.productId ||
                      selectedProduct._id ||
                      selectedProduct.id,
                  )
                "
              >
                Add to Shopping Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
