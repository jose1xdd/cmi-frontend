'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { jwtDecode } from 'jwt-decode'
import type { LoginResponse, JwtPayload } from '@/types/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await apiFetch<LoginResponse>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (data.estado !== 'Exitoso') {
        throw new Error('Credenciales inválidas')
      }

      // guardamos solo el jwt
      login(data.jwt)

      const payload = jwtDecode<JwtPayload>(data.jwt)
      localStorage.setItem('tipoUsuario', payload.role)

      router.push('/dashboard/perfil')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el inicio de sesión')
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/fondocomunidad.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        <div className="bg-white rounded-2xl border-[6px] border-[#7d4f2b] shadow-lg p-8 md:p-10 w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <Image
              src="/quillacinga.png"
              alt="Logo"
              width={100}
              height={100}
              priority
            />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[#333] font-medium mb-1">Usuario</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded bg-gray-200 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[#333] font-medium mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-gray-200 focus:outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#7d4f2b] text-white py-2 rounded font-semibold hover:bg-[#5e3c1f] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
