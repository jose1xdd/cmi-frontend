'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

interface UsuarioSistema {
  email: string
  password?: string
  personaId: string
  rol: 'admin' | 'usuario'
}

export default function FormularioUsuarioSistemaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const emailParam = searchParams.get('email') || undefined
  const esEdicion = !!emailParam

  const [showModal, setShowModal] = useState(false)
  const [data, setData] = useState<UsuarioSistema>({
    email: '',
    password: '',
    personaId: '',
    rol: 'usuario',
  })

  // cargar datos si es edición
  useEffect(() => {
    if (esEdicion && emailParam) {
      apiFetch<UsuarioSistema>(`/${encodeURIComponent(emailParam)}`)
        .then((res) =>
          setData({
            email: res.email,
            password: '',
            personaId: res.personaId,
            rol: res.rol,
          })
        )
        .catch(() => console.error('Error cargando usuario'))
    }
  }, [esEdicion, emailParam])

  const handleInputChange = (key: keyof UsuarioSistema, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleGuardar = async () => {
    try {
      if (esEdicion && emailParam) {
        // editar usuario → solo email
        await apiFetch(`/${encodeURIComponent(emailParam)}`, {
          method: 'PUT',
          body: JSON.stringify({ email: data.email }),
        })
      } else {
        // crear usuario → todos los campos
        await apiFetch('/create', {
          method: 'POST',
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            personaId: data.personaId,
            rol: data.rol,
          }),
        })
      }

      setShowModal(true)
    } catch {
      alert('Error al guardar el usuario')
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

          {/* Password → solo en creación */}
          {!esEdicion && (
            <div>
              <label className="block text-sm text-[#7d4f2b] mb-1">Password</label>
              <input
                type="password"
                value={data.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full border border-[#7d4f2b] rounded px-3 py-2"
              />
            </div>
          )}

          {/* PersonaId → solo en creación */}
          <div>
            <label className="block text-sm text-[#7d4f2b] mb-1">Persona ID</label>
            <input
              value={data.personaId}
              onChange={(e) => handleInputChange('personaId', e.target.value)}
              disabled={esEdicion}
              className={`w-full border border-[#7d4f2b] rounded px-3 py-2 ${esEdicion ? 'bg-gray-100' : ''}`}
            />
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
          <div className="bg-white px-8 py-6 rounded shadow-md w-80 text-center">
            <p className="text-gray-800 mb-4">
              {esEdicion
                ? 'Usuario actualizado con éxito'
                : 'Usuario creado con éxito'}
            </p>
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
