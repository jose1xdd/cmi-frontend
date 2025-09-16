'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { jwtDecode } from 'jwt-decode'

interface Reunion {
  id: number
  titulo: string
  fecha: string
  horaInicio: string
  horaFinal: string
}

interface CustomPayload {
  persona_id: string
  exp: number
  iat?: number
  [key: string]: unknown
}

export default function EditarReunionUsuarioPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const { token: authToken } = useAuth()

  const [reunion, setReunion] = useState<Reunion | null>(null)
  const [token, setToken] = useState('')
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [modalExito, setModalExito] = useState(false)
  const [loading, setLoading] = useState(false)

  // === Decodificar persona_id desde el token ===
  useEffect(() => {
    if (authToken) {
      try {
        const decoded = jwtDecode<CustomPayload>(authToken)
        if (decoded.persona_id) {
          setPersonaId(decoded.persona_id)
        }
      } catch (err) {
        console.error('Error decodificando token', err)
      }
    }
  }, [authToken])

  // === Cargar datos de la reunión ===
  useEffect(() => {
    const fetchReunion = async () => {
      if (!id) return
      try {
        const data = await apiFetch<Reunion>(`/reunion/reunion/${id}`)
        setReunion(data)
      } catch (err) {
        console.error('Error cargando reunión', err)
      }
    }
    fetchReunion()
  }, [id])

  // === Registrar asistencia ===
  const registrarToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !token || !personaId) {
      alert('Faltan datos para registrar la asistencia')
      return
    }

    setLoading(true)
    try {
      await apiFetch(`/asistencia/asistencia/user-assign/${id}`, {
        method: 'POST',
        body: JSON.stringify({
          codigo_asistencia: token,
          persona_id: personaId,
        }),
      })
      setModalExito(true)
      setToken('')
    } catch (err) {
      console.error('Error registrando asistencia', err)
      alert('No se pudo registrar la asistencia. Verifique el token.')
    } finally {
      setLoading(false)
    }
  }

  const formatHora = (fecha: string, hora: string) => {
    try {
      return new Date(`${fecha}T${hora}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return hora
    }
  }

  return (
    <div className="max-w-5xl mx-auto pt-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-[#333]">
        Registrar asistencia
      </h1>

      {/* Mostrar datos de la reunión */}
      {reunion ? (
        <form onSubmit={registrarToken}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div>
              <label className="block text-sm text-[#7d4f2b] mb-1">Título</label>
              <input
                type="text"
                value={reunion.titulo}
                disabled
                className="w-full border border-[#b57d50] rounded px-3 py-2 bg-[#f9f8f7] text-[#333]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#7d4f2b] mb-1">Fecha</label>
              <input
                type="text"
                value={reunion.fecha}
                disabled
                className="w-full border border-[#b57d50] rounded px-3 py-2 bg-[#f9f8f7] text-[#333]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#7d4f2b] mb-1">Hora inicio</label>
              <input
                type="text"
                value={formatHora(reunion.fecha, reunion.horaInicio)}
                disabled
                className="w-full border border-[#b57d50] rounded px-3 py-2 bg-[#f9f8f7] text-[#333]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#7d4f2b] mb-1">Hora fin</label>
              <input
                type="text"
                value={formatHora(reunion.fecha, reunion.horaFinal)}
                disabled
                className="w-full border border-[#b57d50] rounded px-3 py-2 bg-[#f9f8f7] text-[#333]"
              />
            </div>
          </div>

          {/* Token */}
          <div className="mb-6">
            <label className="block text-lg text-[#7d4f2b] mb-2">Token</label>
            <input
              type="text"
              value={token}
              onChange={e => setToken(e.target.value.toUpperCase())}
              maxLength={20}
              required
              placeholder="Ingrese el token aquí"
              className="w-full text-center text-3xl font-bold border-2 border-[#b57d50] rounded px-3 py-8 tracking-widest bg-white focus:outline-none focus:border-[#7d4f2b] transition"
              style={{ letterSpacing: '0.15em' }}
            />
          </div>

          {/* Botón */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-8 py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Registrar token'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-center text-gray-500">Cargando reunión...</p>
      )}

      {/* Modal éxito */}
      {modalExito && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
            <p className="text-lg mb-6">¡Asistencia registrada exitosamente!</p>
            <button
              onClick={() => setModalExito(false)}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
