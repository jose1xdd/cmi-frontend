'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, MapPin, X } from 'lucide-react'

interface CrearParcialidadModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CrearParcialidadModal({
  onClose,
  onSuccess,
}: CrearParcialidadModalProps) {
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      setMensajeError('El nombre de la parcialidad es obligatorio.')
      return
    }

    setLoading(true)
    setMensajeError(null)

    try {
      const res = await apiFetch<{ estado: string; message: string }>(
        '/parcialidad/create',
        {
          method: 'POST',
          body: JSON.stringify({ nombre_parcialidad: nombre.trim() }),
        }
      )

      if (res.estado === 'Exitoso') {
        onSuccess()
      } else {
        setMensajeError(res.message || 'Error al crear la parcialidad.')
      }
    } catch {
      setMensajeError('Error de conexión. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7d4f2b] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">Nueva parcialidad</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="text-[#7d4f2b]" />
              Nombre de la parcialidad *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              placeholder="Ej: San Juan Bautista"
            />
          </div>

          {mensajeError && (
            <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700">
              {mensajeError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#7d4f2b] text-white rounded-lg hover:bg-[#5e3c1f] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}