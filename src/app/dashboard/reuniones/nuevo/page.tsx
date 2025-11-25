'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, Calendar, Clock, MapPin, FileText, Info } from 'lucide-react'

interface NuevaReunionFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function NuevaReunionForm({ onClose, onSuccess }: NuevaReunionFormProps) {
  const [titulo, setTitulo] = useState('')
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModalExito, setShowModalExito] = useState(false)

  const agendarReunion = async () => {
    if (!titulo || !fecha || !horaInicio || !horaFin || !ubicacion) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    setLoading(true)
    try {
      await apiFetch(`/reunion/reunion/create`, {
        method: 'POST',
        body: JSON.stringify({ titulo, fecha, horaInicio, horaFinal: horaFin, ubicacion }),
      })
      setShowModalExito(true)
    } catch (err) {
      console.error('Error agendando reunión', err)
      alert('No se pudo agendar la reunión')
    } finally {
      setLoading(false)
    }
  }

  const cerrarModalExito = () => {
    setShowModalExito(false)
    onSuccess()
    onClose()
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
      {/* Encabezado */}
      <div className="modal-header flex items-center gap-3 mb-6">
        <Plus className="text-[#2c3e50]" size={24} />
        <h2 className="text-xl font-bold text-[#2c3e50]">Nueva Reunión</h2>
      </div>

      {/* Sección: Información de la reunión */}
      <section className="form-section bg-gray-50 p-5 rounded-xl mb-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="text-[#2c3e50]" size={18} />
          <h3 className="text-lg font-semibold text-[#2c3e50]">Información de la Reunión</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="form-label block text-sm font-medium text-gray-700 mb-1">
              Título de la Reunión *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Asamblea Comunitaria"
              className="form-input w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="form-input w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="form-label block text-sm font-medium text-gray-700 mb-1">
                Hora Inicio *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="form-input w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="form-label block text-sm font-medium text-gray-700 mb-1">
                Hora Fin *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="form-input w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ej: Salón Comunal, Casa del Cabildo"
                className="form-input w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mensaje informativo */}
      <div className="info-box bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6 flex items-start gap-3">
        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <p className="text-sm text-gray-700">
          Al crear la reunión, se generará automáticamente un código QR único que los asistentes podrán usar para registrar su asistencia.
        </p>
      </div>

      {/* Botones */}
      <div className="modal-actions flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="btn-secondary bg-gray-200 text-gray-800 hover:bg-gray-300 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={agendarReunion}
          disabled={loading}
          className="btn-primary bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creando...' : 'Crear Reunión'}
        </button>
      </div>

      {/* Modal de éxito */}
      {showModalExito && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
            <p className="text-lg mb-6">Reunión creada con éxito</p>
            <button
              onClick={cerrarModalExito}
              className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded-lg"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}