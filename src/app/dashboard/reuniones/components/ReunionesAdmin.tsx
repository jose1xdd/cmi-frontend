'use client'

import { useEffect, useState } from 'react'
import { Trash, Plus, Eye, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

/* Tooltip reutilizable */
function Tooltip({
  text,
  color = '#7d4f2b',
  responsive = false,
}: {
  text: string
  color?: string
  responsive?: boolean
}) {
  return (
    <div className="relative group inline-block ml-1">
      <HelpCircle className="w-4 h-4 cursor-pointer" style={{ color }} />
      <div
        className={`absolute hidden group-hover:block top-[120%] left-1/2 -translate-x-1/2
                    bg-black text-white text-xs rounded px-3 py-2 shadow-md text-left whitespace-normal z-50
                    ${responsive ? 'max-w-[80vw] sm:max-w-xs break-words' : 'min-w-[200px] max-w-xs'}`}
      >
        {text}
      </div>
    </div>
  )
}

interface Reunion {
  id: number
  titulo: string
  fecha: string
  horaInicio: string
  horaFinal: string
  ubicacion: string
}

interface ReunionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Reunion[]
}

export default function ReunionesAdmin() {
  const router = useRouter()
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [tituloFiltro, setTituloFiltro] = useState('')
  const [reuniones, setReuniones] = useState<Reunion[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [reunionSeleccionada, setReunionSeleccionada] = useState<Reunion | null>(null)
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [mostrarModalError, setMostrarModalError] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  // === LISTAR ===
  const fetchReuniones = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        ...(fechaFiltro ? { fecha: fechaFiltro } : {}),
        ...(tituloFiltro ? { titulo: tituloFiltro } : {}),
      }).toString()

      const data = await apiFetch<ReunionesResponse>(`/reunion/reunion/?${query}`)
      setReuniones(data.items)
      setTotalPages(data.total_pages)
    } catch (err) {
      console.error('Error cargando reuniones', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReuniones()
  }, [page, fechaFiltro, tituloFiltro])

  // === ELIMINAR ===
  const confirmarEliminacion = (reunion: Reunion) => {
    setReunionSeleccionada(reunion)
    setMostrarModalConfirmacion(true)
  }

  const cancelarEliminacion = () => {
    setReunionSeleccionada(null)
    setMostrarModalConfirmacion(false)
  }

  const eliminarReunion = async () => {
    if (!reunionSeleccionada) return
    try {
      await apiFetch(`/reunion/reunion/${reunionSeleccionada.id}`, {
        method: 'DELETE',
      })
      setMostrarModalConfirmacion(false)
      setMostrarModalExito(true)
      fetchReuniones()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error eliminando reunión', err)
      setMostrarModalConfirmacion(false)

      // Intentar leer el mensaje del backend
      try {
        const parsed = JSON.parse(err.message)
        setMensajeError(parsed.mensaje || 'Ocurrió un error inesperado')
      } catch {
        setMensajeError('No se pudo eliminar la reunión')
      }
      setMostrarModalError(true)
    }
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#333] flex items-center">
        Reuniones
        <Tooltip text="En esta sección puedes gestionar todas las reuniones creadas en el sistema." />
      </h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1 flex items-center">
              Filtrar por título <Tooltip text="Busca reuniones por coincidencia en el título." responsive />
            </label>
            <input
              type="text"
              value={tituloFiltro}
              onChange={e => setTituloFiltro(e.target.value)}
              className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
              placeholder="Buscar..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1 flex items-center">
              Filtrar por fecha <Tooltip text="Muestra únicamente reuniones de la fecha seleccionada." responsive />
            </label>
            <input
              type="date"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
              className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => router.push('/dashboard/reuniones/nuevo')}
            className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Nueva reunión
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded">
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500 p-6">Cargando reuniones...</p>
          ) : reuniones.length === 0 ? (
            <p className="text-center text-gray-400 p-6">No hay reuniones aún.</p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Título</th>
                  <th className="px-4 py-2 text-left">Ubicación</th>
                  <th className="px-4 py-2 text-center">Hora Inicio</th>
                  <th className="px-4 py-2 text-center">Hora Final</th>
                  <th className="px-4 py-2 text-center">Fecha</th>
                  <th className="px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reuniones.map((reunion, index) => (
                  <tr key={reunion.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-2">{reunion.id}</td>
                    <td className="px-4 py-2">{reunion.titulo}</td>
                    <td className="px-4 py-2">{reunion.ubicacion || '-'}</td>
                    <td className="px-4 py-2 text-center">{reunion.horaInicio}</td>
                    <td className="px-4 py-2 text-center">{reunion.horaFinal}</td>
                    <td className="px-4 py-2 text-center">{reunion.fecha}</td>
                    <td className="px-4 py-2 flex justify-center gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/reuniones/editar?id=${reunion.id}`)}
                        className="text-[#7d4f2b] hover:text-blue-600 flex items-center"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => confirmarEliminacion(reunion)}
                        className="text-[#7d4f2b] hover:text-red-600 flex items-center"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage(prev => prev - 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(prev => prev + 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Modal de confirmación */}
      {mostrarModalConfirmacion && reunionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <p className="text-lg mb-6">
              ¿Está seguro de querer eliminar la reunión <br />
              <strong>{reunionSeleccionada.titulo}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={eliminarReunion}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
              <button
                onClick={cancelarEliminacion}
                className="bg-[#b85c38] text-white px-5 py-2 rounded hover:bg-[#96492d]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center relative">
            <p className="text-lg mb-6">La reunión ha sido eliminada con éxito</p>
            <button
              onClick={() => setMostrarModalExito(false)}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {mostrarModalError && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center relative">
            <p className="text-lg mb-6 text-black-600">{mensajeError}</p>
            <button
              onClick={() => setMostrarModalError(false)}
              className="bg-[#b85c38] text-white px-6 py-2 rounded hover:bg-[#96492d]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
