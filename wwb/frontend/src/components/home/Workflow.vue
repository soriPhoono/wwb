<script setup></script>

<template>
  <section id="workflow" class="py-20 relative">
    <div class="container-custom">
      <div class="mb-14 text-center md:text-left">
        <span class="eyebrow">Store Workflow</span>
        <h2 class="section-heading text-slate-900">
          How the secure buying process would work
        </h2>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative"
      >
        <!-- Connecting line for larger screens -->
        <div
          class="hidden lg:block absolute top-12 left-10 right-10 h-1 bg-white/5 -z-10 rounded-full"
        ></div>

        <div class="card-base relative overflow-hidden group z-10">
          <div
            class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"
          ></div>
          <span
            class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-600/30"
            >1</span
          >
          <h3 class="mt-0 mb-3 text-xl font-bold text-white relative z-10">
            Create Account
          </h3>
          <p class="text-slate-400 m-0 leading-relaxed relative z-10">
            Users register and create login credentials for the site.
          </p>
        </div>

        <div class="card-base relative overflow-hidden group z-10">
          <div
            class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"
          ></div>
          <span
            class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-600/30"
            >2</span
          >
          <h3 class="mt-0 mb-3 text-xl font-bold text-white relative z-10">
            Verify Identity
          </h3>
          <p class="text-slate-400 m-0 leading-relaxed relative z-10">
            Users complete MFA to strengthen account protection.
          </p>
        </div>

        <div class="card-base relative overflow-hidden group z-10">
          <div
            class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"
          ></div>
          <span
            class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-600/30"
            >3</span
          >
          <h3 class="mt-0 mb-3 text-xl font-bold text-white relative z-10">
            Build Cart
          </h3>
          <p class="text-slate-400 m-0 leading-relaxed relative z-10">
            Items are added to the cart and tracked for checkout.
          </p>
        </div>

        <div class="card-base relative overflow-hidden group z-10">
          <div
            class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"
          ></div>
          <span
            class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-600/30"
            >4</span
          >
          <h3 class="mt-0 mb-3 text-xl font-bold text-white relative z-10">
            Secure Payment
          </h3>
          <p class="text-slate-400 m-0 leading-relaxed relative z-10">
            Payment is sent through an external secure processor.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
