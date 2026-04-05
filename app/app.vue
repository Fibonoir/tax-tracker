<template>
  <UApp>
    <NuxtLoadingIndicator />

    <div v-if="isAppRoute" class="app-shell">
      <div class="app-shell__frame">
        <aside class="app-sidebar">
          <div class="app-sidebar__top">
            <div class="app-mobile-brand">
              <div class="app-brand-mark">
                <span class="app-brand-mark__letter">C</span>
              </div>

              <div class="app-sidebar__meta">
                <p class="app-brand-title">Chiaro</p>
              </div>
            </div>
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
            <div v-if="session?.user" class="app-sidebar-account">
              <p class="app-sidebar-account__email">{{ session.user.email }}</p>
              <button type="button" class="app-sidebar-account__action" title="Esci" @click="logout">
                <UIcon name="lucide:log-out" class="w-3.5 h-3.5" />
              </button>
            </div>

            <button type="button" class="app-toolbar-button" @click="toggleColorMode">
              <UIcon :name="colorModeIcon" class="w-4 h-4" />
              <span class="app-toggle-copy">
                {{ colorMode.preference === 'dark' ? 'Chiaro' : 'Scuro' }}
              </span>
            </button>

            <p class="app-sidebar__note">
              Anno fiscale {{ currentYear }}
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
              </div>
            </div>

            <div class="app-mobile-header__right">
              <button type="button" class="app-toolbar-button app-toolbar-button--icon" @click="toggleColorMode">
                <UIcon :name="colorModeIcon" class="w-4 h-4" />
              </button>
              <button type="button" class="app-toolbar-button app-toolbar-button--icon" @click="mobileMenuOpen = !mobileMenuOpen">
                <UIcon :name="mobileMenuOpen ? 'lucide:x' : 'lucide:menu'" class="w-5 h-5" />
              </button>
            </div>
          </header>

          <div v-if="mobileMenuOpen" class="app-mobile-menu md:hidden">
            <button v-if="session?.user" type="button" class="app-mobile-menu__item app-mobile-menu__item--danger" @click="logout">
              <UIcon name="lucide:log-out" class="w-5 h-5" />
              <span>Esci · {{ session.user.email }}</span>
            </button>
          </div>

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

    <div v-else-if="isMarketingRoute" class="app-public-shell">
      <div class="app-public-shell__frame">
        <header class="app-public-topbar">
          <NuxtLink to="/" class="app-public-brand">
            <div class="app-brand-mark">
              <span class="app-brand-mark__letter">C</span>
            </div>
            <p class="app-brand-title">Chiaro</p>
          </NuxtLink>

          <nav class="app-public-nav">
            <button type="button" class="app-toolbar-button app-toolbar-button--icon" @click="toggleColorMode">
              <UIcon :name="colorModeIcon" class="w-4 h-4" />
            </button>
            <NuxtLink :to="session?.user ? '/app' : '/login'" class="app-toolbar-button app-public-nav__cta">
              {{ session?.user ? 'Apri app' : 'Accedi' }}
            </NuxtLink>
          </nav>
        </header>

        <div class="app-public-shell__content">
          <NuxtPage />
        </div>
      </div>
    </div>

    <div v-else class="app-public-shell app-public-shell--plain">
      <div class="app-public-shell__frame">
        <div class="app-public-shell__content">
          <NuxtPage />
        </div>
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const { session, signOut, clear: clearAuthState } = useAuthState()
const { clear: clearCurrentUser } = useCurrentUser()

const currentYear = new Date().getFullYear()
const mobileMenuOpen = ref(false)

const isAppRoute = computed(() => route.path.startsWith('/app'))
const isMarketingRoute = computed(() => ['/', '/pricing'].includes(route.path))

const colorModeIcon = computed(() =>
  colorMode.preference === 'dark' ? 'lucide:sun-medium' : 'lucide:moon-star'
)

const tabs = [
  { to: '/app', label: 'Home', icon: 'lucide:square-pen' },
  { to: '/app/month', label: 'Mese', icon: 'lucide:calendar-range' },
  { to: '/app/annual', label: 'Anno', icon: 'lucide:chart-column-big' },
  { to: '/app/settings', label: 'Modello', icon: 'lucide:sliders-horizontal' },
]

watch(() => route.path, () => { mobileMenuOpen.value = false })

function isActive(path: string) {
  if (path === '/app') return route.path === '/app'
  return route.path.startsWith(path)
}

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

async function logout() {
  await signOut()
  clearAuthState()
  clearCurrentUser()
  await navigateTo('/login')
}
</script>
