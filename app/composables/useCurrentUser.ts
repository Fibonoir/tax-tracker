export interface BillingEntitlementsState {
  dashboardHistoryLimit: number | null
  annualVisibilityLimitMonths: number | null
  canUseDeadlines: boolean
  canUseMonthlyLoop: boolean
  canUseAnnualPlanning: boolean
  canCompareScenarios: boolean
  canExportForAccountant: boolean
}

export interface BillingState {
  planTier: string
  subscriptionStatus: string
  isPaid: boolean
  entitlements: BillingEntitlementsState
}

export interface CurrentUserState {
  id: number
  email: string
  name?: string | null
  picture?: string | null
  displayName?: string | null
  activityLabel?: string | null
  atecoCode?: string | null
  atecoLabel?: string | null
  taxYear?: number | null
  startupRate?: number | null
  planTier: string
  subscriptionStatus: string
  billing: BillingState
  onboardingCompleted: boolean
  onboardingCompletedAt?: string | null
  settings: {
    hourlyRate: number
    coefficiente: number
    irpefRate: number
    inpsType: string
    inpsRate: number
    inpsFixedAnnual: number
    inpsMinimaleThreshold: number
    inpsExcessRate: number
    accountantAnnual: number
  }
}

export function useCurrentUser() {
  const currentUser = useState<CurrentUserState | null>('current-user', () => null)
  const loading = useState<boolean>('current-user-loading', () => false)

  async function refresh(force = false) {
    if (loading.value)
      return currentUser.value

    if (!force && currentUser.value)
      return currentUser.value

    loading.value = true
    try {
      currentUser.value = await $fetch<CurrentUserState>('/api/me')
      return currentUser.value
    } finally {
      loading.value = false
    }
  }

  function clear() {
    currentUser.value = null
  }

  return {
    currentUser,
    loading: computed(() => loading.value),
    refresh,
    clear,
  }
}
