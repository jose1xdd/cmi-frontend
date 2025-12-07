import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@/types/auth'

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://backend-quillacinga.ddns.net/cmi-apigateway'

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
    let errorMessage = 'Error en la petición'

    try {
      const errorText = await res.text()

      // Intentar parsear como JSON
      try {
        const errorJson = JSON.parse(errorText)
        // Extraer el mensaje del backend (puede venir en diferentes formatos)
        errorMessage = errorJson.mensaje || errorJson.message || errorJson.detail || errorText
      } catch {
        // Si no es JSON, usar el texto directamente
        errorMessage = errorText || errorMessage
      }
    } catch {
      // Si falla la lectura del texto, usar mensaje genérico
      errorMessage = `Error ${res.status}: ${res.statusText}`
    }

    throw new Error(errorMessage)
  }

  if (options.responseType === 'blob') {
    return (await res.blob()) as T
  }
  if (options.responseType === 'text') {
    return (await res.text()) as T
  }
  return (await res.json()) as T
}
