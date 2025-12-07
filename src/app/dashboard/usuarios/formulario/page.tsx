'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Mail, User, Shield } from 'lucide-react'

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
  data?: string
}

interface FormularioUsuarioSistemaPageProps {
  onClose: () => void;
  onSuccess: () => void;
  email?: string; // ← nuevo prop opcional
}

export default function FormularioUsuarioSistemaPage({
  onClose,
  onSuccess,
  email: emailProp,
}: FormularioUsuarioSistemaPageProps) {
  const searchParams = useSearchParams();
  const emailParam = emailProp || searchParams.get('email') || undefined;
  const esEdicion = !!emailParam;

  const [data, setData] = useState<UsuarioSistema>({
    email: '',
    personaId: '',
    rol: 'usuario',
  })

  const [personasDisponibles, setPersonasDisponibles] = useState<Persona[]>([])
  const [loadingPersonas, setLoadingPersonas] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mensajeModal, setMensajeModal] = useState<string | null>(null)

  // Cargar datos si es edición
  useEffect(() => {
    if (esEdicion && emailParam) {
      setLoading(true)
      apiFetch<UsuarioSistema>(`/${encodeURIComponent(emailParam)}`)
        .then((res) => {
          setData({
            email: res.email,
            personaId: res.personaId,
            rol: res.rol,
          })
        })
        .catch(() => {
          setMensajeModal('Error al cargar los datos del usuario.')
        })
        .finally(() => setLoading(false))
    }
  }, [esEdicion, emailParam])

  // Cargar personas disponibles (solo en creación)
  useEffect(() => {
    if (!esEdicion) {
      setLoadingPersonas(true)
      Promise.all([
        apiFetch<{ items: Persona[] }>('/personas/?page=1&page_size=100'),
        apiFetch<{ items: UsuarioSistema[] }>('/?page=1&page_size=100'),
      ])
        .then(([personasRes, usuariosRes]) => {
          const personaIdsConUsuario = new Set(usuariosRes.items.map((u) => u.personaId))
          const disponibles = personasRes.items.filter((p) => !personaIdsConUsuario.has(p.id))
          setPersonasDisponibles(disponibles)
        })
        .catch(() => {
          setMensajeModal('Error al cargar las personas disponibles.')
        })
        .finally(() => setLoadingPersonas(false))
    }
  }, [esEdicion])

  const handleInputChange = (key: keyof UsuarioSistema, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    if (!data.email || (!esEdicion && !data.personaId)) {
      setMensajeModal('Por favor complete todos los campos obligatorios.')
      return
    }

    // Validar personaId solo en creación
    if (!esEdicion && data.personaId) {
      const personaId = data.personaId.trim()
      if (!/^\d+$/.test(personaId)) {
        setMensajeModal('El ID de persona debe contener solo números.')
        return
      }
      if (personaId.length < 6 || personaId.length > 12) {
        setMensajeModal('El ID de persona debe tener entre 6 y 12 dígitos.')
        return
      }
    }

    setLoading(true)
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

      setMensajeModal(response.message || 'Operación realizada con éxito.')
      setTimeout(() => {
        onSuccess() // Recarga la lista y cierra el modal
      }, 500)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Error inesperado al guardar el usuario.'
      setMensajeModal(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
      {/* Encabezado */}
      <div className="p-6 border-gray-200">
        <h2 className="text-xl font-bold text-[#2c3e50] text-center">
          {esEdicion ? 'Editar usuario del sistema' : 'Crear nuevo usuario del sistema'}
        </h2>
      </div>

      {/* Formulario */}
      <div className="p-6 space-y-5 form-section bg-gray-50 rounded-xl mb-5">
        {/* Email */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail size={16} className="text-[#7d4f2b]" />
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            placeholder="usuario@ejemplo.com"
          />
        </div>

        {/* Persona ID */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User size={16} className="text-[#7d4f2b]" />
            {esEdicion ? 'Persona ID' : 'Persona ID *'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={data.personaId}
            onChange={(e) => {
              // Solo permitir números
              const value = e.target.value.replace(/\D/g, '')
              handleInputChange('personaId', value)
            }}
            disabled={esEdicion}
            className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent ${
              esEdicion ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
            }`}
            placeholder={esEdicion ? '' : 'Ej: 1002319256'}
            maxLength={12}
          />
          {!esEdicion && (
            <p className="text-gray-500 text-xs mt-1">
              Solo números, mínimo 6 dígitos
            </p>
          )}
        </div>

        {/* Rol */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Shield size={16} className="text-[#7d4f2b]" />
            Rol *
          </label>
          <select
            value={data.rol}
            onChange={(e) => handleInputChange('rol', e.target.value)}
            disabled={esEdicion}
            className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent ${
              esEdicion ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
            }`}
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={loading}
            className="px-5 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Modal de mensaje */}
      {mensajeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-gray-800 mb-4">{mensajeModal}</p>
            <button
              onClick={() => setMensajeModal(null)}
              className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}