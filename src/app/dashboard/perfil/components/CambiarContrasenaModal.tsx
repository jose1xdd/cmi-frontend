'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Key, X } from 'lucide-react'

interface CambiarContrasenaModalProps {
  correo: string
  nombre: string
  apellido: string
  onClose: () => void
  onSuccess: () => void
}

export default function CambiarContrasenaModal({
  correo,
  nombre,
  apellido,
  onClose,
  onSuccess,
}: CambiarContrasenaModalProps) {
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [mostrarExito, setMostrarExito] = useState(false)
  const [mostrarError, setMostrarError] = useState(false)
  const [mensajeError, setMensajeError] = useState('')



  // Validación
  const handleCambiar = () => {
    if (!nuevaContrasena.trim()) {
      setMensajeError('Debe ingresar una nueva contraseña.')
      setMostrarError(true)
      return
    }
    if (nuevaContrasena !== confirmarContrasena) {
      setMensajeError('Las contraseñas no coinciden.')
      setMostrarError(true)
      return
    }
    if (nuevaContrasena.length < 6) {
      setMensajeError('La contraseña debe tener al menos 6 caracteres.')
      setMostrarError(true)
      return
    }
    setMostrarConfirmacion(true)
  }

  const confirmarCambio = async () => {
    setMostrarConfirmacion(false)
    try {
      // Endpoint exacto de tu versión anterior
      const res = await apiFetch<{ estado: string; message: string; data: string }>(
        `/${correo}/password/update`,
        {
          method: 'PATCH',
          body: JSON.stringify({ password: nuevaContrasena }),
        }
      )

      if (res.estado === 'Exitoso') {
        setMostrarExito(true)
        setNuevaContrasena('')
      } else {
        setMensajeError(res.message || 'Error al cambiar la contraseña.')
        setMostrarError(true)
      }
    } catch {
      setMensajeError('Error de conexión. Intente nuevamente.')
      setMostrarError(true)
    }
  }

  const cerrarModal = () => {
    onClose()
    setMostrarConfirmacion(false)
    setMostrarExito(false)
    setMostrarError(false)
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="text-[#7d4f2b]" size={20} />
            <h2 className="text-lg font-bold text-[#2c3e50]">Cambiar contraseña</h2>
          </div>
          <button onClick={cerrarModal} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={`${nombre} ${apellido}`}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              value={correo}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-800 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <input
                type="password"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                placeholder="••••••••"
            />
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
                type="password"
                value={confirmarContrasena}
                onChange={(e) => setConfirmarContrasena(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                placeholder="••••••••"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleCambiar}
              className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f] transition-colors"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>

        {/* Modal de confirmación */}
        {mostrarConfirmacion && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
              <p className="text-gray-800 mb-6">
                ¿Está seguro de querer cambiar la contraseña del usuario{' '}
                <strong>{nombre} {apellido}</strong>?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={confirmarCambio}
                  className="bg-[#7d4f2b] text-white px-4 py-2 rounded-lg hover:bg-[#5e3c1f]"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de éxito */}
        {mostrarExito && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
              <p className="text-gray-800 mb-6">La contraseña ha sido cambiada con éxito.</p>
              <button
                onClick={() => {
                  setMostrarExito(false)
                  onSuccess()
                }}
                className="bg-[#7d4f2b] text-white px-4 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Modal de error */}
        {mostrarError && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center border border-red-300">
              <p className="text-red-600 mb-6">{mensajeError}</p>
              <button
                onClick={() => setMostrarError(false)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}