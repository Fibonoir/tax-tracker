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
            <button type="button" class="app-toolbar-button" @click="toggleColorMode">
              <UIcon :name="colorMode.preference === 'dark' ? 'lucide:sun-medium' : 'lucide:moon-star'" class="w-4 h-4" />
              <span class="app-toggle-copy">
                {{ colorMode.preference === 'dark' ? 'Tema chiaro' : 'Tema scuro' }}
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
                <p class="app-brand-copy">Forfettario · {{ currentYear }}</p>
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
type UiVariant = 'classic' | 'editorial'

const UI_VARIANT_STORAGE_KEY = 'chiaro-ui-variant'
const route = useRoute()
const colorMode = useColorMode()
const uiVariant = useState<UiVariant>('ui-variant', () => normalizeUiVariant(route.query.ui) ?? 'classic')

const currentYear = new Date().getFullYear()

const isLoginPage = computed(() => route.path === '/login')

const tabs = [
  { to: '/', label: 'Home', icon: 'lucide:square-pen' },
  { to: '/month', label: 'Mese', icon: 'lucide:calendar-range' },
  { to: '/annual', label: 'Anno', icon: 'lucide:chart-column-big' },
  { to: '/settings', label: 'Modello', icon: 'lucide:sliders-horizontal' },
]

useHead(() => ({
  htmlAttrs: {
    'data-ui-variant': uiVariant.value,
  },
}))

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

function normalizeUiVariant(value: unknown): UiVariant | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null

  const normalized = raw.toLowerCase()
  if (normalized === 'classic' || normalized === 'editorial') return normalized
  return null
}

function persistUiVariant(variant: UiVariant) {
  if (!import.meta.client) return
  localStorage.setItem(UI_VARIANT_STORAGE_KEY, variant)
}

function applyUiVariant(variant: UiVariant, persist = true) {
  uiVariant.value = variant
  if (persist) persistUiVariant(variant)
}

watch(
  () => route.query.ui,
  (value) => {
    const queryVariant = normalizeUiVariant(value)

    if (queryVariant) {
      applyUiVariant(queryVariant)
      return
    }

    if (value !== undefined) {
      applyUiVariant('classic')
      return
    }

    if (!import.meta.client) return

    const storedVariant = normalizeUiVariant(localStorage.getItem(UI_VARIANT_STORAGE_KEY))
    uiVariant.value = storedVariant ?? 'classic'
  },
  { immediate: true },
)
</script>
