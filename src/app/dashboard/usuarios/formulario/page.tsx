'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface UsuarioSistema {
  email: string
  personaId: string
  rol: 'admin' | 'usuario'
}

interface Persona {
  id: string
  nombre: string
  apellido: string
}

interface ApiResponse {
  estado: string
  message: string
  data: string
}

export default function FormularioUsuarioSistemaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const emailParam = searchParams.get('email') || undefined
  const esEdicion = !!emailParam

  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState<string>('')
  const [data, setData] = useState<UsuarioSistema>({
    email: '',
    personaId: '',
    rol: 'usuario',
  })

  const [personasDisponibles, setPersonasDisponibles] = useState<Persona[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(false)

  // cargar datos si es edición
  useEffect(() => {
    if (esEdicion && emailParam) {
      apiFetch<UsuarioSistema>(`/${encodeURIComponent(emailParam)}`)
        .then((res) =>
          setData({
            email: res.email,
            personaId: res.personaId,
            rol: res.rol,
          })
        )
        .catch(() => console.error('Error cargando usuario'))
    }
  }, [esEdicion, emailParam])

  // cargar personas sin usuario (solo en creación)
  useEffect(() => {
    if (!esEdicion) {
      const fetchData = async () => {
        setLoadingPersonas(true)
        try {
          const personas = await apiFetch<{ items: Persona[] }>(
            '/personas/?page=1&page_size=100'
          )
          const usuarios = await apiFetch<{ items: UsuarioSistema[] }>(
            '/?page=1&page_size=100'
          )

          const personaIdsConUsuario = new Set(
            usuarios.items.map((u) => u.personaId)
          )

          const disponibles = personas.items.filter(
            (p) => !personaIdsConUsuario.has(p.id)
          )

          setPersonasDisponibles(disponibles)
        } catch (err) {
          console.error('Error cargando personas disponibles', err)
        } finally {
          setLoadingPersonas(false)
        }
      }

      fetchData()
    }
  }, [esEdicion])

  const handleInputChange = (key: keyof UsuarioSistema, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    try {
      let response: ApiResponse
      if (esEdicion && emailParam) {
        response = await apiFetch<ApiResponse>(`/${encodeURIComponent(emailParam)}`, {
          method: 'PUT',
          body: JSON.stringify({ email: data.email }),
        })
      } else {
        response = await apiFetch<ApiResponse>('/create', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
            personaId: data.personaId,
            rol: data.rol,
          }),
        })
      }

      setModalMessage(response.message || 'Operación realizada con éxito')
      setShowModal(true)
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err && typeof (err as { message?: string }).message === 'string'
          ? (err as { message: string }).message
          : 'Error al guardar el usuario'
      setModalMessage(errorMessage)
      setShowModal(true)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    router.push('/dashboard/usuarios')
  }

  return (
    <div className="w-full px-4 pt-5">
      <div className="max-w-xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-center text-[#7d4f2b]">
          {esEdicion ? 'Editar usuario del sistema' : 'Crear nuevo usuario del sistema'}
        </h2>

        <div className="grid grid-cols-1 gap-6">
          {/* Email */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Email</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full border border-[#7d4f2b] rounded px-3 py-2"
            />
          </div>

          {/* PersonaId → solo en creación */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Persona ID</label>
            {esEdicion ? (
              <input
                value={data.personaId}
                disabled
                className="w-full border border-[#7d4f2b] rounded px-3 py-2 bg-gray-100"
              />
            ) : (
              <select
                value={data.personaId}
                onChange={(e) => handleInputChange('personaId', e.target.value)}
                disabled={loadingPersonas}
                className="w-full border border-[#7d4f2b] rounded px-3 py-2"
              >
                <option value="">Seleccione una persona</option>
                {personasDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} ({p.id})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Rol → solo en creación */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Rol</label>
            <select
              value={data.rol}
              onChange={(e) => handleInputChange('rol', e.target.value)}
              disabled={esEdicion}
              className={`w-full border border-[#7d4f2b] rounded px-3 py-2 ${esEdicion ? 'bg-gray-100' : ''}`}
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={handleGuardar}
            className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
          >
            {esEdicion ? 'Actualizar usuario' : 'Guardar usuario'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white px-8 py-6 rounded shadow-md w-96 text-center">
            <p className="text-gray-800 mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
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
