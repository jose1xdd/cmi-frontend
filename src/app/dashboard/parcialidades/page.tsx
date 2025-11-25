'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Search,
  Trash2,
  Upload,
  Download,
  Plus,
  X,
  FileText,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Tooltip } from '@/components/Tooltip'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import CrearParcialidadModal from './nuevo/page'

// Tipos
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
  const [showCrearParcialidadModal, setShowCrearParcialidadModal] = useState(false)

  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [busqueda, setBusqueda] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // === Cargar parcialidades ===
  const fetchParcialidades = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      })
      if (busqueda) params.append('nombre', busqueda)

      const data = await apiFetch<ParcialidadResponse>(`/parcialidad/?${params.toString()}`)
      setParcialidades(data.items)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Error cargando parcialidades', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParcialidades()
  }, [page, busqueda])

  // === Eliminación ===
  const handleDelete = (parcialidad: Parcialidad) => setParcialidadSeleccionada(parcialidad)

  const confirmDelete = async () => {
    if (!parcialidadSeleccionada) return
    try {
      const res = await apiFetch<{ estado: string; message: string }>(
        `/parcialidad/${parcialidadSeleccionada.id}`,
        { method: 'DELETE' }
      )

      if (res.estado === 'Exitoso') {
        setSuccessMessage('La parcialidad ha sido eliminada con éxito')
      } else {
        setSuccessMessage(res.message || 'Error al eliminar la parcialidad')
      }
    } catch {
      setSuccessMessage('Error inesperado al eliminar la parcialidad')
    } finally {
      setParcialidadSeleccionada(null)
      setShowSuccessModal(true)
    }
  }

  const closeModal = () => {
    setParcialidadSeleccionada(null)
    setShowSuccessModal(false)
    setUploadResult(null)
  }

  // === Carga masiva ===
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
    <div>
      {/* Encabezado y controles */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
            <Users size={25} className="text-[#7d4f2b]" />
            Parcialidades
            <Tooltip text="Aquí puedes gestionar las parcialidades registradas en el sistema." />
          </h1>

          <div className="flex flex-wrap gap-2">
            {/* Carga masiva */}
            <label className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm cursor-pointer transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]">
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Upload size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Carga masiva</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUploadExcel(e.target.files[0])}
              />
              <Tooltip text="Sube un archivo Excel para registrar varias parcialidades a la vez." color='white'/>
            </label>

            {/* Descargar formato */}
            <button
              onClick={() => window.open('/plantillas/plantilla_parcialidades.xlsx', '_blank')}
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Descargar formato</span>
              <Tooltip text="Descarga la plantilla de Excel para registrar parcialidades." color='white'/>
            </button>

            {/* Nueva parcialidad */}
            <button
              onClick={() => setShowCrearParcialidadModal(true)}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Plus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Nueva parcialidad</span>
            </button>
          </div>
        </div>

        {/* Filtro de búsqueda */}
        <AnimatedFilterField
          icon={Search}
          label="Buscar por nombre"
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Ej: San Juan"
          texttooltip="Busca parcialidades escribiendo el nombre."
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-center text-sm font-medium">ID</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Nombre</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : parcialidades.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-500">
                    No se encontraron parcialidades
                  </td>
                </tr>
              ) : (
                parcialidades.map((p, index) => (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 text-center text-gray-800">{p.id}</td>
                    <td className="px-5 py-3 text-center text-gray-800">{p.nombre}</td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-[#7d4f2b] hover:text-red-600 transition-colors"
                        title="Eliminar parcialidad"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f] disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* === Modales === */}

      {/* Modal: Confirmar eliminación */}
      {parcialidadSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Eliminar parcialidad</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar la parcialidad{' '}
              <span className="font-medium text-[#7d4f2b]">{parcialidadSeleccionada.nombre}</span>?
              <br />
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resultado carga masiva */}
      {uploadResult && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Resultado de la carga masiva</h2>
            <div className="text-sm space-y-2 text-gray-700">
              <p><strong>Status:</strong> {uploadResult.status}</p>
              <p><strong>Insertados:</strong> {uploadResult.insertados}</p>
              <p><strong>Total procesados:</strong> {uploadResult.total_procesados}</p>
            </div>

            {uploadResult.errores?.length > 0 && (
              <div className="mt-4 text-left text-sm text-red-700 max-h-40 overflow-y-auto border-t pt-2">
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

            <div className="mt-6 text-right">
              <button
                onClick={closeModal}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Éxito / Error general */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <p className="text-gray-800 mb-6">{successMessage}</p>
            <div className="text-center">
              <button
                onClick={() => {
                  closeModal()
                  fetchParcialidades()
                }}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva parcialidad */}
      {showCrearParcialidadModal && (
        <CrearParcialidadModal
          onClose={() => setShowCrearParcialidadModal(false)}
          onSuccess={() => {
            setShowCrearParcialidadModal(false)
            fetchParcialidades() // Recarga la lista
          }}
        />
      )}
    </div>
  )
}