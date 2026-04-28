<script setup></script>

<template>
  <section
    id="home"
    class="bg-slate-950 py-20 lg:py-32 relative overflow-hidden"
  >
    <!-- Background Glow -->
    <div
      class="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse"
    ></div>
    <div
      class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"
    ></div>
    <div
      class="container-custom grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-12 items-center relative z-10"
    >
      <div>
        <span
          class="eyebrow text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest"
          >Course Project Proposal Demo</span
        >
        <h2
          class="section-heading text-white !text-4xl md:!text-5xl lg:!text-6xl !leading-tight mb-6"
        >
          Designing a secure e-commerce website with MFA and protected payments
        </h2>
        <p
          class="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed"
        >
          This homepage demonstrates the base concept for a secure online store.
          It includes a product catalog, cookie-based shopping cart, checkout
          flow mockup, and a security-first design focused on authentication and
          safe payment handling.
        </p>

        <div class="flex gap-4 flex-wrap mb-12">
          <RouterLink to="/shop" class="btn-primary">
            Browse Products
          </RouterLink>
          <a class="btn-secondary" href="#security">View Security Features</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            class="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/5"
          >
            <strong class="block mb-2 text-white font-bold">MFA Ready</strong>
            <span class="text-sm text-slate-400 leading-snug block"
              >Supports login verification with a second factor</span
            >
          </div>
          <div
            class="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/5"
          >
            <strong class="block mb-2 text-white font-bold"
              >Safe Payments</strong
            >
            <span class="text-sm text-slate-400 leading-snug block"
              >Built to work with a secure external payment gateway</span
            >
          </div>
          <div
            class="bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/5"
          >
            <strong class="block mb-2 text-white font-bold"
              >Cart Persistence</strong
            >
            <span class="text-sm text-slate-400 leading-snug block"
              >Cookie-based cart keeps demo items saved between visits</span
            >
          </div>
        </div>
      </div>

      <div
        class="bg-slate-900 p-8 md:p-10 rounded-3xl shadow-2xl border-t-8 border-t-blue-600 border border-white/5 transform lg:-rotate-1 lg:hover:rotate-0 transition-transform duration-300"
      >
        <h3 class="mt-0 mb-6 text-2xl font-bold text-white">
          Proposed Core Features
        </h3>
        <ul class="pl-5 m-0 space-y-3 text-slate-400 font-medium">
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
