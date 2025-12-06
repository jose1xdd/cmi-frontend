'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, Users, X, AlertCircle, UserPlus } from 'lucide-react'
import PasoCrearPersonaLider from '../components/PasoCrearPersonaLider'
import PasoSeleccionarPersonaLider from '../components/PasoSeleccionarPersonaLider'


interface CrearFamiliaModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CrearFamiliaModal({
  onClose,
  onSuccess,
}: CrearFamiliaModalProps) {
  const [opcion, setOpcion] = useState<'menu' | 'crearPersona' | 'seleccionarPersona'>('menu')
  const [mensajeModal, setMensajeModal] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // === Lógica principal: Crear familia y asignar líder ===
  const crearFamiliaYLider = async (idPersonaLider: string) => {
    setLoading(true)
    setMensajeModal(null)

    const payload2 = {
      "representanteId": `${idPersonaLider}`,
      "estado": "ACTIVA"
    }
    try {
      // 1. Crear la familia vacía
      const familiaRes = await apiFetch<{ id: number }>(`/familias/create`, {
        method: 'POST',
        body: JSON.stringify(payload2),
      })
      
      // 2. Asignar la familia a la persona líder
      // Obtener datos actuales de la persona
      const personaActual = await apiFetch<Persona>(`/personas/${idPersonaLider}`)
      // Preparar payload

      const payload = {
        "familia_id": familiaRes.data.id,
        "personas_id": [
          personaActual.id
        ]
      }
      // Actualizar persona
      await apiFetch(`/personas/assing-family`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      onSuccess()
    } catch (err: any) {
      console.error('Error al crear familia o asignar líder', err)
      // Intentar parsear el mensaje del backend si es posible
      let msg = 'Error al crear la familia.'
      if (err?.mensaje) {
        msg = err.mensaje
      } else if (err?.message) {
        msg = err.message
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        msg = (err as any).message
      }
      setMensajeModal(msg)
    } finally {
      setLoading(false)
    }
  }

  // === Handlers para los pasos ===
  const handlePersonaCreada = async (idPersona: string) => {
    await crearFamiliaYLider(idPersona)
  }

  const handlePersonaSeleccionada = async (idPersona: string) => {
    await crearFamiliaYLider(idPersona)
  }

  // === JSX ===
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7d4f2b] flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">
              {opcion === 'menu'
                ? 'Crear nueva familia'
                : opcion === 'crearPersona'
                ? 'Crear nueva persona como líder'
                : 'Seleccionar persona existente como líder'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de error global */}
        {mensajeModal && (
          <div className="p-4 border-b border-gray-200 bg-red-50 text-red-700 text-sm">
            {mensajeModal}
          </div>
        )}

        {/* Cuerpo del modal */}
        <div className="p-5 flex-1 overflow-y-auto">
          {opcion === 'menu' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-yellow-800">¿Cómo deseas crear la familia?</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Puedes designar como líder a una persona nueva o seleccionar una existente en el sistema.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setOpcion('crearPersona')}
                  className="relative overflow-hidden bg-[#7d4f2b] text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 text-base font-medium transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5 flex-1"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <UserPlus size={24} className="stroke-[3] relative z-10" />
                  <span className="relative z-10">Crear nueva persona como líder</span>
                </button>

                <button
                  onClick={() => setOpcion('seleccionarPersona')}
                  className="relative overflow-hidden bg-blue-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-3 text-base font-medium transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5 flex-1"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <Users size={24} className="stroke-[3] relative z-10" />
                  <span className="relative z-10">Seleccionar persona existente</span>
                </button>
              </div>
            </div>
          )}

          {opcion === 'crearPersona' && (
            <PasoCrearPersonaLider
              onCancelar={() => setOpcion('menu')}
              onSuccess={onSuccess}
            />
          )}

          {opcion === 'seleccionarPersona' && (
            <PasoSeleccionarPersonaLider
              onPersonaSeleccionada={handlePersonaSeleccionada}
              onCancelar={() => setOpcion('menu')}
            />
          )}
        </div>

      </div>
    </div>
  )
}