import { useCallback, useEffect, useRef, useState } from 'react'

type ErrorData = { message?: string; fields?: Record<string, string>; impact?: Record<string, number> }

export class ApiError extends Error {
  constructor(public status: number, public details: ErrorData) {
    super(details.message || `無法讀寫資料（HTTP ${status}）。請稍後重試。`)
    this.name = 'ApiError'
  }
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  return '無法連線到本機服務。請確認應用程式正在執行後重試。'
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
  })
  if (!response.ok) {
    const error: ErrorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error)
  }
  return response.status === 204 ? undefined as T : await response.json() as T
}

export function write<T = unknown>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown, signal?: AbortSignal) {
  return api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body), signal })
}

export function useResource<T>(path: string) {
  const [state, setState] = useState<{ path: string; data?: T; error?: unknown; busy: boolean }>(
    { path, busy: true },
  )
  const active = useRef<AbortController | null>(null)

  const reload = useCallback(async () => {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setState(previous => ({ path, data: previous.path === path ? previous.data : undefined, busy: true }))
    try {
      const data = await api<T>(path, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setState({ path, data, busy: false })
        return data
      }
    } catch (error) {
      if (!controller.signal.aborted) setState(previous => ({ ...previous, error, busy: false }))
    }
  }, [path])

  useEffect(() => {
    void reload()
    return () => active.current?.abort()
  }, [reload])

  const replace = (data: T) => {
    active.current?.abort()
    setState({ path, data, busy: false })
  }

  return { ...(state.path === path ? state : { path, busy: true }), reload, replace }
}
