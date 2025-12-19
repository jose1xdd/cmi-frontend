'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Search, Users, AlertCircle} from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

// Tipos (ajusta según tu backend)
interface Persona {
  id: string
  nombre: string
  apellido: string
  tipoDocumento: string
  idFamilia: number | null // null si no tiene familia
  parcialidad?: { id: number; nombre: string } | null
  sexo: string
  fechaNacimiento: string
  parentesco: string
  escolaridad: string
  profesion: string
}

interface PersonaResponse {
  items: Persona[]
  total_items: number
  current_page: number
  total_pages: number
}

interface PasoSeleccionarPersonaLiderProps {
  familiaId: number // <-- Nuevo: ID de la familia objetivo
  idsMiembrosFamilia: string[] // <-- Nuevo: IDs de los miembros actuales (para excluirlos)
  onPersonaSeleccionada: (idPersona: string) => void // Callback para cuando se selecciona una persona
  onCancelar: () => void // Callback para volver al menú principal del modal
}

export default function PasoSeleccionarPersonaLider({
  familiaId,
  idsMiembrosFamilia,
  onPersonaSeleccionada,
  onCancelar,
}: PasoSeleccionarPersonaLiderProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [personasAFiltrar, setPersonasAFiltrar] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // Cargar personas disponibles (que no estén en la familia actual)
  useEffect(() => {
    const cargarPersonas = async () => {
      setLoading(true)
      setMensajeError(null)
      try {
        const params = new URLSearchParams({
          page: '1',
          page_size: '100',
          activo: 'true',
          // No excluyas por idFamilia aquí si el backend no lo soporta
        })
        if (busqueda) {
          if (/^\d+$/.test(busqueda)) {
            params.append('id', busqueda)
          } else {
            params.append('nombre', busqueda)
          }
        }

        const data = await apiFetch<PersonaResponse>(`/personas/?${params.toString()}`)
        // Filtrar en el frontend: excluir a los miembros actuales de la familia
        const disponibles = data.items.filter(p => p.idFamilia == familiaId)
        setPersonas(disponibles)
        setPersonasAFiltrar(disponibles)
      } catch (err) {
        console.error('Error al cargar personas disponibles', err)
        setMensajeError('No se pudieron cargar las personas disponibles.')
      } finally {
        setLoading(false)
      }
    }
    cargarPersonas()
  }, [busqueda])

  // Filtrar personas localmente si se cambia la búsqueda o cambian los miembros
  useEffect(() => {
    if (!busqueda) {
      setPersonasAFiltrar(personas)
    } else {
      const filtradas = personas.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.id.includes(busqueda)
      )
      setPersonasAFiltrar(filtradas)
    }
  }, [busqueda, personas])

    const handleSeleccionar = async (idPersona: string) => {
    try {
        // 1. Llamar al endpoint para actualizar el líder de la familia
        await apiFetch(`/familias/update`, {
        method: 'PUT',
        body: JSON.stringify({
            familiaId: familiaId,
            representanteId: idPersona,
        }),
        })
        // 2. Notificar al padre que se seleccionó exitosamente
        onPersonaSeleccionada(idPersona)
    } catch (err: any) {
        console.error('Error al asignar nuevo líder', err)
        setMensajeError(err.message || 'No se pudo asignar la persona como líder.')
    }
    }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-blue-800">Asignar nuevo líder a la familia</h3>
          <p className="text-sm text-blue-700 mt-1">
            Busca y selecciona una persona ya registrada en el sistema que será el nuevo líder de la familia #{familiaId}.
          </p>
        </div>
      </div>

      {/* Filtro de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-[#7d4f2b]" size={18} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o documento..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-[#7d4f2b] focus:border-transparent"
        />
        <Tooltip text="Busca personas ya registradas que no pertenezcan a esta familia." />
      </div>

      {mensajeError && (
        <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700">
          {mensajeError}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-4">Cargando personas disponibles...</p>
      ) : personasAFiltrar.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p>No hay personas disponibles para asignar como líder.</p>
          {busqueda && <p className="text-sm mt-2">Intenta con otro criterio de búsqueda.</p>}
        </div>
      ) : (
        <>
          {/* Tabla de personas */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full">
              <thead className="bg-[#f8f9fa] text-[#2c3e50]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Documento</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Parcialidad</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {personasAFiltrar.map((p, index) => (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-800">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 text-gray-800 font-mono">{p.id}</td>
                    <td className="px-4 py-3 text-gray-800">{p.parcialidad?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            console.log("CLICK REAL")
                            handleSeleccionar(p.id)
                        }}
                        className="text-[#7d4f2b] hover:text-white hover:bg-[#7d4f2b] border border-[#7d4f2b] px-3 py-1 rounded-full text-sm transition-colors"
                        title={`Asignar a ${p.nombre} como líder`}
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancelar}
          className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  )
}