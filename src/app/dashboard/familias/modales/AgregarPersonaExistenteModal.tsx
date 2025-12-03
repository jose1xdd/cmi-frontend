import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { UserPlus, Search, X, Users, User, FileText } from 'lucide-react'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { Tooltip } from '@/components/Tooltip'

// Interfaces
interface Persona {
  id: string
  nombre: string
  apellido: string
  tipoDocumento: string
  idFamilia: number | null
}

interface PersonasResponse {
  items: Persona[]
  total_items: number
  current_page: number
  total_pages: number
}

interface AgregarPersonaExistenteModalProps {
  familiaId: number
  idsMiembrosFamilia: string[]
  onClose: () => void
  onSuccess: (idPersona: string) => void,
}

export default function AgregarPersonaExistenteModal({
  familiaId,
  idsMiembrosFamilia,
  onClose,
  onSuccess,
}: AgregarPersonaExistenteModalProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  
  // Filtros y paginación
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

    // Estado para todas las personas obtenidas
  const [todasLasPersonas, setTodasLasPersonas] = useState<Persona[]>([])
  // Estado para mostrar las filtradas
  const [personasAFiltrar, setPersonasAFiltrar] = useState<Persona[]>([])

  // Cargar personas no asociadas a la familia
  const fetchPersonas = async () => {
    setLoading(true)
    setMensajeError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '100',
        activo: 'true',
        // Opcional: si el backend soporta este filtro, es lo ideal
        // exclude_familia: 'true' // <-- Ejemplo: si el backend lo soporta
      })
      if (busqueda) {
        if (/^\d+$/.test(busqueda)) {
          params.append('id', busqueda)
        } else {
          params.append('nombre', busqueda)
        }
      }

      const data = await apiFetch<PersonasResponse>(`/personas/?${params.toString()}`)
      setTodasLasPersonas(data.items || [])
    } catch (err) {
      console.error('Error al cargar personas disponibles', err)
      setMensajeError('No se pudieron cargar las personas disponibles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const filtradas = todasLasPersonas.filter(
      p => !idsMiembrosFamilia.includes(p.id) && p.idFamilia === null
    )
    setPersonasAFiltrar(filtradas)
  }, [todasLasPersonas, idsMiembrosFamilia])

  useEffect(() => {
    fetchPersonas()
  }, [page, busqueda])

  const handleAgregar = async (personaId: string) => {
    try {
      setMensajeError(null)
      setLoading(true) // si tienes un estado loading, opcional

      const payload = {
        familia_id: Number(familiaId), // convertir a número si tu API espera integer
        personas_id: [personaId],       // arreglo de ids (strings según tu spec)
      }
      const res = await apiFetch<{ success?: boolean; message?: string }>(
        '/personas/assing-family',
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      )
      console.log('Respuesta de la API al agregar persona a familia:', res)

      // Ajusta la comprobación según lo que devuelva tu API
      if (
        res &&
        (
          res.total_asignadas
        )
      ) {
        onSuccess()
      } else {
        const msg = (res && (res.message || (res as any).message)) || 'No fue posible agregar la persona a la familia.'
        setMensajeError(msg)
      }
    } catch (err: any) {
      console.error('Error al asociar persona a familia', err)
      const msg = err?.message || 'No se pudo asociar la persona a la familia.'
      setMensajeError(msg)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#7d4f2b]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#7d4f2b]" />
            </div>
            <h2 className="text-lg font-bold text-[#2c3e50]">Agregar Persona Existente</h2>
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
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Filtros */}
          <div className="mb-4">
            <AnimatedFilterField
              icon={Search}
              label="Buscar persona"
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Buscar por nombre o ID..."
              texttooltip="Busca personas que no estén en esta familia por nombre o número de documento."
            />
          </div>

          {/* Mensajes */}
          {mensajeError && (
            <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700 mb-4">
              {mensajeError}
            </div>
          )}

          {
            loading ? (
              <p className="text-center text-gray-500 py-4">Cargando personas disponibles...</p>
            ) : personasAFiltrar.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p>No hay personas sin familia disponibles para agregar.</p>
                {busqueda && <p className="text-sm mt-2">Intenta con otro criterio de búsqueda.</p>}
              </div>
            ) : (
            <>
              {/* Tabla de personas */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-[#7d4f2b] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Documento</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personasAFiltrar.map((p) => ( // <-- Usar personasAFiltrar
                      <tr key={p.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-800">{p.nombre} {p.apellido}</td>
                        <td className="px-4 py-3 text-gray-800 font-mono">{p.id}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleAgregar(p.id)}
                            className="text-[#7d4f2b] hover:text-white hover:bg-[#7d4f2b] border border-[#7d4f2b] px-3 py-1 rounded-full text-sm transition-colors"
                            title={`Agregar a ${p.nombre} a esta familia`}
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f] disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}