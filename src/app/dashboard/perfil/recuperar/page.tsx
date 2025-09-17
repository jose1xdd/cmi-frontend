'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { jwtDecode } from 'jwt-decode'
import { apiFetch } from '@/lib/api'

interface JwtPayload {
  persona_id: string
  role: string
  exp: number
  email: string
}

interface Usuario {
  nombre: string
  apellido: string
  correo: string
}

interface BackendResponse {
  estado: string
  message: string
  data: string
}

export default function RecuperarContrasena() {
  const { token } = useAuth()

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [contrasena, setContrasena] = useState('')
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [mostrarError, setMostrarError] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  // 🔄 cargar datos del usuario al montar
  useEffect(() => {
    if (token) {
      const payload = jwtDecode<JwtPayload>(token)
      const email = payload.email

      apiFetch<Usuario>(`/personas/${payload.persona_id}`)
        .then((data) => {
          setUsuario({
            nombre: data.nombre,
            apellido: data.apellido,
            correo: data.correo || email,
          })
        })
        .catch(() => {
          setUsuario({
            nombre: 'Usuario',
            apellido: '',
            correo: email,
          })
        })
    }
  }, [token])

  const handleCambiar = () => {
    if (!contrasena) {
      setMensajeError('Debe ingresar una nueva contraseña')
      setMostrarError(true)
      return
    }
    setMostrarConfirmacion(true)
  }

  const confirmarCambio = async () => {
    if (!usuario) return
    setMostrarConfirmacion(false)
    try {
      const res = await apiFetch<BackendResponse>(
        `/${usuario.correo}/password/update`,
        {
          method: 'PATCH',
          body: JSON.stringify({ password: contrasena }),
        }
      )

      if (res.estado === 'Exitoso') {
        setMostrarExito(true)
        setContrasena('')
      } else {
        setMensajeError(res.message || 'Error desconocido')
        setMostrarError(true)
      }
    } catch {
      setMensajeError('Error al cambiar la contraseña, intente nuevamente.')
      setMostrarError(true)
    }
  }

  return (
    <div className="w-full px-4 pt-9 flex justify-center items-start">
      <div className="w-full max-w-xl bg-white p-4 sm:p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-[#3a2a19] text-center mb-4">
          Recuperar contraseña
        </h1>

        {!usuario ? (
          <p className="text-center text-gray-600">Cargando datos...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[#7d4f2b] mb-1">Nombre</label>
              <input
                type="text"
                value={`${usuario.nombre} ${usuario.apellido}`}
                readOnly
                className="w-full border border-[#7d4f2b] rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#7d4f2b] mb-1">Correo</label>
              <input
                type="email"
                value={usuario.correo}
                readOnly
                className="w-full border border-[#7d4f2b] rounded px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[#7d4f2b] mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full border border-[#7d4f2b] rounded px-3 py-2"
              />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={handleCambiar}
                className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Cambiar contraseña
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarConfirmacion && usuario && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="mb-6 text-[#3a2a19]">
              ¿Está seguro de querer cambiar la contraseña del usuario{' '}
              <strong>{usuario.nombre} {usuario.apellido}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmarCambio}
                className="bg-[#7d4f2b] text-white px-4 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="bg-[#ccc] text-[#3a2a19] px-4 py-2 rounded hover:bg-[#bbb]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarExito && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <p className="mb-6 text-[#3a2a19]">
              La contraseña ha sido cambiada con éxito
            </p>
            <button
              onClick={() => setMostrarExito(false)}
              className="bg-[#7d4f2b] text-white px-4 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ERROR */}
      {mostrarError && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center border border-red-400">
            <p className="mb-6 text-red-600">{mensajeError}</p>
            <button
              onClick={() => setMostrarError(false)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
