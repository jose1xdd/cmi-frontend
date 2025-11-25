'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Trash2,
  Upload,
  Download,
  Plus,
  X,
  User,
  FileText,
  Building,
  UsersRound,
  CircleCheck,
  CircleX,
  Eye,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Tooltip } from '@/components/Tooltip'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { StatCard } from '@/components/StatCard'
import CrearFamiliaModal from './nuevo/CrearFamiliaModal'

// === INTERFACES ===

// Lo que devuelve la API
interface Representante {
  id: string
  tipoDocumento: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  parentesco: string
  sexo: string
  profesion: string
  escolaridad: string
  direccion: string
  telefono: string
  activo: boolean
  fechaDefuncion?: string
  idFamilia: number
  parcialidad?: {
    id: number
    nombre: string
  }
}

interface FamiliaApi {
  id: number
  representante_id: string
  estado: 'ACTIVA' | 'INACTIVA'
  representante: Representante
}

interface FamiliaApiResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: FamiliaApi[]
}

// Lo que usamos internamente en el componente
interface Familia {
  id: number
  lider: string
  cedula: string
  parcialidad: string
  miembros: number
  estado: 'activa' | 'inactiva'
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

// === COMPONENTE PRINCIPAL ===
export default function FamiliaPage() {
  const router = useRouter()

  const [familias, setFamilias] = useState<Familia[]>([])
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<Familia | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCrearFamiliaModal, setShowCrearFamiliaModal] = useState(false)

