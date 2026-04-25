<script setup>
import { useCart } from '../composables/useCart';

const { cart, isCartOpen, toggleCart, updateQuantity, removeFromCart, cartTotal } = useCart();
</script>

<template>
  <aside id="cart-panel" class="fixed top-0 right-0 w-[360px] max-w-[95vw] h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.14)] z-[1200] flex flex-col transition-transform duration-300 ease-in-out" :class="isCartOpen ? 'translate-x-0' : 'translate-x-full'">
    <div class="p-5 border-b border-gray-200 flex items-center justify-between">
      <h2 class="m-0 text-xl font-bold text-slate-800">Your Cart</h2>
      <button class="bg-transparent text-2xl leading-none text-slate-500 hover:text-slate-800 cursor-pointer border-none" @click="toggleCart">&times;</button>
    </div>

    <div id="cart-items" class="p-5 overflow-y-auto flex-1">
      <p v-if="cart.length === 0" class="text-slate-500 text-center mt-10">Your cart is empty.</p>
      
      <div v-else class="border border-gray-200 rounded-xl p-4 mb-3 shadow-sm" v-for="item in cart" :key="item.id">
        <div>
          <h4 class="m-0 mb-1.5 font-bold text-slate-800">{{ item.name }}</h4>
          <p class="m-0 text-blue-600 font-semibold">${{ item.price.toFixed(2) }} each</p>
          <div class="flex items-center gap-2 mt-3 flex-wrap">
            <button class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded cursor-pointer border-none transition-colors" @click="updateQuantity(item.id, -1)">-</button>
            <span class="font-semibold w-6 text-center">{{ item.quantity }}</span>
            <button class="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded cursor-pointer border-none transition-colors" @click="updateQuantity(item.id, 1)">+</button>
            <button class="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded cursor-pointer border-none transition-colors ml-auto text-sm font-semibold" @click="removeFromCart(item.id)">Remove</button>
          </div>
        </div>
      </div>
    </div>

    <div class="p-5 border-t border-gray-200 mt-auto bg-slate-50">
      <h3 class="m-0 mb-4 flex justify-between text-lg font-bold text-slate-800">Total: <span class="text-blue-600">${{ cartTotal.toFixed(2) }}</span></h3>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-lg font-bold shadow-md cursor-pointer transition-colors border-none">Demo Checkout</button>
    </div>
  </aside>
</template>
