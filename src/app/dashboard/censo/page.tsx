'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  FileText, 
  Filter,
  Edit3,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  Check,
  Plus,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { Tooltip } from '@/components/Tooltip'
import { apiFetch } from '@/lib/api'
import CrearCensoModal from './modal/CrearCensoModal'

// === INTERFACES ===
interface CensoProceso {
  id: number
  anio: number
  estado: 'PROCESANDO' | 'COMPLETADO'
  fechaInicio: string // ISO 8601
  esPrueba: boolean
  generadoPor: string
  mensaje: string
  fechaFin?: string // Puede no estar si está procesando
}

interface CensosResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: CensoProceso[]
}

interface CensoStatsResponse {
  // Asumiendo que tienes un endpoint para estadísticas, si no, puedes calcularlas aquí
  // Por ahora, no hay endpoint de stats, así que lo manejaremos localmente
}

export default function CensosPage() {
  // Estados
  const [censos, setCensos] = useState<CensoProceso[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  // Filtros
  const [anioFiltro, setAnioFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Estados para modales
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [tipoCrearModal, setTipoCrearModal] = useState<'borrador' | 'definitivo' | null>(null)

  // === Cargar censos ===
  const fetchCensos = async () => {
    setLoading(true)
    setMensajeError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      })
      if (anioFiltro) params.append('anio', anioFiltro)
      if (estadoFiltro) params.append('estado', estadoFiltro.toUpperCase()) // El backend espera 'PROCESANDO' o 'COMPLETADO'

      const data = await apiFetch<CensosResponse>(`/censo/procesos?${params.toString()}`)
      setCensos(data.items)
      setTotalPages(data.total_pages || 1)
    } catch (err: any) {
      console.error('Error al cargar censos', err)
      setMensajeError(err.message || 'No se pudieron cargar los censos.')
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchCensos()
  }, [page, anioFiltro, estadoFiltro]) // <-- Agregar filtros a las dependencias

  // === Estadísticas (calcular localmente a partir de los datos cargados) ===
  const totalBorradores = censos.filter(c => c.esPrueba).length
  const totalDefinitivos = censos.filter(c => !c.esPrueba).length
  // Suponiendo que el total de registros se puede inferir del mensaje o de otro endpoint
  // Por ahora, pondremos un placeholder o dejamos pendiente si no está en la respuesta
  const totalRegistros = 0 // <-- Pendiente: calcular si se puede o hacer otra llamada

  // === Acciones ===
  const handleView = (c: CensoProceso) => {
    // Lógica para ver detalles (quizás abrir un modal con más info)
    console.log('Ver detalles de censo', c)
  }

  const handleDownload = async (c: CensoProceso) => {
    try {
      // Usar apiFetch para descargar el archivo Excel
      // Este endpoint probablemente devuelve un blob
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-quillacinga.ddns.net/cmi-apigateway'}/censo/exportar/${c.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error al descargar censo: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `censo_proceso_${c.id}_anio_${c.anio}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error al descargar censo', err)
      setMensajeError(err.message || 'No se pudo descargar el archivo.')
    }
  }

  // === Funciones para modales ===
  const openCrearBorradorModal = () => {
    setTipoCrearModal('borrador')
    setShowCrearModal(true)
  }

  const openCrearDefinitivoModal = () => {
    setTipoCrearModal('definitivo')
    setShowCrearModal(true)
  }

  const closeCrearModal = () => {
    setShowCrearModal(false)
    setTipoCrearModal(null)
  }

  const handleCrearSuccess = () => {
    closeCrearModal()
    fetchCensos() // Recarga la lista
  }

  // === Resetear filtros ===
  const handleClearFilters = () => {
    setAnioFiltro('')
    setEstadoFiltro('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con botones */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
              <Users size={25} className="text-[#7d4f2b]" />
              Gestión de Censos
              <Tooltip text="Aquí puedes ver, crear y gestionar los procesos de censos comunitarios." />
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openCrearBorradorModal}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2.5 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <FileText size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Censo Borrador</span>
            </button>

            <button
              onClick={openCrearDefinitivoModal}
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2.5 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Check size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Censo Definitivo</span>
            </button>
          </div>
        </div>
                <div className="flex flex-col sm:flex-row gap-4">
          <AnimatedFilterField
            icon={Calendar}
            label="Filtrar por año"
            value={anioFiltro}
            onChange={setAnioFiltro}
            placeholder="Ej: 2025"
            texttooltip="Filtra los procesos de censo por año de generación."
          />

          <AnimatedFilterField
            as="select"
            icon={Filter}
            label="Estado"
            value={estadoFiltro}
            onChange={setEstadoFiltro}
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'PROCESANDO', label: 'Procesando' },
              { value: 'COMPLETADO', label: 'Completado' },
            ]}
            texttooltip="Filtra los procesos por su estado actual."
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Censos Borradores"
          value={totalBorradores}
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-blue-50"
          color="text-blue-700"
        />
        <StatCard
          label="Censos Definitivos"
          value={totalDefinitivos}
          icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-green-50"
          color="text-green-700"
        />
        <StatCard
          label="Total de Procesos"
          value={censos.length}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-[#f8f5f0]"
          color="text-[#7d4f2b]"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">Año</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Fecha de Inicio</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Estado</th>
                <th className="px-5 py-3 text-center text-sm font-medium">¿Es Prueba?</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Generado por</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    Cargando censos...
                  </td>
                </tr>
              ) : censos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No se encontraron procesos de censo
                  </td>
                </tr>
              ) : (
                censos.map((c, index) => (
                  <tr key={c.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{c.anio}</td>
                    <td className="px-5 py-3 text-gray-800">
                      {new Date(c.fechaInicio).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.estado === 'COMPLETADO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.estado === 'COMPLETADO' ? 'Completado' : 'Procesando'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {c.esPrueba ? (
                        <span className="text-orange-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-green-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-800">{c.generadoPor}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleView(c)}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors p-1"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(c)}
                          className="text-[#7d4f2b] hover:text-green-600 transition-colors p-1"
                          title="Descargar censo (Excel)"
                        >
                          <Download size={16} />
                        </button>
                      </div>
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

      {/* Mensaje de error global */}
      {mensajeError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {mensajeError}
          <button
            onClick={() => setMensajeError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Modal: Crear Censo */}
      {showCrearModal && tipoCrearModal && (
        <CrearCensoModal
          onClose={closeCrearModal}
          onSuccess={handleCrearSuccess}
          tipoCrearModal={tipoCrearModal}
        />
      )}
    </div>
  )
}