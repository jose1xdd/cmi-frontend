'use client'

import { useEffect, useState } from 'react'
import { Trash, Search, Upload, X, Download, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

/* Hook para debounce */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

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

interface Parcialidad {
  id: number
  nombre: string
}

interface ParcialidadResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Parcialidad[]
}

interface UploadError {
  fila: number
  id: string
  mensaje: string
}

interface UploadResponse {
  status: string
  insertados: number
  total_procesados: number
  errores: UploadError[]
}

export default function ParcialidadesPage() {
  const router = useRouter()

  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [parcialidadSeleccionada, setParcialidadSeleccionada] = useState<Parcialidad | null>(null)

  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(1)

  const [busqueda, setBusqueda] = useState('')
  const debouncedBusqueda = useDebounce(busqueda, 500)

  // carga masiva
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  const fetchParcialidades = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })
      if (debouncedBusqueda) {
        params.append('nombre', debouncedBusqueda)
      }

      const data = await apiFetch<ParcialidadResponse>(`/parcialidad/?${params.toString()}`)
      setParcialidades(data.items)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error('Error cargando parcialidades:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParcialidades()
  }, [page, debouncedBusqueda])

  const confirmarEliminacion = (parcialidad: Parcialidad) => {
    setParcialidadSeleccionada(parcialidad)
    setMostrarModalConfirmacion(true)
  }

  const cancelarEliminacion = () => {
    setParcialidadSeleccionada(null)
    setMostrarModalConfirmacion(false)
  }

  const eliminarParcialidad = async () => {
    if (parcialidadSeleccionada) {
      try {
        const res = await apiFetch<{ estado: string; message: string; data: string }>(
          `/parcialidad/${parcialidadSeleccionada.id}`,
          { method: 'DELETE' }
        )

        if (res.estado === 'Exitoso') {
          setMensajeExito('La parcialidad ha sido eliminada con éxito')
          setMostrarModalExito(true)
        } else {
          setMensajeExito(res.message || 'Error eliminando parcialidad')
          setMostrarModalExito(true)
        }
      } catch {
        setMensajeExito('Error eliminando parcialidad')
        setMostrarModalExito(true)
      } finally {
        setParcialidadSeleccionada(null)
        setMostrarModalConfirmacion(false)
      }
    }
  }

  const cerrarModalExito = async () => {
    setMostrarModalExito(false)
    await fetchParcialidades()
  }

  // subir excel
  const handleUploadExcel = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiFetch<UploadResponse>('/parcialidad/upload-excel', {
        method: 'POST',
        body: formData,
      })
      setUploadResult(res)
      fetchParcialidades()
    } catch {
      setUploadResult({
        status: 'error',
        insertados: 0,
        total_procesados: 0,
        errores: [{ fila: 0, id: '-', mensaje: 'Error al subir el archivo' }],
      })
    }
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 text-[#333] flex items-center">
        Parcialidades
        <Tooltip text="Aquí puedes gestionar las parcialidades registradas en el sistema." />
      </h1>

      {/* Buscador */}
      <div className="relative w-full sm:max-w-xs mb-4 flex items-center">
        <Search className="absolute left-3 top-2.5 text-[#7d4f2b]" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[#7d4f2b] rounded text-sm text-gray-700"
        />
        <Tooltip text="Busca parcialidades escribiendo el nombre." />
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded mb-6">
        <table className="min-w-full">
          <thead className="bg-[#7d4f2b] text-white text-center">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-6">
                  Cargando...
                </td>
              </tr>
            ) : parcialidades.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">
                  No se encontraron parcialidades
                </td>
              </tr>
            ) : (
              parcialidades.map((p, index) => (
                <tr
                  key={p.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
                >
                  <td className="px-4 py-2 text-center">{p.id}</td>
                  <td className="px-4 py-2 text-center">{p.nombre}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => confirmarEliminacion(p)}
                      className="text-[#7d4f2b] hover:text-red-600"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((prev) => prev - 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 rounded bg-[#7d4f2b] text-white disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      {/* Botones */}
      <div className="flex justify-end mt-6 gap-3">
        <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2 cursor-pointer">
          <Upload size={18} /> Carga masiva (Excel)
          <Tooltip text="Sube un archivo Excel para registrar varias parcialidades a la vez." color="white" />
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadExcel(e.target.files[0])
              }
            }}
          />
        </label>
        <button
          onClick={() => window.open('/plantillas/parcialidades.xlsx', '_blank')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2"
        >
          <Download size={18} /> Descargar formato
          <Tooltip text="Descarga la plantilla de Excel para registrar parcialidades." color="white" />
        </button>
        <button
          onClick={() => router.push('/dashboard/parcialidades/nuevo')}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
        >
          Nueva parcialidad
        </button>
      </div>

      {/* === Modales existentes se mantienen tal cual === */}

      {/* Modal resultado carga masiva */}
      {uploadResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-lg w-full text-center relative">
            <button
              onClick={() => setUploadResult(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#7d4f2b]">
              Resultado de la carga masiva
            </h2>

            <p className="text-sm text-gray-700 mb-2">
              <strong>Status:</strong> {uploadResult.status}
            </p>
            <p className="text-sm text-gray-700 mb-2">
              <strong>Insertados:</strong> {uploadResult.insertados}
            </p>
            <p className="text-sm text-gray-700 mb-4">
              <strong>Total procesados:</strong> {uploadResult.total_procesados}
            </p>

            {uploadResult.errores && uploadResult.errores.length > 0 && (
              <div className="text-left text-sm text-red-700 max-h-40 overflow-y-auto border-t pt-2">
                <p className="font-semibold mb-2">
                  Se encontraron {uploadResult.errores.length} errores:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {uploadResult.errores.map((err, idx) => (
                    <li key={idx}>
                      <strong>Fila {err.fila}</strong> (ID: {err.id}): {err.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setUploadResult(null)}
                className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación */}
      {mostrarModalConfirmacion && parcialidadSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <p className="text-lg mb-6">
              ¿Está seguro de querer eliminar la parcialidad{' '}
              <strong>{parcialidadSeleccionada.nombre}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={eliminarParcialidad}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
              <button
                onClick={cancelarEliminacion}
                className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal éxito */}
      {mostrarModalExito && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center relative">
            <p className="text-lg mb-6">{mensajeExito}</p>
            <button
              onClick={cerrarModalExito}
              className="bg-[#7d4f2b] text-white px-6 py-2 rounded hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
