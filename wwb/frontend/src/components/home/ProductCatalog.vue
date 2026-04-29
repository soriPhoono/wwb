<script setup>
import { ref, onMounted } from "vue";
import { useCart } from "../../composables/useCart";
const { addToCart, canUseCart, getAvailableStock } = useCart();

const topProducts = ref([]);

onMounted(async () => {
  try {
    const res = await fetch("/api/products/top");
    if (res.ok) {
      topProducts.value = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch top products:", err);
  }
});
</script>

<template>
  <section id="catalog" class="py-20 relative">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <div class="mb-14 text-center md:text-left">
        <span
          class="inline-block mb-3 uppercase tracking-wider text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full"
          >Product Catalog</span
        >
        <h2
          class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-5 tracking-tight"
        >
          Most Purchased Items
        </h2>
        <p
          class="text-slate-400 max-w-2xl text-lg leading-relaxed mx-auto md:mx-0"
        >
          Check out our most popular items based on customer purchases.
        </p>
      </div>

      <div
        id="product-list"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        <article
          v-for="product in topProducts"
          :key="product.productId || product._id || product.id"
          class="bg-slate-900/40 rounded-3xl shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 border border-white/5 flex flex-col group overflow-hidden"
        >
          <div class="aspect-video overflow-hidden bg-slate-800/50 relative">
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
          </div>
          <div class="p-6 flex flex-col flex-1">
            <h3
              class="mt-0 mb-2 text-xl font-bold text-white group-hover:text-blue-400 transition-colors"
            >
              {{ product.name }}
            </h3>
            <p
              class="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-3 bg-blue-500/10 border border-blue-500/20 w-max px-2 py-1 rounded-md"
            >
              {{ product.category }}
            </p>
            <p class="text-slate-400 text-sm mb-6 flex-1 leading-relaxed">
              {{ product.description }}
            </p>
            <div class="mt-auto mb-5">
              <div class="flex items-center justify-between mb-1">
                <p class="text-3xl font-extrabold text-white m-0">
                  ${{ (product.price || 0).toFixed(2) }}
                </p>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border"
                  :class="
                    getAvailableStock(
                      product.productId || product._id || product.id,
                    ) > 0
                      ? 'text-green-400 border-green-500/20 bg-green-500/10'
                      : 'text-red-400 border-red-500/20 bg-red-500/10'
                  "
                >
                  {{
                    getAvailableStock(
                      product.productId || product._id || product.id,
                    )
                  }}
                  In Stock
                </span>
              </div>
              <p
                v-if="product.claimedCount > 0"
                class="text-[10px] text-slate-400 font-medium italic"
              >
                {{ product.claimedCount }} total units currently in carts
              </p>
            </div>
            <button
              v-if="canUseCart"
              class="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-blue-500/40 transition-all duration-200 cursor-pointer"
              @click="addToCart(product.productId || product._id || product.id)"
            >
              Add to Cart
            </button>
          </div>
        </article>
      </div>

      <div class="mt-16 text-center">
        <RouterLink
          to="/shop"
          class="inline-block bg-transparent text-white font-bold py-4 px-10 rounded-2xl border-2 border-white/20 hover:border-blue-500 hover:bg-blue-500 transition-all duration-300 shadow-lg shadow-blue-500/10 no-underline text-lg"
        >
          View Full Collection
        </RouterLink>
      </div>
    </div>
  </section>
</template>
