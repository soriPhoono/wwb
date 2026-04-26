<script setup></script>

<template>
  <section
    id="home"
    class="bg-gradient-to-br from-blue-50 via-white to-slate-50 py-20 lg:py-28 relative overflow-hidden"
  >
    <div
      class="max-w-[1120px] w-[92%] mx-auto grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-center relative z-10"
    >
      <div>
        <span
          class="inline-block mb-4 uppercase tracking-wider text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1.5 rounded-full shadow-sm"
          >Course Project Proposal Demo</span
        >
        <h2
          class="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 mb-6 tracking-tight"
        >
          Designing a secure e-commerce website with MFA and protected payments
        </h2>
        <p
          class="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed"
        >
          This homepage demonstrates the base concept for a secure online store.
          It includes a product catalog, cookie-based shopping cart, checkout
          flow mockup, and a security-first design focused on authentication and
          safe payment handling.
        </p>

        <div class="flex gap-4 flex-wrap mb-12">
          <a
            class="inline-block text-center no-underline px-8 py-3.5 font-bold rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-200"
            href="#catalog"
            >Browse Products</a
          >
          <a
            class="inline-block text-center no-underline px-8 py-3.5 font-bold rounded-xl bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            href="#security"
            >View Security Features</a
          >
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50"
          >
            <strong class="block mb-2 text-slate-900 font-bold"
              >MFA Ready</strong
            >
            <span class="text-sm text-slate-600 leading-snug block"
              >Supports login verification with a second factor</span
            >
          </div>
          <div
            class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50"
          >
            <strong class="block mb-2 text-slate-900 font-bold"
              >Safe Payments</strong
            >
            <span class="text-sm text-slate-600 leading-snug block"
              >Built to work with a secure external payment gateway</span
            >
          </div>
          <div
            class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50"
          >
            <strong class="block mb-2 text-slate-900 font-bold"
              >Cart Persistence</strong
            >
            <span class="text-sm text-slate-600 leading-snug block"
              >Cookie-based cart keeps demo items saved between visits</span
            >
          </div>
        </div>
      </div>

      <div
        class="bg-white p-8 md:p-10 rounded-3xl shadow-2xl shadow-slate-200/60 border-t-8 border-t-blue-600 border border-slate-100 transform lg:-rotate-1 lg:hover:rotate-0 transition-transform duration-300"
      >
        <h3 class="mt-0 mb-6 text-2xl font-bold text-slate-800">
          Proposed Core Features
        </h3>
        <ul class="pl-5 m-0 space-y-3 text-slate-600 font-medium">
          <li class="pl-1">Product catalog and featured items</li>
          <li class="pl-1">User registration and secure login</li>
          <li class="pl-1">Shopping cart and checkout flow</li>
          <li class="pl-1">MFA for stronger account protection</li>
          <li class="pl-1">External payment processor integration</li>
          <li class="pl-1">Security awareness built into the design</li>
        </ul>
      </div>
    </div>
  </section>
</template>
