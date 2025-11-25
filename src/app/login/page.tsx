'use client'
import Image from 'next/image'
import { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
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

  // 🔑 recuperación
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

      login(data.jwt)
      const payload = jwtDecode<JwtPayload>(data.jwt)
      localStorage.setItem('tipoUsuario', payload.role)

      // Redirigir al dashboard principal en lugar del perfil
      router.push('/dashboard/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error en el inicio de sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleRecovery = async () => {
    if (!recoveryEmail) return
    setRecoveryLoading(true)
    try {
      await apiFetch('/password/recovery', {
        method: 'POST',
        body: JSON.stringify({ email: recoveryEmail }),
      })
      setShowRecoveryModal(false)
      setShowCodeModal(true)
    } catch {
      alert('Error al enviar el correo de recuperación')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleReset = async () => {
    if (!recoveryEmail || !recoveryCode) return
    setRecoveryLoading(true)
    try {
      await apiFetch('/password/reset', {
        method: 'POST',
        body: JSON.stringify({ email: recoveryEmail, code: recoveryCode }),
      })
      setShowCodeModal(false)
      setSuccessMessage('La contraseña fue restablecida correctamente. Revisa tu correo.')
    } catch {
      alert('Error al validar el código')
    } finally {
      setRecoveryLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/fondocomunidad.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/50 z-0" />
      <div className="relative z-10 flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        <div className="bg-white rounded-2xl border-[6px] border-[#7d4f2b] shadow-lg p-8 md:p-10 w-full max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <Image src="/quillacinga.png" alt="Logo" width={100} height={100} priority />
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

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setShowRecoveryModal(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>

      {/* Modal recuperación */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full relative">
            <button onClick={() => setShowRecoveryModal(false)} className="absolute top-2 right-2">
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Recuperar contraseña</h2>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <button
              onClick={handleRecovery}
              disabled={recoveryLoading}
              className="w-full bg-[#7d4f2b] text-white py-2 rounded hover:bg-[#5e3c1f]"
            >
              {recoveryLoading ? 'Enviando...' : 'Enviar código'}
            </button>
          </div>
        </div>
      )}

      {/* Modal código */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full relative">
            <button onClick={() => setShowCodeModal(false)} className="absolute top-2 right-2">
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Ingresa el código</h2>
            <input
              type="text"
              placeholder="Código recibido"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <button
              onClick={handleReset}
              disabled={recoveryLoading}
              className="w-full bg-[#7d4f2b] text-white py-2 rounded hover:bg-[#5e3c1f]"
            >
              {recoveryLoading ? 'Validando...' : 'Validar código'}
            </button>
          </div>
        </div>
      )}

      {/* Modal éxito */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="mb-4">{successMessage}</p>
            <button
              onClick={() => {
                setSuccessMessage(null)
                router.push('/login')
              }}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
