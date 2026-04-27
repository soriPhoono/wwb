<script setup>
import { computed } from "vue";
import { useCart, products } from "../composables/useCart";
const { addToCart, canUseCart, getAvailableStock } = useCart();

const featuredProducts = computed(() => products.value.slice(0, 4));
</script>

<template>
  <section id="catalog" class="py-20 bg-slate-50 relative">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <div class="mb-14 text-center md:text-left">
        <span
          class="inline-block mb-3 uppercase tracking-wider text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full"
          >Product Catalog</span
        >
        <h2
          class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight"
        >
          Featured items for the secure store demo
        </h2>
        <p
          class="text-slate-600 max-w-2xl text-lg leading-relaxed mx-auto md:mx-0"
        >
          These sample items are shown as a starting point for the storefront.
          Users can add them to the shopping cart and keep them stored with
          cookies.
        </p>
      </div>

      <div
        id="product-list"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        <article
          v-for="product in featuredProducts"
          :key="product.productId || product._id || product.id"
          class="bg-white rounded-3xl shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 flex flex-col group overflow-hidden"
        >
          <div class="aspect-video overflow-hidden bg-slate-100 relative">
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
              class="mt-0 mb-2 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
            >
              {{ product.name }}
            </h3>
            <p
              class="text-xs uppercase tracking-wider text-blue-600 font-bold mb-3 bg-blue-50 w-max px-2 py-1 rounded"
            >
              {{ product.category }}
            </p>
            <p class="text-slate-600 text-sm mb-6 flex-1 leading-relaxed">
              {{ product.description }}
            </p>
            <div class="mt-auto mb-5">
              <div class="flex items-center justify-between mb-1">
                <p class="text-3xl font-extrabold text-slate-900 m-0">
                  ${{ product.price.toFixed(2) }}
                </p>
                <span
                  class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border"
                  :class="
                    getAvailableStock(
                      product.productId || product._id || product.id,
                    ) > 0
                      ? 'text-green-600 border-green-100 bg-green-50/50'
                      : 'text-red-600 border-red-100 bg-red-50/50'
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
              class="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
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
          class="inline-block bg-white text-blue-600 font-bold py-4 px-10 rounded-2xl border-2 border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg shadow-blue-600/10 no-underline text-lg"
        >
          View Full Collection
        </RouterLink>
      </div>
    </div>
  </section>
</template>
