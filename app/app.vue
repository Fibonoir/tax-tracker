<template>
  <UApp>
    <NuxtLoadingIndicator />

    <div v-if="!isLoginPage" class="app-shell">
      <div class="app-shell__ambient" />

      <div class="app-shell__frame">
        <aside class="app-sidebar">
          <div class="app-sidebar__top">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <UIcon name="lucide:receipt-text" class="w-5 h-5" />
              </div>

              <div class="app-sidebar__meta">
                <span class="app-sidebar__pill">Forfettario · Italia</span>
                <div>
                  <p class="app-brand-title">Fattura Tracker</p>
                  <p class="app-brand-copy">Quanto resta davvero, senza sorprese.</p>
                </div>
              </div>
            </div>

            <p class="app-sidebar__note">
              Incassi, accantonamenti e scadenze nello stesso spazio operativo.
            </p>
          </div>

          <nav class="app-sidebar__nav">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              class="app-sidebar-link"
              :class="{ 'is-active': isActive(tab.to) }"
            >
              <UIcon :name="tab.icon" class="w-5 h-5" />
              <span class="font-mono text-xs uppercase tracking-[0.18em]">{{ tab.label }}</span>
            </NuxtLink>
          </nav>

          <div class="app-sidebar__footer">
            <button type="button" class="app-toolbar-button" @click="toggleColorMode">
              <UIcon :name="colorMode.preference === 'dark' ? 'lucide:sun-medium' : 'lucide:moon-star'" class="w-4 h-4" />
              <span class="app-toggle-copy">
                {{ colorMode.preference === 'dark' ? 'Tema chiaro' : 'Tema scuro' }}
              </span>
            </button>

            <p class="app-sidebar__note">
              Anno fiscale {{ currentYear }}. Ogni vista deve aiutarti a decidere cosa puoi usare, cosa accantonare e cosa arriva dopo.
            </p>
          </div>
        </aside>

        <main class="app-main">
          <header class="app-mobile-header md:hidden">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <UIcon name="lucide:receipt-text" class="w-5 h-5" />
              </div>

              <div>
                <p class="app-brand-title">Fattura Tracker</p>
                <p class="app-brand-copy">Disponibile, accantonamenti, scadenze</p>
              </div>
            </div>

            <button type="button" class="app-toolbar-button" @click="toggleColorMode">
              <UIcon :name="colorMode.preference === 'dark' ? 'lucide:sun-medium' : 'lucide:moon-star'" class="w-4 h-4" />
            </button>
          </header>

          <div class="app-shell-content pb-nav md:pb-8">
            <NuxtPage />
          </div>
        </main>
      </div>

      <nav class="app-mobile-dock md:hidden">
        <div class="app-mobile-dock__grid">
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            class="app-mobile-link"
            :class="{ 'is-active': isActive(tab.to) }"
          >
            <UIcon :name="tab.icon" class="w-5 h-5" />
            <span class="font-mono text-[10px] uppercase tracking-[0.18em]">{{ tab.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </div>

    <div v-else>
      <NuxtPage />
    </div>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()

const currentYear = new Date().getFullYear()

const isLoginPage = computed(() => route.path === '/login')

const tabs = [
  { to: '/', label: 'Home', icon: 'lucide:square-pen' },
  { to: '/month', label: 'Mese', icon: 'lucide:calendar-range' },
  { to: '/annual', label: 'Anno', icon: 'lucide:chart-column-big' },
  { to: '/settings', label: 'Modello', icon: 'lucide:sliders-horizontal' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
