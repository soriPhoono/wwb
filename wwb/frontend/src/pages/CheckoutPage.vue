<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useCart } from "../composables/useCart";
import { loadStripe } from "@stripe/stripe-js";

const { cart, cartTotal, clearCart } = useCart();
const router = useRouter();

const stripe = ref(null);
const elements = ref(null);
const cardElement = ref(null);
const loading = ref(false);
const error = ref(null);

const shippingDetails = ref({
  fullName: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
});

const isFormValid = computed(() => {
  return (
    shippingDetails.value.fullName &&
    shippingDetails.value.email &&
    shippingDetails.value.address &&
    shippingDetails.value.city &&
    shippingDetails.value.state &&
    shippingDetails.value.zipCode &&
    shippingDetails.value.phone
  );
});

onMounted(async () => {
  // Check if cart is empty, if so redirect to shop
  if (cart.value.length === 0) {
    router.push("/shop");
    return;
  }

  const publishableKey =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
  stripe.value = await loadStripe(publishableKey);

  if (stripe.value) {
    elements.value = stripe.value.elements();
    cardElement.value = elements.value.create("card", {
      style: {
        base: {
          color: "#ffffff",
          fontFamily: '"Inter", sans-serif',
          fontSmoothing: "antialiased",
          fontSize: "16px",
          "::placeholder": {
            color: "#94a3b8",
          },
        },
        invalid: {
          color: "#ef4444",
          iconColor: "#ef4444",
        },
      },
    });
    cardElement.value.mount("#card-element");
  }
});

