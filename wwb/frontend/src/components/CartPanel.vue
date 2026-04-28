<script setup>
import { useCart } from "../composables/useCart";

const {
  cart,
  isCartOpen,
  toggleCart,
  updateQuantity,
  removeFromCart,
  cartTotal,
  canUseCart,
  getAvailableStock,
} = useCart();
</script>

<template>
  <aside
    v-if="canUseCart"
    id="cart-panel"
    class="fixed top-0 right-0 w-[360px] max-w-[95vw] h-full bg-slate-900 shadow-[-10px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5 z-[1200] flex flex-col transition-transform duration-300 ease-in-out"
    :class="isCartOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="p-5 border-b border-white/5 flex items-center justify-between">
      <h2 class="m-0 text-xl font-bold text-white">Your Cart</h2>
      <button
        class="bg-transparent text-2xl leading-none text-slate-500 hover:text-white cursor-pointer border-none"
        @click="toggleCart"
      >
        &times;
      </button>
    </div>

    <div id="cart-items" class="p-5 overflow-y-auto flex-1">
      <p v-if="cart.length === 0" class="text-slate-500 text-center mt-10">
        Your cart is empty.
      </p>

      <div
        v-else
        class="bg-slate-800/40 border border-white/5 rounded-xl p-4 mb-3"
        v-for="item in cart"
        :key="item.productId || item._id || item.id"
      >
        <div>
          <h4 class="m-0 mb-1.5 font-bold text-white">
            {{
              item.name || "Product " + (item.productId || item._id || item.id)
            }}
          </h4>
          <p class="m-0 text-blue-400 font-semibold">
            ${{ (item.price || 0).toFixed(2) }} each
          </p>
          <div class="flex items-center gap-2 mt-3 flex-wrap">
            <button
              class="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded cursor-pointer border-none transition-colors"
              @click="updateQuantity(item.productId || item._id || item.id, -1)"
            >
              -
            </button>
            <span class="font-semibold w-6 text-center">{{
              item.quantity
            }}</span>
            <div
              v-if="
                item.quantity >=
                getAvailableStock(item.productId || item._id || item.id)
              "
              class="w-full text-[9px] text-red-500 font-bold uppercase mt-1"
            >
              Max Stock Reached
            </div>
            <button
              class="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded cursor-pointer border-none transition-colors"
              @click="updateQuantity(item.productId || item._id || item.id, 1)"
            >
              +
            </button>
            <button
              class="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded cursor-pointer border-none transition-colors ml-auto text-sm font-semibold"
              @click="removeFromCart(item.productId || item._id || item.id)"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-5 border-t border-white/10 mt-auto bg-slate-950">
      <h3 class="m-0 mb-4 flex justify-between text-lg font-bold text-white">
        Total:
        <span class="text-blue-400">${{ (cartTotal || 0).toFixed(2) }}</span>
      </h3>
      <router-link
        to="/checkout"
        @click="toggleCart"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-lg font-bold shadow-md cursor-pointer transition-colors border-none text-center block no-underline"
      >
        Proceed to Checkout
      </router-link>
    </div>
  </aside>
</template>
