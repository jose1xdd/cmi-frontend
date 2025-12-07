'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface AuthContextType {
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PUBLIC_ROUTES = ['/']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Función para validar expiración del JWT
  const isTokenExpired = (jwt: string): boolean => {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      const exp = payload.exp * 1000
      return Date.now() > exp
    } catch (err) {
      console.error('Error verificando token:', err)
      return true
    }
  }

  // Cargar token desde localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token')

    // Si no hay token y la ruta NO es pública → redirigir al login
    if (!savedToken) {
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.push('/login')
      }
      return
    }

    // Si el token existe pero está vencido → logout + redirigir
    if (isTokenExpired(savedToken)) {
      localStorage.removeItem('token')
      setToken(null)

      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.push('/login')
      }
      return
    }

    setToken(savedToken)
  }, [pathname])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{ token, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
