import { authClient } from '~/lib/auth-client'

export interface AuthState {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
  }
  session: {
    id: string
    expiresAt: string
  }
}

export function useAuthState() {
  const session = useState<AuthState | null>('auth-session', () => null)
  const loading = useState<boolean>('auth-session-loading', () => false)

  async function refresh(force = false) {
    if (loading.value)
      return session.value

    if (!force && session.value)
      return session.value

    loading.value = true
    try {
      const result = await authClient.getSession()
      session.value = result.data ?? null
      return session.value
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await authClient.signOut()
    session.value = null
  }

  function clear() {
    session.value = null
  }

  return {
    session,
    loggedIn: computed(() => Boolean(session.value?.user?.email)),
    loading: computed(() => loading.value),
    refresh,
    signOut,
    clear,
  }
}
