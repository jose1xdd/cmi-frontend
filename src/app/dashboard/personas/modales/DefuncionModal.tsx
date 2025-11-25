'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Calendar, X, AlertTriangle, HeartMinus } from 'lucide-react'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { Tooltip } from '@/components/Tooltip'

interface Persona {
  id: string
  nombre: string
  apellido: string
  idFamilia: number | null
}

interface RegistrarDefuncionModalProps {
  familiaId: number // Pasamos el ID de la familia para filtrar
  onClose: () => void
  onSuccess: () => void
}

export default function RegistrarDefuncionModal({
  familiaId,
  onClose,
  onSuccess,
}: RegistrarDefuncionModalProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<string>('')
  const [fechaDefuncion, setFechaDefuncion] = useState('')
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // Cargar solo las personas vivas de la familia
  useEffect(() => {
    const cargarPersonas = async () => {
      try {
        const params = new URLSearchParams({
          idFamilia: familiaId.toString(),
          activo: 'true', // Filtrar solo personas vivas
          page: '1',
          page_size: '100',
        })

        const data = await apiFetch<{ items: Persona[] }>(`/personas/?${params.toString()}`)
        setPersonas(data.items || [])
      } catch (err) {
        console.error('Error al cargar personas para defunción', err)
        setMensajeError('No se pudieron cargar las personas de esta familia.')
      } finally {
        setLoading(false)
      }
    }

    cargarPersonas()
  }, [familiaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPersona || !fechaDefuncion) {
      setMensajeError('Por favor selecciona una persona y la fecha de defunción.')
      return
    }
    console.log('Registrando defunción para persona ID:', selectedPersona, 'en fecha:', fechaDefuncion)
    setLoading(true)
    setMensajeError(null)

    try {
      const res = await apiFetch<{ estado: string; message: string }>(
        '/personas/register-defuncion',
        {
          method: 'PATCH',
          body: JSON.stringify({
            id: selectedPersona,            // nuevo formato
            fechaDefuncion: fechaDefuncion, // cambia de fecha_defuncion → fechaDefuncion
          }),
        }
      )

      if (res.estado === 'Exitoso') {
        onSuccess()
      } else {
        setMensajeError(res.message || 'Error al registrar la defunción.')
      }
    } catch (err: any) {
      const msg = err?.message || 'Error inesperado al registrar la defunción.'
      setMensajeError(msg)
    } finally {
      setLoading(false)
    }
  }


  // Opciones para el selector
  const options = [
    { value: '', label: 'Seleccionar miembro...' },
    ...personas.map(p => ({
      value: p.id,
      label: `${p.nombre} ${p.apellido}`,
    })),
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <HeartMinus className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">Registrar Defunción</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded flex items-start gap-2 text-sm">
            <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <strong>Atención:</strong> Esta acción modificará el estado del miembro a "Fallecido" en el registro familiar.
            </div>
          </div>

          {mensajeError && (
            <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700">
              {mensajeError}
            </div>
          )}

          {loading ? (
            <p className="text-center text-gray-500 py-4">Cargando miembros...</p>
          ) : (
            <>
                <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <HeartMinus size={16} className="text-[#7d4f2b]" />
                    Seleccionar Miembro *
                    <Tooltip text="Selecciona la persona de esta familia que ha fallecido." />
                </label>
                <select
                    value={selectedPersona}
                    onChange={(e) => setSelectedPersona(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                >
                    {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                </div>

                <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="text-[#7d4f2b]" />
                    Fecha de Defunción *
                    <Tooltip text="Ingresa la fecha en que ocurrió la defunción." />
                </label>
                <input
                    type="date"
                    value={fechaDefuncion}
                    onChange={(e) => setFechaDefuncion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
                />
                </div>
            </>
          )}

          {/* Botones */}
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
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Registrando...' : 'Registrar Defunción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}