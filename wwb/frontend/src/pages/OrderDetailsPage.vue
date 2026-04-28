<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const order = ref(null);
const loading = ref(true);
const error = ref(null);

const orderId = route.params.id;
const accessKey = route.query.accessKey;
const orderSuccess = route.query.orderSuccess === "true";

onMounted(async () => {
  if (!orderId || !accessKey) {
    error.value = "Missing order identification. Please check your link.";
    loading.value = false;
    return;
  }

  try {
    const res = await fetch(
      `/api/orders/guest/${orderId}?accessKey=${accessKey}`,
    );
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to load order details.");
    }
    order.value = await res.json();
  } catch (err) {
    console.error("Error loading order:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <div class="min-h-screen pt-10 pb-20">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <!-- Success Message -->
      <div
        v-if="orderSuccess"
        class="mb-12 bg-green-500/10 border border-green-500/20 rounded-[32px] p-8 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div
          class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 class="text-3xl font-black text-white mb-2">Order Confirmed!</h1>
        <p class="text-slate-400 max-w-md">
          Thank you for your purchase. We've received your order and are
          processing it now. A confirmation email will be sent to
          <strong>{{ order?.shippingDetails?.email }}</strong
          >.
        </p>
      </div>

      <header
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h2 class="text-4xl font-black text-white mb-2 tracking-tight">
            Order Details
          </h2>
          <p v-if="order" class="text-slate-400 font-mono text-sm">
            ID: <span class="text-blue-400">{{ order._id }}</span>
          </p>
        </div>
        <div v-if="order" class="flex flex-col items-end">
          <span
            class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"
            >Status</span
          >
          <div
            class="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            :class="{
              'bg-blue-500/10 text-blue-400 border border-blue-500/20':
                order.status === 'pending',
              'bg-green-500/10 text-green-400 border border-green-500/20':
                order.status === 'completed',
              'bg-red-500/10 text-red-400 border border-red-500/20':
                order.status === 'cancelled',
            }"
          >
            {{ order.status }}
          </div>
        </div>
      </header>

      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-20"
      >
        <div
          class="w-12 h-12 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin"
        ></div>
        <p class="text-slate-400 mt-6 font-bold animate-pulse">
          Retrieving order details...
        </p>
      </div>

      <div
        v-else-if="error"
        class="bg-red-500/10 border border-red-500/20 rounded-3xl p-10 text-center"
      >
        <div class="text-red-400 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Something went wrong</h3>
        <p class="text-slate-400 mb-8">{{ error }}</p>
        <button
          @click="router.push('/shop')"
          class="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-slate-200 transition-colors"
        >
          Return to Shop
        </button>
      </div>

      <div
        v-else-if="order"
        class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
      >
        <!-- Order Items -->
        <div class="lg:col-span-2 space-y-8">
          <section
            class="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl p-8 md:p-10"
          >
            <h3 class="text-xl font-bold text-white mb-8">Order Items</h3>
            <div class="space-y-6">
              <div
                v-for="item in order.items"
                :key="item.productId"
                class="flex gap-6 items-center group"
              >
                <div
                  class="w-20 h-20 bg-slate-800 rounded-2xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500"
                >
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-8 w-8 text-slate-600"
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
                <div class="flex-1 min-w-0">
                  <h4 class="text-lg font-bold text-white truncate">
                    {{ item.name }}
                  </h4>
                  <div
                    class="flex items-center gap-4 mt-1 text-slate-400 text-sm"
                  >
                    <span>${{ item.price.toFixed(2) }}</span>
                    <span>&times;</span>
                    <span>{{ item.quantity }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-lg font-black text-white">
                    ${{ (item.price * item.quantity).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-10 pt-10 border-t border-white/5 space-y-4">
              <div class="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${{ order.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span
                  class="text-green-400 font-bold uppercase text-xs tracking-wider"
                  >Free</span
                >
              </div>
              <div
                class="flex justify-between text-2xl font-black text-white pt-4"
              >
                <span>Total Amount</span>
                <span class="text-blue-400"
                  >${{ order.totalAmount.toFixed(2) }}</span
                >
              </div>
            </div>
          </section>
        </div>

        <!-- Order Summary & Info -->
        <aside class="space-y-8">
          <section
            class="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl p-8"
          >
            <h3 class="text-xl font-bold text-white mb-6">Shipping Address</h3>
            <div class="space-y-4">
              <div>
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Customer
                </p>
                <p class="text-white font-medium">
                  {{ order.shippingDetails.fullName }}
                </p>
                <p class="text-slate-400 text-sm">
                  {{ order.shippingDetails.email }}
                </p>
                <p class="text-slate-400 text-sm">
                  {{ order.shippingDetails.phone }}
                </p>
              </div>
              <div class="pt-4 border-t border-white/5">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Address
                </p>
                <p class="text-white font-medium">
                  {{ order.shippingDetails.address }}
                </p>
                <p class="text-white font-medium">
                  {{ order.shippingDetails.city }},
                  {{ order.shippingDetails.state }}
                  {{ order.shippingDetails.zipCode }}
                </p>
              </div>
              <div class="pt-4 border-t border-white/5">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1"
                >
                  Order Date
                </p>
                <p class="text-white font-medium">
                  {{ formatDate(order.createdAt) }}
                </p>
              </div>
            </div>
          </section>

          <button
            @click="router.push('/shop')"
            class="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Continue Shopping
          </button>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
