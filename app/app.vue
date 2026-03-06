<template>
  <UApp>
    <NuxtLoadingIndicator />
    
    <div v-if="!isLoginPage" class="min-h-screen bg-revolut-black light:bg-revolut-light-bg">
      <div class="md:flex md:h-screen">
        <!-- Desktop Sidebar -->
        <aside class="hidden md:flex md:flex-col md:w-64 md:border-r border-revolut-border light:border-revolut-light-border">
          <div class="p-6 border-b border-revolut-border light:border-revolut-light-border">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-linear-to-br from-revolut-green to-revolut-green-dark flex items-center justify-center">
                <UIcon name="lucide:receipt-euro" class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="font-display text-base font-semibold text-revolut-text light:text-revolut-light-text">Fattura Tracker</p>
                <p class="font-mono text-[0.6rem] tracking-wider uppercase text-revolut-muted">Italia</p>
              </div>
            </div>
          </div>
          
          <nav class="flex-1 p-4 space-y-1">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              class="app-sidebar-link"
              :class="{ 'is-active': isActive(tab.to) }"
            >
              <UIcon :name="tab.icon" class="w-5 h-5" />
              <span class="font-mono text-xs uppercase tracking-wider">{{ tab.label }}</span>
            </NuxtLink>
          </nav>
          
          <div class="p-4 border-t border-revolut-border light:border-revolut-light-border">
            <UButton
              variant="ghost"
              class="w-full justify-start"
              @click="toggleColorMode"
            >
              <UIcon :name="colorMode.preference === 'dark' ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
              <span class="ml-2 text-xs">Modalit&agrave; {{ colorMode.preference === 'dark' ? 'chiara' : 'scura' }}</span>
            </UButton>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 md:overflow-y-auto">
          <div class="app-shell-content pb-nav md:pb-8 md:pt-6">
            <NuxtPage />
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav class="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-revolut-dark light:bg-white border-t border-revolut-border light:border-revolut-light-border">
        <div class="px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          <div class="grid grid-cols-4 gap-1">
            <NuxtLink
              v-for="tab in tabs"
              :key="tab.to"
              :to="tab.to"
              class="app-mobile-link"
              :class="{ 'is-active': isActive(tab.to) }"
            >
              <UIcon :name="tab.icon" class="w-6 h-6" />
              <span class="font-mono text-[9px] tracking-wider uppercase mt-1">{{ tab.label }}</span>
            </NuxtLink>
          </div>
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

const isLoginPage = computed(() => route.path === '/login')

const tabs = [
  { to: '/', label: 'Registra', icon: 'lucide:pencil' },
  { to: '/month', label: 'Mese', icon: 'lucide:calendar' },
  { to: '/annual', label: 'Annuale', icon: 'lucide:chart-pie' },
  { to: '/settings', label: 'Impostazioni', icon: 'lucide:settings' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
