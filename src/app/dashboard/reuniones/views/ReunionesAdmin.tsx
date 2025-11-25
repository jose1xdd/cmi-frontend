'use client'
import { useEffect, useState } from 'react'
import {
  Calendar,
  Search,
  MapPin,
  Plus,
  BarChart3,
  CalendarDays,
  X,
  Projector,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { Tooltip } from '@/components/Tooltip'
import NuevaReunionForm from '../nuevo/page'
import { StatCard } from '@/components/StatCard'
import { ReunionesTabs } from '../components/ReunionesTabs'

// Tipos
interface Reunion {
  id: number
  titulo: string
  fecha: string
  horaInicio: string
  horaFinal: string
  ubicacion: string
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'COMPLETADA' | 'CANCELADA'
  asistentes?: number
  codigo?: string
}

interface ReunionesResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Reunion[]
}

export default function ReunionesAdmin() {
  const router = useRouter()

  // Filtros
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [tituloFiltro, setTituloFiltro] = useState('')
  const [ubicacionFiltro, setUbicacionFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  // Paginación
  const [page, setPage] = useState(1)

  // Datos
  const [reuniones, setReuniones] = useState<Reunion[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [data, setData] = useState<ReunionesResponse | null>(null) // Estado para toda la respuesta
  const [proximas, setProximas] = useState(0)
  const [enCurso, setEnCruso] = useState(0)
  const [cerradas, setCerradas] = useState(0)
  const [total, setTotal] = useState(0)

  // Estados para modales
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showVerModal, setShowVerModal] = useState(false)
  const [reunionSeleccionada, setReunionSeleccionada] = useState<Reunion | null>(null)
  const [tab, setTab] = useState<'todas' | 'PROGRAMADA' | 'EN_CURSO' | 'CERRADA'>('todas')
  const [modalAbierto, setModalAbierto] = useState(false)

  // Estados para confirmación de eliminación
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [mensajeError, setMensajeError] = useState('')

  // === Cargar reuniones ===
  const fetchReuniones = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '5',
      })
      if (fechaFiltro) params.append('fecha', fechaFiltro)
      if (tituloFiltro) params.append('titulo', tituloFiltro)
      if (ubicacionFiltro) params.append('ubicacion', ubicacionFiltro)
      if (estadoFiltro) params.append('estado', estadoFiltro)

      const data = await apiFetch<ReunionesResponse>(`/reunion/reunion/?${params.toString()}`)
      setData(data)
      setReuniones(data.items)
      setTotalPages(data.total_pages || 1)
      setTotal(data.total_items)
      console.log(data.items)
    } catch (err) {
      console.error('Error cargando reuniones', err)
      setMensajeError('No se pudieron cargar las reuniones.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }


  const fetchStats = async() => {
    const data = await apiFetch<any>(`/reunion/reunion/estadisticas/por-estado`)
    setProximas(data.programadas)
    setEnCruso(data.en_curso)
    setCerradas(data.cerradas)
  }

  useEffect(() => {
    if (modalAbierto) {
      // Cuando se abre un modal, bloquear el scroll
      document.body.classList.add('overflow-hidden')
    } else {
      // Cuando se cierra el último modal, restaurar el scroll
      document.body.classList.remove('overflow-hidden')
    }
    // Cleanup: restaurar scroll al desmontar el componente
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [modalAbierto])

  const handleTabChange = (newTab: 'todas' | 'PROGRAMADA' | 'EN_CURSO' | 'CERRADA') => {
    setTab(newTab);
    setPage(1); // resetear página
    // Al cambiar el tab, seteas el estadoFiltro para que el fetch lo use
    if (newTab === 'todas') {
      setEstadoFiltro("");
    } else if (newTab === 'CERRADA') {
      setEstadoFiltro("CERRADA");
    } else if (newTab === 'EN_CURSO') {
      setEstadoFiltro("EN_CURSO");
    } else if (newTab === 'PROGRAMADA') {
      setEstadoFiltro("PROGRAMADA");
    }
  };

const handleAbrir = async (id: number) => {
  setLoading(true)
  try {
    await apiFetch<any>(`/reunion/reunion/${id}/abrir`, {
      method: "PATCH"
    })
    fetchReuniones() // refrescar tabla
    fetchStats()
  } catch (error) {
    console.error("Error al abrir la reunión", error)
  } finally {
    setLoading(false)
  }
}

const handleCerrar = async (id: number) => {
  setLoading(true)
  try {
    await apiFetch<any>(`/reunion/reunion/${id}/cerrar`, {
      method: "PATCH"
    })
    fetchReuniones()
    fetchStats()
  } catch (error) {
    console.error("Error al cerrar la reunión", error)
  } finally {
    setLoading(false)
  }
}



  // === Handlers de modales ===
  const abrirModalCrear = () => {
    setShowCrearModal(true)
    setModalAbierto(true) // <-- Marcar que un modal está abierto
  }

  const abrirModalVer = (id: number) => {
    const reunion = reuniones.find(r => r.id === id)
    if (reunion) {
      setReunionSeleccionada(reunion)
      setShowVerModal(true)
      setModalAbierto(true) // <-- Marcar que un modal está abierto
    }
  }

  const abrirModalConfirmarEliminar = (reunion: Reunion) => {
    setReunionSeleccionada(reunion)
    setShowConfirmModal(true)
    setModalAbierto(true) // <-- Marcar que un modal está abierto
  }

  // Funciones para cerrar modales (deben marcar que ya no hay modales abiertos)
  const cerrarModalCrear = () => {
    setShowCrearModal(false)
    // Opcional: usar setTimeout para que el estado cambie después de la animación de cierre
    setTimeout(() => setModalAbierto(!!(showEditarModal || showVerModal || showConfirmModal)), 300)
  }

  const cerrarModalEditar = () => {
    setShowEditarModal(false)
    setTimeout(() => setModalAbierto(!!(showCrearModal || showVerModal || showConfirmModal)), 300)
  }

  const cerrarModalVer = () => {
    setShowVerModal(false)
    setTimeout(() => setModalAbierto(!!(showCrearModal || showEditarModal || showConfirmModal)), 300)
  }

  const cerrarModalConfirmarEliminar = () => {
    setShowConfirmModal(false)
    setTimeout(() => setModalAbierto(!!(showCrearModal || showEditarModal || showVerModal)), 300)
  }

  useEffect(() => {
    fetchReuniones()
    fetchStats()
  }, [page, fechaFiltro, tituloFiltro, ubicacionFiltro, estadoFiltro])

  // === Acciones ===

  const handleVer = (id: number) => {
    router.push(`/dashboard/reuniones/${id}`)
  }

  const handleGestionar = (reunion: Reunion) => {
    router.push(`/dashboard/reuniones/${reunion.id}`)
  }

  const handleCompletar = async (id: number) => {
    try {
      await apiFetch(`/reunion/reunion/${id}/cerrar`, { method: 'PATCH' })
      // Recargar la lista para reflejar el nuevo estado
      fetchReuniones()
    } catch (err) {
      console.error('Error al completar reunión', err)
      setMensajeError('No se pudo completar la reunión.')
      setShowErrorModal(true)
    }
  }

  const handleCancelar = async (id: number) => {
    try {
      await apiFetch(`/reunion/reunion/${id}/cancelar`, { method: 'PATCH' }) // Asumiendo endpoint PATCH /cancelar
      // Recargar la lista para reflejar el nuevo estado
      fetchReuniones()
    } catch (err) {
      console.error('Error al cancelar reunión', err)
      setMensajeError('No se pudo cancelar la reunión.')
      setShowErrorModal(true)
    }
  }


  // === Eliminación ===
  const confirmarEliminacion = (reunion: Reunion) => {
    setReunionSeleccionada(reunion)
    setShowConfirmModal(true)
  }

  const cancelarEliminacion = () => {
    setReunionSeleccionada(null)
    setShowConfirmModal(false)
  }

  const eliminarReunion = async () => {
    if (!reunionSeleccionada) return
    try {
      await apiFetch(`/reunion/reunion/${reunionSeleccionada.id}`, {
        method: 'DELETE',
      })
      setShowConfirmModal(false)
      setShowSuccessModal(true)
      fetchReuniones() // Recargar lista
    } catch (err: any) {
      console.error('Error eliminando reunión', err)
      let msg = 'No se pudo eliminar la reunión.'
      if (err?.mensaje) msg = err.mensaje
      else if (err?.message) msg = err.message
      else if (typeof err === 'string') msg = err
      setMensajeError(msg)
      setShowErrorModal(true)
    } finally {
      setReunionSeleccionada(null)
    }
  }

  // === Handlers para modales ===
  const handleCrearSuccess = () => {
    setShowCrearModal(false)
    setModalAbierto(false)
    fetchReuniones()
  }

  const handleEditarSuccess = () => {
    setShowEditarModal(false)
    setModalAbierto(false)
    fetchReuniones()
  }

  return (
    <div>
      {/* Encabezado y controles */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#333] flex items-center gap-2">
            <CalendarDays size={25} className="text-[#7d4f2b]" />
            Gestión de Reuniones
            <Tooltip text="En esta sección puedes gestionar todas las reuniones creadas en el sistema." />
          </h1>

          <button
            onClick={abrirModalCrear}
            className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 sm:px-6 sm:py-2 rounded flex items-center gap-2 text-sm sm:text-base transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <Plus size={16} className="stroke-[3] relative z-10" />
            <span className="relative z-10">Nueva reunión</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <AnimatedFilterField
            icon={Search}
            label="Buscar por título"
            value={tituloFiltro}
            onChange={setTituloFiltro}
            placeholder="Ej: Asamblea general"
            texttooltip="Busca reuniones por coincidencia en el título."
          />

          <AnimatedFilterField
            icon={Calendar}
            label="Filtrar por fecha"
            type="date"
            value={fechaFiltro}
            onChange={setFechaFiltro}
            texttooltip="Busca reuniones por coincidencia en la fecha"
          />

          <AnimatedFilterField
            icon={MapPin}
            label="Filtrar por ubicación"
            value={ubicacionFiltro}
            onChange={setUbicacionFiltro}
            placeholder="Ej: Salón Comunal"
            texttooltip="Busca reuniones por coincidencia en la ubicación."
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Completada"
          value={proximas}
          icon={<CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-green-100"
          color="text-green-700"
        />
        <StatCard
          label="En curso"
          value={enCurso}
          icon={<Projector className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-blue-100"
          color="text-blue-700"
        />
        <StatCard
          label="Cerradas"
          value={cerradas}
          icon={<X className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-red-100"
          color="text-red-700"
        />
        <StatCard
          label="Total"
          value={total}
          icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-[#f8f5f0]"
          color="text-[#7d4f2b]"
        />
      </div>

      {/* Lista de reuniones */}
      {/* Solo renderizar ReunionesTabs cuando data esté cargada */}
      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow-sm text-center">
          <p>Cargando reuniones...</p>
        </div>
      ) : data ? (
        <ReunionesTabs
          data={data}
          onVer={handleVer}
          onAbrir={handleAbrir}
          onCerrar={handleCerrar}
          onGestionar={handleGestionar}
          onCompletar={handleCompletar}
          onCancelar={handleCancelar}
          onPageChange={setPage}
          currentTab={tab}
          onTabChange={handleTabChange}
          proximas = {proximas}
          enCurso = {enCurso}
          cerradas = {cerradas}
          totales = {total}
        />
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm text-center text-red-500">
          <p>Error al cargar las reuniones.</p>
        </div>
      )}

      {/* Modales */}

      {/* Modal: Confirmar eliminación */}
      {showConfirmModal && reunionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center relative">
            <button
              onClick={cerrarModalConfirmarEliminar}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <p className="text-lg font-medium text-gray-800 mb-2">Eliminar reunión</p>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar la reunión <strong>{reunionSeleccionada.titulo}</strong>?<br />
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={eliminarReunion}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
              <button
                onClick={cancelarEliminacion}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <p className="text-lg mb-4">Reunión eliminada con éxito.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Error */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full text-center">
            <p className="text-lg text-red-600 mb-4">{mensajeError}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Crear reunión */}
      {showCrearModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <NuevaReunionForm
            onClose={cerrarModalCrear}
            onSuccess={handleCrearSuccess}
          />
        </div>
      )}
    </div>
  )
}