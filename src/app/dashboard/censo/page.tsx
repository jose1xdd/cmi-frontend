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
  fechaInicio: string
  esPrueba: boolean
  generadoPor: string
  mensaje: string
  fechaFin?: string
}

interface CensosResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: CensoProceso[]
}

export default function CensosPage() {
  const [censos, setCensos] = useState<CensoProceso[]>([])
  const [loading, setLoading] = useState(true)
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const [anioFiltro, setAnioFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [showCrearModal, setShowCrearModal] = useState(false)
  const [tipoCrearModal, setTipoCrearModal] = useState<'borrador' | 'definitivo' | null>(null)

  const fetchCensos = async () => {
    setLoading(true)
    setMensajeError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      })
      if (anioFiltro) params.append('anio', anioFiltro)
      if (estadoFiltro) params.append('estado', estadoFiltro.toUpperCase())

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

  useEffect(() => {
    fetchCensos()
  }, [page, anioFiltro, estadoFiltro])

  const totalBorradores = censos.filter(c => c.esPrueba).length
  const totalDefinitivos = censos.filter(c => !c.esPrueba).length

  const handleDownload = async (c: CensoProceso) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-quillacinga.ddns.net/cmi-apigateway'}/censo/exportar/${c.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) throw new Error(`Error al descargar censo: ${response.status}`)

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
    fetchCensos()
  }

  const handleClearFilters = () => {
    setAnioFiltro('')
    setEstadoFiltro('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
            <Users size={25} className="text-[#7d4f2b]" />
            Gestión de Censos
            <Tooltip text="Aquí puedes ver, crear y gestionar los procesos de censos comunitarios." />
          </h1>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Censos Borradores" value={totalBorradores} icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />} bg="bg-blue-50" color="text-blue-700" />
        <StatCard label="Censos Definitivos" value={totalDefinitivos} icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6" />} bg="bg-green-50" color="text-green-700" />
        <StatCard label="Total de Procesos" value={censos.length} icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />} bg="bg-[#f8f5f0]" color="text-[#7d4f2b]" />
      </div>

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
                  <td colSpan={6} className="text-center py-6 text-gray-500">Cargando censos...</td>
                </tr>
              ) : censos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">No se encontraron procesos</td>
                </tr>
              ) : (
                censos.map((c, index) => (
                  <tr key={c.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{c.anio}</td>
                    <td className="px-5 py-3 text-gray-800">{new Date(c.fechaInicio).toLocaleDateString('es-ES')}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{c.estado === 'COMPLETADO' ? 'Completado' : 'Procesando'}</span>
                    </td>
                    <td className="px-5 py-3 text-center">{c.esPrueba ? <span className="text-orange-600 font-medium">Sí</span> : <span className="text-green-600 font-medium">No</span>}</td>
                    <td className="px-5 py-3 text-gray-800">{c.generadoPor}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2">
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

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
        <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50">Anterior</button>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-[#7d4f2b] text-white hover:bg-[#5e3c1f] disabled:opacity-50">Siguiente</button>
        </div>
      </div>

      {mensajeError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          {mensajeError}
          <button onClick={() => setMensajeError(null)} className="float-right text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {showCrearModal && tipoCrearModal && (
        <CrearCensoModal onClose={closeCrearModal} onSuccess={handleCrearSuccess} tipoCrearModal={tipoCrearModal} />
      )}
    </div>
  )
}
