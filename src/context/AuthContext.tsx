'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType {
  token: string | null
  refreshToken: string | null
  login: (jwt: string, refresh: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PUBLIC_ROUTES = ['/', '/login']

// URL de refresh: usa env si existe, si no usa la que mandaste en el curl
const REFRESH_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/cmi-apigateway/refresh`
    : 'https://backend-quillacinga.ddns.net/cmi-apigateway/refresh'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  // parseClaims: devuelve payload o null
  const parseClaims = (jwt: string) => {
    try {
      const parts = jwt.split('.')
      if (parts.length < 2) return null
      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch {
      return null
    }
  }

  const isTokenExpired = (jwt: string): boolean => {
    const payload = parseClaims(jwt)
    if (!payload || !payload.exp) return true
    return Date.now() > payload.exp * 1000
  }

  // refreshSession lee refresh_token directamente desde localStorage
  const refreshSession = async (): Promise<boolean> => {
    try {
      const storedRefresh = localStorage.getItem('refresh_token') // <-- leer localstorage directamente
      if (!storedRefresh) return false

      const res = await fetch(REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ refresh_token: storedRefresh }),
      })

      if (!res.ok) {
        console.warn('refreshSession: respuesta no ok', res.status)
        return false
      }

      const data = await res.json()
      // posible shape: { jwt: '...', refresh_token: '...' } o { token: '...', refresh: '...' }
      const newJwt = data.jwt ?? data.token ?? null
      const newRefresh = data.refresh_token ?? data.refresh ?? null

      if (!newJwt) {
        console.warn('refreshSession: no vino jwt en la respuesta', data)
        return false
      }

      // guardar en localStorage y en estado
      localStorage.setItem('token', newJwt)
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh)

      setToken(newJwt)
      setRefreshToken(newRefresh ?? storedRefresh) // si backend no devuelve refresh, mantener el anterior
      return true
    } catch (err) {
      console.error('refreshSession error:', err)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    setToken(null)
    setRefreshToken(null)
    router.replace('/login')
  }

  const login = (jwt: string, refresh: string) => {
    localStorage.setItem('token', jwt)
    localStorage.setItem('refresh_token', refresh)
    setToken(jwt)
    setRefreshToken(refresh)
  }

  // Validación inicial con claims y refresh si está vencido.
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const savedToken = localStorage.getItem('token')
      const savedRefresh = localStorage.getItem('refresh_token')

      // seteo inicial de estados para que hooks dependientes los tengan
      if (mounted) {
        setToken(savedToken)
        setRefreshToken(savedRefresh)
      }

      // sin token: intentar refresh si hay refresh_token
      if (!savedToken) {
        if (savedRefresh) {
          const ok = await refreshSession()
          if (!ok) {
            // no se pudo refrescar: ir a login si no es ruta pública
            if (!PUBLIC_ROUTES.includes(pathname)) {
              logout()
            } else {
              // limpiar por seguridad
              localStorage.removeItem('refresh_token')
              setRefreshToken(null)
              setLoading(false)
            }
            return
          }
          // refresh ok (ya setea token en refreshSession)
          if (mounted) setLoading(false)
          return
        }

        // no hay token ni refresh
        if (!PUBLIC_ROUTES.includes(pathname)) {
          logout()
        } else {
          setLoading(false)
        }
        return
      }

      // hay token → validar claims
      if (isTokenExpired(savedToken)) {
        const ok = await refreshSession()
        if (!ok) {
          // si falla el refresh, log out y redirigir
          logout()
          return
        }
        // si ok, ya actualizamos token en refreshSession
        if (mounted) setLoading(false)
        return
      }

      // token válido
      if (mounted) {
        setToken(savedToken)
        setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [pathname]) // se vuelve a correr al cambiar de ruta

  useEffect(() => {
    if (!token) return
    const t = setInterval(async () => {
      if (isTokenExpired(token)) {
        const ok = await refreshSession()
        if (!ok) logout()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(t)
  }, [token])

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
