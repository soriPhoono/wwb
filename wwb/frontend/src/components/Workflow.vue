<script setup>
</script>

<template>
  <section id="workflow" class="py-20 bg-white relative">
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <div class="mb-14 text-center md:text-left">
        <span class="inline-block mb-3 uppercase tracking-wider text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Store Workflow</span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-5 tracking-tight">How the secure buying process would work</h2>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        <!-- Connecting line for larger screens -->
        <div class="hidden lg:block absolute top-12 left-10 right-10 h-1 bg-slate-100 -z-10 rounded-full"></div>
        
        <div class="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group z-10">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"></div>
          <span class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-200">1</span>
          <h3 class="mt-0 mb-3 text-xl font-bold text-slate-900 relative z-10">Create Account</h3>
          <p class="text-slate-600 m-0 leading-relaxed relative z-10">Users register and create login credentials for the site.</p>
        </div>
        
        <div class="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group z-10">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"></div>
          <span class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-200">2</span>
          <h3 class="mt-0 mb-3 text-xl font-bold text-slate-900 relative z-10">Verify Identity</h3>
          <p class="text-slate-600 m-0 leading-relaxed relative z-10">Users complete MFA to strengthen account protection.</p>
        </div>
        
        <div class="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group z-10">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"></div>
          <span class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-200">3</span>
          <h3 class="mt-0 mb-3 text-xl font-bold text-slate-900 relative z-10">Build Cart</h3>
          <p class="text-slate-600 m-0 leading-relaxed relative z-10">Items are added to the cart and tracked for checkout.</p>
        </div>
        
        <div class="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden group z-10">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-blue-600 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-500"></div>
          <span class="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl font-extrabold text-xl mb-6 shadow-lg shadow-blue-200">4</span>
          <h3 class="mt-0 mb-3 text-xl font-bold text-slate-900 relative z-10">Secure Payment</h3>
          <p class="text-slate-600 m-0 leading-relaxed relative z-10">Payment is sent through an external secure processor.</p>
        </div>
      </div>
    </div>
  </section>
</template>
