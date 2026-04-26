<script setup></script>

<template>
  <section
    id="security"
    class="py-20 bg-slate-900 text-white relative border-y border-slate-800"
  >
    <div class="max-w-[1120px] w-[92%] mx-auto">
      <div class="mb-14 text-center md:text-left">
        <span
          class="inline-block mb-3 uppercase tracking-wider text-sm font-bold text-blue-400 tracking-widest"
          >Security Focus</span
        >
        <h2
          class="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight text-white"
        >
          Key e-commerce security challenges and planned protections
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <article
          class="bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1.5 transition-all duration-300 shadow-lg"
        >
          <h3
            class="mt-0 mb-4 text-2xl font-bold text-white flex items-center gap-3"
          >
            <span class="text-3xl">🛡️</span> Account Protection
          </h3>
          <p class="text-slate-300 leading-relaxed mb-0 text-lg">
            User accounts are protected through strong password practices and
            multifactor authentication, reducing the impact of stolen
            credentials.
          </p>
        </article>

        <article
          class="bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1.5 transition-all duration-300 shadow-lg"
        >
          <h3
            class="mt-0 mb-4 text-2xl font-bold text-white flex items-center gap-3"
          >
            <span class="text-3xl">💳</span> Transaction Security
          </h3>
          <p class="text-slate-300 leading-relaxed mb-0 text-lg">
            The checkout design is intended to rely on a trusted payment gateway
            so sensitive card information is handled by a specialized provider.
          </p>
        </article>

        <article
          class="bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1.5 transition-all duration-300 shadow-lg"
        >
          <h3
            class="mt-0 mb-4 text-2xl font-bold text-white flex items-center gap-3"
          >
            <span class="text-3xl">🔑</span> Session Awareness
          </h3>
          <p class="text-slate-300 leading-relaxed mb-0 text-lg">
            Sessions and cart activity should be managed carefully to reduce the
            risk of session hijacking and unauthorized reuse on shared devices.
          </p>
        </article>

        <article
          class="bg-slate-800/80 backdrop-blur p-8 rounded-3xl border border-slate-700 hover:bg-slate-800 hover:border-slate-600 hover:-translate-y-1.5 transition-all duration-300 shadow-lg"
        >
          <h3
            class="mt-0 mb-4 text-2xl font-bold text-white flex items-center gap-3"
          >
            <span class="text-3xl">✓</span> Input Validation
          </h3>
          <p class="text-slate-300 leading-relaxed mb-0 text-lg">
            Search, login, and form fields should be sanitized and validated to
            defend against attacks such as SQL injection and malicious input.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
