import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@/types/auth'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://148.113.175.43:8080/cmi-apigateway'

function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

interface ApiOptions extends RequestInit {
  responseType?: 'json' | 'blob' | 'text'
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token: string | null =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  if (token && isTokenExpired(token)) {
    localStorage.removeItem('token')
    throw new Error('Sesión expirada, inicia sesión nuevamente')
  }

  const headers: HeadersInit = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText || 'Error en la petición')
  }

  if (options.responseType === 'blob') {
    return (await res.blob()) as T
  }
  if (options.responseType === 'text') {
    return (await res.text()) as T
  }
  return (await res.json()) as T
}
