'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Download,
  Eye,
  Trash2,
  Building,
  User,
  X,
  CircleCheck,
  CircleX,
  ChevronRight,
  HeartMinus,
  Edit3,
  VenusAndMars,
  UserRound,
  UserX,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { enumParentesco } from '@/constants/enums'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { StatCard } from '@/components/StatCard'
import FormularioPersonaPage from '../../personas/formulario/page'
import VerPersonaModal from '../../personas/modales/VerPersonaModal'
import RegistrarDefuncionModal from '../../personas/modales/DefuncionModal'
import AgregarPersonaExistenteModal from '../modales/AgregarPersonaExistenteModal'
import PasoSeleccionarPersonaLider from '../components/AsignarNuevoLider'

// Interfaces
interface Persona {
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
  idFamilia: number | null
  parcialidad: { id: number; nombre: string } | null
  fechaDefuncion: string | null
}

interface Familia {
  [key: string]: any;
}


interface PersonaResponse {
  total_items: number
  current_page: number
  total_pages: number
  items: Persona[]
}

interface Parcialidad {
  id: number
  nombre: string
}

interface ParcialidadResponse {
  items: Parcialidad[]
}

export default function DetalleFamiliaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const familiaId = Number(searchParams.get('id'))
  const [idsMiembrosFamilia, setIdsMiembrosFamilia] = useState<string[]>([])
  const [showAsignarLiderModal, setShowAsignarLiderModal] = useState(false)

  // Estado de la familia (única)
  const [familia, setFamilia] = useState<any>(null)
  const [loadingFamilia, setLoadingFamilia] = useState(true)

  // Estados stats
  const [totalPersonas, setTotalPersonas] = useState(0)
  const [activos, setActivos] = useState(0)
  const [inactivos, setInactivos] = useState(0)

  // Estados de las personas (miembros de la familia)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingPersonas, setLoadingPersonas] = useState(false)

  // Filtros para las personas
  const [busqueda, setBusqueda] = useState('')
  const [filtroParcialidad, setFiltroParcialidad] = useState('')
  const [filtroSexo, setFiltroSexo] = useState('')

  // Estados para modales
  const [showAgregarPersonaModal, setShowAgregarPersonaModal] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [personaAEditar, setPersonaAEditar] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<Persona | null>(null)
  const [userToDelete, setUserToDelete] = useState<Persona | null>(null)
  const [showDefuncionModal, setShowDefuncionModal] = useState(false)
  const [showAgregarExistenteModal, setShowAgregarExistenteModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // === Cargar datos iniciales ===

  // 1. Cargar la familia específica (obteniendo datos del líder)
  const fetchFamilia = async () => {
    setLoadingFamilia(true)
    try {
      // Endpoint correcto: GET /familias/{id_familia}
      // Este endpoint devuelve los datos del líder de la familia
      const familia = await apiFetch<Familia>(`/familias/${familiaId}`)

      // Mapear la respuesta del líder a la estructura de `familia`
      setFamilia({
        id: familia?.id ?? '—', // si no existe el id
        lider: familia?.representante
          ? `${familia.representante?.nombre ?? 'No encontrado'} ${familia.representante?.apellido ?? ''}`.trim()
          : 'No encontrado',
        cedula: familia?.representante?.id ?? 'No encontrado',
        parcialidad: familia?.representante?.parcialidad?.nombre ?? 'No encontrado',
        miembros: 0, // se actualiza luego
        estado: familia?.estado ?? 'No encontrado',
      })
    } catch (err) {
      console.error('Error al cargar la familia', err)
      // router.push('/dashboard/familias') // Opcional: redirigir si no existe
    } finally {
      setLoadingFamilia(false)
    }
  }

  // 2. Cargar las personas de la familia
  const fetchPersonas = async () => {
    setLoadingPersonas(true)
    try {
      const params = new URLSearchParams({
        idFamilia: familiaId.toString(), // Filtrar por familia
        page: page.toString(),
        page_size: '10',
      })

      // Aplicar filtros
      if (busqueda) {
        // El campo de búsqueda actual es "nombre", pero puede que el backend espere "q" o "nombre"
        // Si busqueda contiene espacio, asumiremos que es "nombre apellido"
        if (busqueda.includes(' ')) {
          const [nombre, apellido] = busqueda.split(' ', 2)
          if (nombre) params.append('nombre', nombre)
          if (apellido) params.append('apellido', apellido)
        } else {
          params.append('nombre', busqueda)
        }
      }
      if (filtroParcialidad) params.append('idParcialidad', filtroParcialidad)
      if (filtroSexo) params.append('sexo', filtroSexo)

      const data = await apiFetch<PersonaResponse>(`/personas/?${params.toString()}`)
      setPersonas(data.items)
      setTotalPages(data.total_pages || 1)

      // Actualizar el conteo de miembros en la info de la familia
      if (familia) {
        setFamilia(prev => ({ ...prev, miembros: data.total_items }))
      }
    } catch (err) {
      console.error('Error al cargar personas de la familia', err)
    } finally {
      setLoadingPersonas(false)
    }
  }

  // 3. Cargar catálogos
  const fetchCatalogos = async () => {
    try {
      const data = await apiFetch<ParcialidadResponse>('/parcialidad/?page=1&page_size=100')
      setParcialidades(data.items || [])
    } catch (err) {
      console.error('Error al cargar parcialidades', err)
    }
  }

  // === Efectos ===
  useEffect(() => {
    if (familiaId) {
      fetchFamilia()
    }
  }, [familiaId])

  useEffect(() => {
    if (familiaId) {
      fetchPersonas()
    }
  }, [familiaId, page, busqueda, filtroParcialidad, filtroSexo])

  useEffect(() => {
    fetchCatalogos()
  }, [])

  // === Lógica ===

  // Actualizar lista de IDs de miembros cuando cambian las personas
  useEffect(() => {
    const ids = personas.map(p => p.id)
    setIdsMiembrosFamilia(ids)
  }, [personas])

  // === Acciones ===
  const handleVerUsuario = (persona: Persona) => setSelectedUser(persona)
  const handleEditar = (id: string) => {
    setPersonaAEditar(id)
    setEditModalOpen(true)
  }
  const confirmarEliminacion = (persona: Persona) => setUserToDelete(persona)
  const cerrarModal = () => {
    setSelectedUser(null)
    setUserToDelete(null)
  }

  const handleBorrarLider = async () => {
    try {
      // 1. Llamar al endpoint para actualizar el líder de la familia
      await apiFetch(`/familias/update`, {
        method: 'PUT',
        body: JSON.stringify({
          familiaId: familiaId,
          representanteId: null,
        }),
      })
      fetchFamilia()
    } catch (err: any) {
      console.error('Error al asignar nuevo líder', err)
    }
  }

const handleDownloadResumen = async () => {
  if (!familiaId) {
    return
  }

  try {
    setLoading(true)

    // 1. Obtener token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay token de sesión.')
    }

    // 2. Hacer la solicitud al endpoint de reporte
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-quillacinga.ddns.net/cmi-apigateway'}/reportes/reporte/familia/${familiaId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    // 3. Obtener el blob del archivo
    const blob = await response.blob()

    // 4. Crear URL y enlace para descargar
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // Opcional: extraer nombre del archivo del header 'content-disposition'
    const disposition = response.headers.get('Content-Disposition')
    let filename = `informe_familia_${familiaId}.xlsx` // nombre por defecto
    if (disposition && disposition.includes('attachment')) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '')
      }
    }
    link.download = filename

    document.body.appendChild(link)
    link.click()
    link.remove()

    // 5. Liberar la URL del objeto
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Error al descargar informe familiar', err)
  } finally {
    setLoading(false)
  }
}

  const eliminarUsuario = async () => {
    if (!userToDelete) return
    try {
      const res = await apiFetch<Persona>(`/personas/unassign-family/${userToDelete.id}`, {
        method: 'PATCH',
        body: '{}',
      })
  
      // Actualizar estado local
      setPersonas(prev => prev.filter(p => p.id !== userToDelete.id))
      if (personas.length === 1 && page > 1) setPage(p => p - 1)
      setFamilia(prev => prev ? { ...prev, miembros: prev.miembros - 1 } : null)

    } catch (err: any) {
      console.error('Error al remover persona de la familia', err)
    } finally {
      setUserToDelete(null)
    }
  }

  if (loadingFamilia) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Cargando información de la familia...
      </div>
    )
  }

  if (!familia) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        Familia no encontrada.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con breadcrumb */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <button
            onClick={() => router.push('/dashboard/familias')}
            className="hover:text-[#7d4f2b] transition-colors"
          >
            Familias
          </button>
          <ChevronRight size={16} className="mx-2" />
          <span>Familia {familia.id.toString().padStart(3, '0')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
          <Users size={25} className="text-[#7d4f2b]" />
          Familia {familia.id.toString().padStart(3, '0')}
        </h1>
        <p className="text-gray-600 mt-1">Líder: {familia.lider}</p>
      </div>

      {/* Tarjeta de información de la familia */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Información de la Familia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Número de Familia</span>
            <span className="font-medium text-gray-800">Fam-{familia.id.toString().padStart(3, '0')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Líder de Familia</span>
            <span className="font-medium text-gray-800">{familia.lider}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Cédula del Líder</span>
            <span className="font-mono font-medium text-gray-800">{familia.cedula}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Parcialidad</span>
            <span className="font-medium text-gray-800">{familia.parcialidad}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Total Miembros</span>
            <span className="font-medium text-gray-800">{familia.miembros} personas</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Estado</span>
            <span className="font-medium">
              {familia.estado === 'ACTIVA' ? (
                <span className="text-green-600">Activa</span>
              ) : (
                <span className="text-red-600">Inactiva</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Estadísticas de miembros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Total de Miembros"
          value={totalPersonas}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-[#f8f5f0]"
          color="text-[#7d4f2b]"
        />
        <StatCard
          label="Miembros Vivos"
          value={activos}
          icon={<CircleCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-green-50"
          color="text-green-700"
        />
        <StatCard
          label="Miembros Fallecidos"
          value={inactivos}
          icon={<CircleX className="w-5 h-5 sm:w-6 sm:h-6" />}
          bg="bg-red-50"
          color="text-red-700"
        />
      </div>

      {/* Sección de miembros */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-[#2c3e50]">Miembros de la Familia</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAgregarPersonaModal(true)}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <UserPlus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Agregar Persona</span>
            </button>

            <button
              onClick={() => setShowAgregarExistenteModal(true)}
              className="relative overflow-hidden bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <User className="stroke-[3] relative z-10" size={16} />
              <span className="relative z-10">Agregar Persona Existente</span>
            </button>

{/* Botón: Agregar Persona Existente */}
            <button
              onClick={() => setShowAgregarExistenteModal(true)}
              className="relative overflow-hidden bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <User className="stroke-[3] relative z-10" size={16} />
              <span className="relative z-10">Agregar Persona Existente</span>
            </button>

            {/* Botón: Eliminar Líder (condicional) */}
            {familia?.lider && familia.lider !== 'No encontrado' && (
              <button
                onClick={handleBorrarLider}
                className="relative overflow-hidden bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <UserX size={16} className="stroke-[3] relative z-10" />
                <span className="relative z-10">Eliminar Líder</span>
              </button>
            )}

            {/* Botón: Asignar Nuevo Líder (condicional) */}
            {!familia?.lider || familia.lider === 'No encontrado' && (
              <button
                onClick={() => setShowAsignarLiderModal(true)}
                className="relative overflow-hidden bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-700 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <UserRound size={16} className="stroke-[3] relative z-10" />
                <span className="relative z-10">Asignar Nuevo Líder</span>
              </button>
            )}

            <button
              onClick={() => setShowDefuncionModal(true)}
              className="relative overflow-hidden bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <HeartMinus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Registrar Defunción</span>
            </button>

            <button
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
              onClick={handleDownloadResumen}
              disabled={loading}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Informe Familiar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
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
            icon={VenusAndMars}
            label="Parcialidad"
            value={filtroSexo}
            onChange={setFiltroSexo}
            options={[
              { value: '', label: 'Todos los sexos' },
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
            ]}
            texttooltip="Filtra por parcialidad geográfica."
          />

        </div>

        {/* Tabla de miembros */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-[#f8f9fa] text-[#2c3e50] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Nombre</th>
                <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Parentesco</th>
                <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Parcialidad</th>
                <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider">Documento</th>
                <th className="px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider">Edad</th>
                <th className="px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-center text-sm font-semibold uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingPersonas ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    Cargando miembros...
                  </td>
                </tr>
              ) : personas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    No se encontraron miembros
                  </td>
                </tr>
              ) : (
                personas.map((p, index) => (
                  <tr key={p.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 text-gray-800 font-medium">{p.nombre} {p.apellido}</td>
                    <td className="px-5 py-3 text-gray-800">
                      {enumParentesco[p.parentesco as keyof typeof enumParentesco] || p.parentesco}
                    </td>
                    <td className="px-5 py-3 text-gray-800">{p.parcialidad?.nombre || '-'}</td>
                    <td className="px-5 py-3 text-gray-800 font-mono">{p.id}</td>
                    <td className="px-5 py-3 text-center text-gray-800">
                      {(() => {
                        const nacimiento = new Date(p.fechaNacimiento)
                        const hoy = new Date()
                        let edad = hoy.getFullYear() - nacimiento.getFullYear()
                        const mes = hoy.getMonth() - nacimiento.getMonth()
                        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
                          edad--
                        }
                        return `${edad} años`
                      })()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.fechaDefuncion ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <CircleX size={12} />
                          Fallecido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CircleCheck size={12} />
                          Vivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleVerUsuario(p)}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditar(p.id)}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors"
                          title="Editar persona"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => confirmarEliminacion(p)}
                          className="text-[#7d4f2b] hover:text-red-600 transition-colors"
                          title="Remover de la familia"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
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
      </div>

      {/* === Modales === */}

      {/* Modal: Ver Persona */}
      {selectedUser && (
        <VerPersonaModal
          persona={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Modal: Eliminar Persona */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Remover de la familia</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de remover a <strong>{userToDelete.nombre} {userToDelete.apellido}</strong> de esta familia?<br />
              Esta acción no elimina la persona, solo la desvincula de la familia.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={cerrarModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={eliminarUsuario} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Persona */}
      {showAgregarPersonaModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <FormularioPersonaPage
            idFamilia={familiaId}
            onClose={() => setShowAgregarPersonaModal(false)}
            onSuccess={() => {
              setShowAgregarPersonaModal(false)
              fetchPersonas() // Recarga la lista
            }}
          />
        </div>
      )}

      {/* Modal: Editar Persona */}
      {editModalOpen && personaAEditar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <FormularioPersonaPage
            idPersona={personaAEditar}
            onClose={() => setEditModalOpen(false)}
            onSuccess={() => {
              setEditModalOpen(false)
              fetchPersonas()
            }}
          />
        </div>
      )}

      {/* Modal: Registrar Defunción */}
      {showDefuncionModal && (
        <RegistrarDefuncionModal
          familiaId={familia.id}
          // PASAR LA LISTA DE PERSONAS VIVAS DE LA FAMILIA
          personasDisponibles={personas.filter(p => !p.fechaDefuncion)} // Solo vivos
          onClose={() => setShowDefuncionModal(false)}
          onSuccess={() => {
            setShowDefuncionModal(false)
            fetchPersonas() // Recarga la lista de personas
          }}
        />
      )}

      {/* Modal: Agregar Persona Existente */}
      {showAgregarExistenteModal && (
        <AgregarPersonaExistenteModal
          familiaId={familia.id}
          idsMiembrosFamilia={idsMiembrosFamilia}
          onClose={() => setShowAgregarExistenteModal(false)}
          onSuccess={() => {
            setShowAgregarExistenteModal(false)
            fetchPersonas() // Recarga la lista
          }}
        />
      )}

      {/* Modal: Asignar Nuevo Líder */}
      {showAsignarLiderModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7d4f2b] flex items-center justify-center">
                  <UserRound className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#2c3e50]">Asignar Nuevo Líder a la Familia</h2>
              </div>
              <button
                onClick={() => setShowAsignarLiderModal(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh]">
              <PasoSeleccionarPersonaLider
                key={`asignar-lider-modal-${showAsignarLiderModal}`}
                familiaId={familiaId}
                idsMiembrosFamilia={idsMiembrosFamilia}
                onPersonaSeleccionada={(id) => {
                  setShowAsignarLiderModal(false)
                  fetchFamilia()
                  fetchPersonas()
                }}
                onCancelar={() => setShowAsignarLiderModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}