<script setup></script>

<template>
  <section
    id="security"
    class="py-20 bg-slate-900 text-white relative border-y border-slate-800"
  >
    <div class="container-custom">
      <div class="mb-14 text-center md:text-left">
        <span class="eyebrow text-blue-400">Security Focus</span>
        <h2 class="section-heading text-white">
          Key e-commerce security challenges and planned protections
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <article class="card-dark">
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

        <article class="card-dark">
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

        <article class="card-dark">
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

        <article class="card-dark">
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
