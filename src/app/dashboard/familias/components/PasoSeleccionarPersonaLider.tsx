'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { User, Search, Users, X, AlertCircle } from 'lucide-react'
import { Tooltip } from '@/components/Tooltip'

interface Persona {
  id: string
  nombre: string
  apellido: string
  tipoDocumento: string
  idFamilia: number | null // null si no tiene familia
}

interface PersonaResponse {
  items: Persona[]
  total_items: number
  current_page: number
  total_pages: number
}

interface PasoSeleccionarPersonaLiderProps {
  onPersonaSeleccionada: (idPersona: string) => void // Callback para cuando se selecciona una persona
  onCancelar: () => void // Callback para volver al menú principal del modal
}

export default function PasoSeleccionarPersonaLider({
  onPersonaSeleccionada,
  onCancelar,
}: PasoSeleccionarPersonaLiderProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [personasAFiltrar, setPersonasAFiltrar] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  // Cargar personas disponibles (sin familia)
  useEffect(() => {
    const cargarPersonas = async () => {
      try {
        setLoading(true)
        // Asumiendo que el backend tiene un filtro para personas sin familia
        // Si no, se filtra aquí en el frontend
        const params = new URLSearchParams({
          page: '1',
          page_size: '100',
          activo: 'true',
          // Opcional: si el backend soporta este filtro
          // exclude_familia: 'true'
        })
        if (busqueda) {
          if (/^\d+$/.test(busqueda)) {
            params.append('id', busqueda)
          } else {
            params.append('nombre', busqueda)
          }
        }

        const data = await apiFetch<PersonaResponse>(`/personas/?${params.toString()}`)
        // Filtrar en el frontend si el backend no lo hace
        const sinFamilia = data.items.filter(p => p.idFamilia === null)
        setPersonas(sinFamilia)
        setPersonasAFiltrar(sinFamilia)
      } catch (err) {
        console.error('Error al cargar personas disponibles', err)
        setMensajeError('No se pudieron cargar las personas disponibles.')
      } finally {
        setLoading(false)
      }
    }
    cargarPersonas()
  }, [busqueda])

  // Filtrar personas localmente si se cambia la búsqueda
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

  const handleSeleccionar = (idPersona: string) => {
    onPersonaSeleccionada(idPersona)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-blue-800">Seleccionar persona existente como líder</h3>
          <p className="text-sm text-blue-700 mt-1">
            Busca y selecciona una persona ya registrada en el sistema que será el líder de la nueva familia.
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
        <Tooltip text="Busca personas ya registradas que no pertenezcan a ninguna familia." />
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
                  <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {personasAFiltrar.map((p, index) => (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-800">{p.nombre} {p.apellido}</td>
                    <td className="px-4 py-3 text-gray-800 font-mono">{p.id}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleSeleccionar(p.id)}
                        className="text-[#7d4f2b] hover:text-white hover:bg-[#7d4f2b] border border-[#7d4f2b] px-3 py-1 rounded-full text-sm transition-colors"
                        title={`Seleccionar a ${p.nombre} como líder`}
                      >
                        Seleccionar
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