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

// Rutas públicas - corregido el typo
const PUBLIC_ROUTES = ['/', '/login', '/formulario']

// Función para validar si una ruta es pública (ignora query params)
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

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

  const refreshSession = async (): Promise<boolean> => {
    try {
      const storedRefresh = localStorage.getItem('refresh_token')
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
      const newJwt = data.jwt ?? data.token ?? null
      const newRefresh = data.refresh_token ?? data.refresh ?? null

      if (!newJwt) {
        console.warn('refreshSession: no vino jwt en la respuesta', data)
        return false
      }

      localStorage.setItem('token', newJwt)
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh)

      setToken(newJwt)
      setRefreshToken(newRefresh ?? storedRefresh)
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

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const savedToken = localStorage.getItem('token')
      const savedRefresh = localStorage.getItem('refresh_token')

      if (mounted) {
        setToken(savedToken)
        setRefreshToken(savedRefresh)
      }

      // Verificar si la ruta actual es pública
      const isPublic = isPublicRoute(pathname)

      if (!savedToken) {
        if (savedRefresh) {
          const ok = await refreshSession()
          if (!ok) {
            if (!isPublic) {
              logout()
            } else {
              localStorage.removeItem('refresh_token')
              setRefreshToken(null)
              setLoading(false)
            }
            return
          }
          if (mounted) setLoading(false)
          return
        }

        if (!isPublic) {
          logout()
        } else {
          setLoading(false)
        }
        return
      }

      if (isTokenExpired(savedToken)) {
        const ok = await refreshSession()
        if (!ok) {
          // Si es ruta pública, no hacer logout
          if (isPublic) {
            localStorage.removeItem('token')
            localStorage.removeItem('refresh_token')
            setToken(null)
            setRefreshToken(null)
            setLoading(false)
          } else {
            logout()
          }
          return
        }
        if (mounted) setLoading(false)
        return
      }

      if (mounted) {
        setToken(savedToken)
        setLoading(false)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [pathname])

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