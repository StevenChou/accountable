import { useEffect, useRef, useState } from 'react'
import { ApiError, errorMessage, setApiSession } from './api'

type Config = { mode: 'local' } | { mode: 'supabase'; url: string; publishableKey: string }
type Member = { email: string }
type Provider = {
  restore: () => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string>
  signOut: (token: string) => Promise<void>
  watch: (changed: (token: string | null) => void) => () => void
}
type AuthState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'signed-out'; demo: boolean }
  | {
      status: 'signed-in'
      member: Member
    }

const localKey = 'accountable-local-session'
const supabaseKey = 'accountable-supabase-session'
const invalidLogin = '請確認電子郵件與密碼，或重新登入。'

function storeToken(key: string, token: string | null) {
  try {
    if (token) localStorage.setItem(key, token)
    else localStorage.removeItem(key)
  } catch {
    // The session can still be used in this tab when storage is unavailable.
  }
}

function localToken() {
  try {
    return localStorage.getItem(localKey)
  } catch {
    return null
  }
}

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, { signal: AbortSignal.timeout(8000), ...options })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error)
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function localProvider(): Provider {
  return {
    restore: async () => localToken(),
    async signIn(email, password) {
      const { token } = await authRequest<{ token: string }>('login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      storeToken(localKey, token)
      return token
    },
    async signOut(token) {
      storeToken(localKey, null)
      await authRequest('logout', { method: 'POST', headers: bearer(token) })
    },
    watch(changed) {
      function update(event: StorageEvent) {
        if (event.key === localKey || event.key === null) changed(localToken())
      }
      window.addEventListener('storage', update)
      return () => window.removeEventListener('storage', update)
    },
  }
}

async function createProvider(config: Config): Promise<Provider> {
  if (config.mode === 'local') return localProvider()
  const { createClient } = await import('@supabase/supabase-js')
  const { auth } = createClient(config.url, config.publishableKey, {
    auth: { storageKey: supabaseKey, detectSessionInUrl: false },
    global: {
      fetch: (url, options) => {
        const timeout = AbortSignal.timeout(8000)
        const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout
        return fetch(url, { ...options, signal })
      },
    },
  })
  return {
    async restore() {
      const { data, error } = await auth.getSession()
      if (error?.status === 0 || error?.status === 429 || (error?.status ?? 0) >= 500)
        throw new Error('Auth unavailable')
      return data.session?.access_token ?? null
    },
    async signIn(email, password) {
      const { data, error } = await auth.signInWithPassword({ email, password })
      if (error?.status === 0 || error?.status === 429 || (error?.status ?? 0) >= 500)
        throw new Error('Auth unavailable')
      if (!data.session) throw new ApiError(401, { message: invalidLogin })
      return data.session.access_token
    },
    async signOut() {
      try {
        await auth.signOut({ scope: 'local' })
      } finally {
        storeToken(supabaseKey, null)
      }
    },
    watch(changed) {
      const { data } = auth.onAuthStateChange((event, session) => {
        if (event !== 'INITIAL_SESSION') changed(session?.access_token ?? null)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const provider = useRef<Provider | null>(null)
  const token = useRef<string | null>(null)
  const demo = useRef(false)
  const version = useRef(0)

  function detach() {
    token.current = null
    setApiSession()
  }

  function signedOut() {
    detach()
    setState({ status: 'signed-out', demo: demo.current })
  }

  async function signOut() {
    const active = token.current
    const operation = ++version.current
    detach()
    setState({ status: 'loading' })
    try {
      if (active) await provider.current?.signOut(active)
    } catch {
      // The active CRM session has already been cleared.
    } finally {
      if (version.current === operation) signedOut()
    }
  }

  async function establish(active: string, operation: number) {
    const member = await authRequest<Member>('session', { headers: bearer(active) })
    if (operation !== version.current) return
    acceptToken(active)
    setState({ status: 'signed-in', member })
  }

  function acceptToken(active: string) {
    token.current = active
    setApiSession({ token: active, expired: () => void signOut() })
  }

  function cancel() {
    version.current++
    detach()
  }

  function watchSession(next: string | null) {
    if (!token.current || next === token.current) return
    const change = ++version.current
    if (!next) {
      signedOut()
      return
    }
    acceptToken(next)
    // Supabase auth event handlers must return before making another auth request.
    void Promise.resolve().then(async () => {
      try {
        await establish(next, change)
      } catch (error) {
        if (version.current !== change) return
        if (error instanceof ApiError && error.status === 401) void signOut()
        else {
          detach()
          setState({ status: 'error', message: errorMessage(error) })
        }
      }
    })
  }

  async function signIn(email: string, password: string) {
    const operation = ++version.current
    const client = provider.current
    if (!client) return
    const active = await client.signIn(email, password)
    try {
      await establish(active, operation)
    } catch (error) {
      if (version.current !== operation) return
      if (error instanceof ApiError && error.status === 401) {
        await client.signOut(active).catch(() => undefined)
        throw error
      }
      detach()
      setState({ status: 'error', message: errorMessage(error) })
    }
  }

  useEffect(() => {
    const operation = ++version.current
    let unwatch: (() => void) | undefined

    async function boot() {
      let active: string | null = null
      try {
        const config = await authRequest<Config>('config')
        const client = provider.current ?? (await createProvider(config))
        if (version.current !== operation) return
        provider.current = client
        demo.current = config.mode === 'local'
        unwatch = client.watch(watchSession)
        active = await client.restore()
        if (version.current !== operation) return
        if (active) await establish(active, operation)
        else signedOut()
      } catch (error) {
        if (version.current !== operation) return
        if (error instanceof ApiError && error.status === 401) {
          if (active) await provider.current?.signOut(active).catch(() => undefined)
          if (version.current === operation) signedOut()
        } else {
          setState({ status: 'error', message: errorMessage(error) })
        }
      }
    }

    void boot()
    return () => {
      unwatch?.()
      cancel()
    }
    // Auth session state lives here for the lifetime of the mounted app.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  return {
    state,
    signIn,
    signOut,
    retry() {
      setState({ status: 'loading' })
      setAttempt((value) => value + 1)
    },
  }
}
