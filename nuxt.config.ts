export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', 'nuxt-auth-utils'],

  serverDir: 'app/server',
  css: ['~/assets/css/main.css'],
  
  colorMode: {
    preference: 'light',
  },
  
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    oauth: {
      google: {
        clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
      },
    },
    allowedEmail: process.env.ALLOWED_EMAIL,
  },
  
  app: {
    head: {
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
          href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap',
        },
      ],
    },
  },
  
  compatibilityDate: '2026-03-05',
})