const handleCheckout = async () => {
  if (!isFormValid.value) {
    error.value = "Please fill in all shipping details.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // 1. Create Payment Intent on backend
    const res = await fetch("/api/orders/payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingDetails: shippingDetails.value }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to initiate payment.");
    }

    const { clientSecret } = await res.json();

    // 2. Confirm payment with Stripe
    const result = await stripe.value.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement.value,
        billing_details: {
          name: shippingDetails.value.fullName,
          email: shippingDetails.value.email,
          phone: shippingDetails.value.phone,
          address: {
            line1: shippingDetails.value.address,
            city: shippingDetails.value.city,
            state: shippingDetails.value.state,
            postal_code: shippingDetails.value.zipCode,
          },
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.paymentIntent.status === "succeeded") {
      // 3. Finalize order on backend
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingDetails: shippingDetails.value,
          paymentIntentId: result.paymentIntent.id,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(
          data.error ||
            "Payment succeeded but order creation failed. Please contact support.",
        );
      }

      const orderData = await orderRes.json();

      // 4. Success! Clear cart and redirect
      clearCart();
      router.push({
        name: "account",
        query: { orderSuccess: "true", orderId: orderData.orderId },
      });
    }
  } catch (err) {
    console.error("Checkout error:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleTestCheckout = async () => {
  if (!isFormValid.value) {
    error.value = "Please fill in shipping details first.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    // Directly call the order creation endpoint with a mock ID
    // The backend will accept this if BYPASS_PAYMENT_VERIFICATION is 'true'
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingDetails: shippingDetails.value,
        paymentIntentId: "pi_test_bypass", // This is the mock ID
      }),
    });

    if (!orderRes.ok) {
      const data = await orderRes.json();
      throw new Error(data.error || "Test checkout failed.");
    }

    const orderData = await orderRes.json();
    clearCart();
    router.push({
      name: "account",
      query: { orderSuccess: "true", orderId: orderData.orderId },
    });
  } catch (err) {
    console.error("Test Checkout error:", err);
    error.value = "Test Mode Error: " + err.message;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen pt-10 pb-20">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <header class="mb-12">
        <h1
          class="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight"
        >
          Checkout
        </h1>
        <p class="text-slate-400 text-lg max-w-2xl">
          Complete your order by providing shipping and payment details.
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Shipping Section -->
          <section
            class="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl p-8 md:p-10"
          >
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white m-0">
                Shipping Information
              </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >Full Name</label
                >
                <input
                  v-model="shippingDetails.fullName"
                  type="text"
                  placeholder="John Doe"
                  class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >Email Address</label
                >
                <input
                  v-model="shippingDetails.email"
                  type="email"
                  placeholder="john@example.com"
                  class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                />
              </div>
              <div class="md:col-span-2 flex flex-col gap-2">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >Street Address</label
                >
                <input
                  v-model="shippingDetails.address"
                  type="text"
                  placeholder="123 Luxury Ave"
                  class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >City</label
                >
                <input
                  v-model="shippingDetails.city"
                  type="text"
                  placeholder="Denton"
                  class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                    >State</label
                  >
                  <input
                    v-model="shippingDetails.state"
                    type="text"
                    placeholder="TX"
                    class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <label
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                    >ZIP Code</label
                  >
                  <input
                    v-model="shippingDetails.zipCode"
                    type="text"
                    placeholder="76201"
                    class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  />
                </div>
              </div>
              <div class="md:col-span-2 flex flex-col gap-2">
                <label
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1"
                  >Phone Number</label
                >
                <input
                  v-model="shippingDetails.phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  class="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                />
              </div>
            </div>
          </section>

          <!-- Payment Section -->
          <section
            class="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl p-8 md:p-10"
          >
            <div class="flex items-center gap-4 mb-8">
              <div
                class="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-white m-0">Payment Details</h2>
            </div>

            <div
              class="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-6"
            >
              <div id="card-element"></div>
            </div>

            <div
              v-if="error"
              class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold mb-6 flex items-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ error }}
            </div>

            <p class="text-slate-500 text-xs text-center">
              Your payment information is securely processed by Stripe. We never
              store your card details.
            </p>
          </section>
        </div>

        <!-- Sidebar / Summary -->
        <div class="space-y-8">
          <section
            class="bg-slate-900/40 backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl p-8 flex flex-col sticky top-28"
          >
            <h2 class="text-xl font-bold text-white mb-6">Order Summary</h2>

            <div
              class="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar"
            >
              <div
                v-for="item in cart"
                :key="item.productId || item._id"
                class="flex gap-4"
              >
                <div
                  class="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden shrink-0"
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
                      class="h-6 w-6 text-slate-600"
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
                  <h4 class="text-sm font-bold text-white truncate">
                    {{ item.name }}
                  </h4>
                  <p class="text-xs text-slate-400">Qty: {{ item.quantity }}</p>
                  <p class="text-sm font-bold text-blue-400 mt-1">
                    ${{ (item.price * item.quantity).toFixed(2) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-3 border-t border-white/5 pt-6 mb-8">
              <div class="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${{ cartTotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span
                  class="text-green-400 font-bold uppercase text-[10px] tracking-wider mt-1"
                  >Free</span
                >
              </div>
              <div
                class="flex justify-between text-xl font-black text-white pt-2"
              >
                <span>Total</span>
                <span class="text-blue-400">${{ cartTotal.toFixed(2) }}</span>
              </div>
            </div>

            <button
              @click="handleCheckout"
              :disabled="loading || !isFormValid"
              class="w-full bg-blue-600 text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.2)] hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
            >
              <span
                v-if="loading"
                class="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"
              ></span>
              <span v-else>Complete Order</span>
            </button>

            <!-- Test Checkout Bypass Button -->
            <button
              @click="handleTestCheckout"
              :disabled="loading || !isFormValid"
              class="w-full mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold py-4 rounded-2xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clip-rule="evenodd"
                />
              </svg>
              Test Checkout (Bypass Stripe)
            </button>

            <button
              @click="router.push('/shop')"
              class="w-full mt-4 bg-transparent text-slate-400 hover:text-white font-bold py-2 transition-colors text-sm"
            >
              Back to Shop
            </button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#card-element {
  width: 100%;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
