export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],

  serverDir: 'app/server',
  css: ['~/assets/css/main.css'],
  
  colorMode: {
    preference: 'light',
  },
  
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
    betaAllowlist: process.env.BETA_ALLOWLIST,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeCoreClarityPriceId: process.env.STRIPE_CORE_CLARITY_PRICE_ID,
    stripePlanningScenariosPriceId: process.env.STRIPE_PLANNING_SCENARIOS_PRICE_ID,
    public: {
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      betterAuthUrl: process.env.BETTER_AUTH_URL ?? '',
    },
  },
  
  app: {
    head: {
      title: 'Chiaro',
      meta: [
        {
          name: 'description',
          content: 'Chiaro e l\'app per freelance in forfettario che ti dice quanto mettere da parte, quanto ti resta davvero e cosa pagherai alle prossime scadenze.',
        },
      ],
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap',
        },
      ],
    },
  },
  
  compatibilityDate: '2026-03-05',
})
