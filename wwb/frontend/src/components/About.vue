<script setup>
</script>

<template>
  <section id="about" class="py-20 bg-slate-50 relative border-t border-slate-100">
    <div class="max-w-[1120px] w-[92%] mx-auto grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-12 items-start">
      <div>
        <span class="inline-block mb-3 uppercase tracking-wider text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">About the Project</span>
        <h2 class="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Why this homepage fits the first half of the proposal</h2>
        <p class="text-lg text-slate-600 leading-relaxed mb-0">
          This version focuses on the opening portion of the project by
          showing the selected e-commerce concept, core website scope,
          initial shopping experience, and major security goals. It is meant
          to be a strong starting point for later additions such as full
          login, MFA screens, checkout, and backend integration.
        </p>
      </div>

      <div class="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <h3 class="mt-0 mb-6 text-2xl font-bold text-slate-900">Current Demo Includes</h3>
        <ul class="pl-5 m-0 space-y-4 text-slate-600 font-medium">
          <li class="pl-2 relative before:content-[''] before:absolute before:-left-5 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">Homepage hero and secure store overview</li>
          <li class="pl-2 relative before:content-[''] before:absolute before:-left-5 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">Catalog section with products</li>
          <li class="pl-2 relative before:content-[''] before:absolute before:-left-5 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">Cookie-based shopping cart</li>
          <li class="pl-2 relative before:content-[''] before:absolute before:-left-5 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">Security overview section</li>
          <li class="pl-2 relative before:content-[''] before:absolute before:-left-5 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full">Checkout workflow preview</li>
        </ul>
      </div>
    </div>
  </section>
</template>
