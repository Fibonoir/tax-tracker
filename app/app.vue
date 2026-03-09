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
                <span class="app-brand-mark__letter">C</span>
              </div>

              <div class="app-sidebar__meta">
                <span class="app-sidebar__pill">Chiaro · Forfettario</span>
                <div>
                  <p class="app-brand-title">Chiaro</p>
                  <p class="app-brand-copy">Controllo mensile del denaro davvero disponibile.</p>
                </div>
              </div>
            </div>

            <p class="app-sidebar__note">
              L'app per freelance in forfettario che ti dice quanto mettere da parte, quanto ti resta davvero e cosa arriva alle prossime scadenze.
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
              Anno fiscale {{ currentYear }}. Ogni vista deve aiutarti a non spendere soldi che non sono davvero tuoi.
            </p>
          </div>
        </aside>

        <main class="app-main">
          <header class="app-mobile-header md:hidden">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <span class="app-brand-mark__letter">C</span>
              </div>

              <div>
                <p class="app-brand-title">Chiaro</p>
                <p class="app-brand-copy">Incassato, accantonamento, disponibile</p>
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