  const [totalFamilias, setTotalFamilias] = useState(0)
  const [totalPersonas , setTotalPersonas] = useState(0)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroParcialidad, setFiltroParcialidad] = useState('')
  const [filtroMiembros, setFiltroMiembros] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const cargarStats = async () => {
    const data = await apiFetch<any>(`/familias/estadisticas-generales`)
    setTotalFamilias(data.total_familias)
    setTotalPersonas(data.total_personas)
  }

  // === CARGAR FAMILIAS ===
  const fetchFamilias = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '9',
      })
      if (busqueda) params.append('query', busqueda)
      if (filtroParcialidad) params.append('parcialidad_id', filtroParcialidad)
      // NOTA: 'miembros' y 'estado' probablemente no estén soportados por el backend tal como están.
      // Si no están, debes filtrar en el frontend o usar endpoints específicos si existen.
      // Por ahora, los pasamos por si acaso.
      if (filtroEstado) params.append('estado', filtroEstado.toUpperCase())
      if (filtroMiembros) params.append('rango_miembros', filtroMiembros)

      const data = await apiFetch<FamiliaApiResponse>(`/familias/search?${params.toString()}`)

      // Mapear la respuesta de la API a nuestro formato interno
      const familiasMapeadas: Familia[] = await Promise.all(
        data.items.map(async (apiFam) => {
          const tieneRepresentante = !!apiFam.representante;
          const lider = tieneRepresentante
            ? `${apiFam.representante.nombre} ${apiFam.representante.apellido}`
            : 'Sin líder';
          const cedula = tieneRepresentante ? apiFam.representante.id : '-';
          const parcialidadNombre = tieneRepresentante
            ? apiFam.representante.parcialidad?.nombre || '-'
            : '-';
          // Calcular número de miembros
          let conteoMiembros = 0
          try {
            const paramsMiembros = new URLSearchParams({
              idFamilia: apiFam.id.toString(),
              page: '1',
              page_size: '1', // Solo necesitamos el total
            })
            const res = await apiFetch<{ total_items: number }>(`/personas/?${paramsMiembros.toString()}`)
            conteoMiembros = res.total_items || 0
          } catch (err) {
            console.error(`Error al contar miembros de la familia ${apiFam.id}`, err)
            // Dejar en 0 si falla
          }
           return {
              id: apiFam.id,
              lider,
              cedula,
              parcialidad: parcialidadNombre,
              miembros: conteoMiembros,
              estado: apiFam.estado.toLowerCase() as 'activa' | 'inactiva',
            }
        })
      )

      setFamilias(familiasMapeadas)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      console.error('Error cargando familias', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilias()
    cargarStats()
  }, [page, busqueda, filtroParcialidad, filtroEstado, filtroMiembros])

  // === ACCIONES ===
  const handleDelete = (familia: Familia) => setFamiliaSeleccionada(familia)

  const confirmDelete = async () => {
    if (!familiaSeleccionada) return
    try {
      const res = await apiFetch<{ estado: string; message: string }>(
        `/familias/${familiaSeleccionada.id}`,
        { method: 'DELETE' }
      )
      setSuccessMessage(
        res.estado === 'Exitoso'
          ? 'La familia ha sido eliminada con éxito'
          : res.message || 'Error al eliminar la familia'
      )
    } catch {
      setSuccessMessage('Error inesperado al eliminar la familia')
    } finally {
      setFamiliaSeleccionada(null)
      setShowSuccessModal(true)
    }
  }

  const closeModal = () => {
    setFamiliaSeleccionada(null)
    setShowSuccessModal(false)
    setUploadResult(null)
  }

  // === CARGA MASIVA ===
  const handleUploadExcel = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await apiFetch<UploadResponse>('/familias/upload-excel', {
        method: 'POST',
        body: formData,
      })
      setUploadResult(res)
      fetchFamilias()
    } catch {
      setUploadResult({
        status: 'error',
        insertados: 0,
        total_procesados: 0,
        errores: [{ fila: 0, id: '-', mensaje: 'Error al subir el archivo' }],
      })
    }
  }

  // === DATOS PARA FILTROS ===
  // Debes cargarlos desde la API
  const [parcialidades, setParcialidades] = useState<{ id: number; nombre: string }[]>([])
  const [loadingParcialidades, setLoadingParcialidades] = useState(true)

  const fetchParcialidades = async () => {
    try {
      const data = await apiFetch<{ items: { id: number; nombre: string }[] }>(
        '/parcialidad/?page=1&page_size=100'
      )
      setParcialidades(data.items || [])
    } catch (err) {
      console.error('Error al cargar parcialidades', err)
    } finally {
      setLoadingParcialidades(false)
    }
  }

  useEffect(() => {
    fetchParcialidades()
  }, [])

  const rangosMiembros = [
    { value: '1-3', label: '1-3 miembros' },
    { value: '4-6', label: '4-6 miembros' },
    { value: '7+', label: '7+ miembros' },
  ]

  return (
    <div>
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
              <Users size={25} className="text-[#7d4f2b]" />
              Gestión de Familias
              <Tooltip text="Desde esta sección, puedes administrar todas las familias que han sido registradas."/>
            </h1>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 pt-2">
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
              <Tooltip text="Sube un archivo Excel para registrar varias familias a la vez." color='white'/>
            </label>

            <button
              onClick={() => window.open('/plantillas/plantilla_familia.xlsx', '_blank')}
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Descargar formato</span>
              <Tooltip text="Descarga la plantilla de Excel para registrar familias." color='white'/>
            </button>

            <button
              onClick={() => setShowCrearFamiliaModal(true)}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Plus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Agregar Familia</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-3 justify-between">
            <div className="flex flex-col md:flex-row gap-10">
              <AnimatedFilterField
                icon={User}
                label="Buscar"
                value={busqueda}
                onChange={setBusqueda}
                placeholder="Líder, cédula o número de familia..."
                texttooltip="Busca por nombre del líder, cédula o ID de familia."
              />

              <AnimatedFilterField
                as="select"
                icon={Building}
                label="Parcialidad"
                value={filtroParcialidad}
                onChange={setFiltroParcialidad}
                options={[
                  { value: '', label: 'Todas las parcialidades' },
                  ...parcialidades.map((p) => ({ value: p.nombre, label: p.nombre })),
                ]}
                texttooltip="Filtra por parcialidad geográfica."
              />

              <AnimatedFilterField
                as="select"
                icon={UsersRound}
                label="Miembros"
                value={filtroMiembros}
                onChange={setFiltroMiembros}
                options={[
                  { value: '', label: 'Todos' },
                  ...rangosMiembros,
                ]}
                texttooltip="Filtra por número de miembros en la familia."
              />

              <AnimatedFilterField
                as="select"
                icon={FileText}
                label="Estado"
                value={filtroEstado}
                onChange={setFiltroEstado}
                options={[
                  { value: '', label: 'Todos los estados' },
                  { value: 'activa', label: 'Activa' },
                  { value: 'inactiva', label: 'Inactiva' },
                ]}
                texttooltip="Filtra por estado de la familia."
              />
            </div>
            <div>
          </div>
        </div>
      </div>
    </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-6 mt-6 mb-6">
        <StatCard
          label="Total de familias"
          value={totalFamilias}
          icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
          bg="bg-[#f3e5f5]"
          color="text-[#9C27B0]"
        />
        <StatCard
          label="Total de personas"
          value={totalPersonas}
          icon={<User className="w-4 h-4 sm:w-5 sm:h-5" />}
          bg="bg-[#e3f2fd]"
          color="text-[#2196F3]"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">#</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Líder</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Cédula</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Parcialidad</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Miembros</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : familias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No se encontraron familias
                  </td>
                </tr>
              ) : (
                familias.map((f, index) => (
                  <tr key={f.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-4 text-gray-800">
                      <span className="font-mono font-medium text-[#7d4f2b]">Fam-{f.id.toString().padStart(3, '0')}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-800 font-medium">{f.lider}</td>
                    <td className="px-5 py-4 text-gray-800 font-mono">{f.cedula}</td>
                    <td className="px-5 py-4 text-gray-800">{f.parcialidad}</td>
                    <td className="px-5 py-4 text-gray-800">{f.miembros} persona{f.miembros !== 1 ? 's' : ''}</td>
                    <td className="px-5 py-4">
                      {f.estado === 'activa' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CircleCheck size={12} />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <CircleX size={12} />
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/familias/ver?id=${f.id}`)}
                        className="text-[#7d4f2b] mr-2 hover:text-blue-600 transition-colors"
                        title="Ver familia"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
                        className="text-[#7d4f2b] hover:text-red-600 transition-colors"
                        title="Eliminar familia"
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

      {/* === MODALES === */}

      {/* Modal: Confirmar eliminación */}
      {familiaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Eliminar familia</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar la familia de{' '}
              <span className="font-medium text-[#7d4f2b]">{familiaSeleccionada.lider}</span>?
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
                <p className="font-semibold mb-2">Errores encontrados:</p>
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

      {/* Modal: Éxito / Error */}
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
                  fetchFamilias()
                }}
                className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear familia */}
      {showCrearFamiliaModal && (
        <CrearFamiliaModal
          onClose={() => setShowCrearFamiliaModal(false)}
          onSuccess={() => {
            setShowCrearFamiliaModal(false)
            fetchFamilias()
          }}
        />
      )}
    </div>
  )
}