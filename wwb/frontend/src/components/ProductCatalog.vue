<script setup>
import { useCart, products } from "../composables/useCart";

const { addToCart, canUseCart } = useCart();
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
          v-for="product in products"
          :key="product.id"
          class="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-300/50 hover:-translate-y-1.5 transition-all duration-300 border border-slate-100 flex flex-col group"
        >
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
          <div class="flex items-center justify-between mt-auto mb-5">
            <p class="text-3xl font-extrabold text-slate-900 m-0">
              ${{ product.price.toFixed(2) }}
            </p>
          </div>
          <button
            v-if="canUseCart"
            class="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
            @click="addToCart(product.id)"
          >
            Add to Cart
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
