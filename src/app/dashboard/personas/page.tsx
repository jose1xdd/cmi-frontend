'use client'

import { useState, useEffect } from 'react'
import { Eye, Search, X, Upload, Download, UserPlus, Edit3, Users, User, FileText, UsersRound, Building, HeartMinus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { enumSexo, enumDocumento } from '@/constants/enums'
import { AnimatedFilterField } from '@/components/AnimatedFilterField'
import { StatCard } from '@/components/StatCard'
import FormularioPersonaPage from './formulario/page'
import { Tooltip } from '@/components/Tooltip'
import VerPersonaModal from './modales/VerPersonaModal'


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
}

interface PersonasResponse {
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

interface Familia {
  id: number
  integrantes: number
}
interface FamiliaResponse {
  items: Familia[]
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

export default function UsuariosPage() {
// Estados
const [busqueda, setBusqueda] = useState('')
const debouncedBusqueda = useDebounce(busqueda, 500)
const [filtroDocumento, setFiltroDocumento] = useState('')
const [filtroSexo, setFiltroSexo] = useState('')
const [filtroParcialidad, setFiltroParcialidad] = useState('')
const [filtroFamilia, setFiltroFamilia] = useState('')

const [personas, setPersonas] = useState<Persona[]>([])
const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
const [familias, setFamilias] = useState<Familia[]>([])

const [page, setPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [loading, setLoading] = useState(false)

// Modales
const [showModal, setShowModal] = useState(false)
const [editModalOpen, setEditModalOpen] = useState(false)
const [personaAEditar, setPersonaAEditar] = useState<string | null>(null)
const [selectedUser, setSelectedUser] = useState<Persona | null>(null)
const [userToDelete, setUserToDelete] = useState<Persona | null>(null)
const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

const [totalPersonas, setTotalPersonas] = useState(0);
const [hombres, setHombres] = useState(0);
const [mujeres, setMujeres] = useState(0);

useEffect(() => {
  cargarEstadisticasPersonas();
}, []);


// === Hooks personalizados ===
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

// === Cargar datos ===
const fetchPersonas = async () => {
  setLoading(true)
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: '9',
      activo: 'true',
    })

    if (debouncedBusqueda) {
      if (/^\d+$/.test(debouncedBusqueda)) {
        params.append('id', debouncedBusqueda)
      } else if (debouncedBusqueda.includes(' ')) {
        const [n, a] = debouncedBusqueda.split(' ', 2)
        if (n) params.append('nombre', n)
        if (a) params.append('apellido', a)
      } else {
        params.append('nombre', debouncedBusqueda)
      }
    }
    if (filtroDocumento) params.append('tipoDocumento', filtroDocumento)
    if (filtroSexo) params.append('sexo', filtroSexo)
    if (filtroParcialidad) params.append('idParcialidad', filtroParcialidad)
    if (filtroFamilia) params.append('idFamilia', filtroFamilia)

    const data = await apiFetch<PersonasResponse>(`/personas/?${params.toString()}`)
    // Ahora, como ya filtramos en el backend, no es necesario filtrar en el frontend
    setPersonas(data.items) // <-- DIRECTAMENTE
    setTotalPages(data.total_pages || 1)
  } catch (err) {
    console.error('Error cargando personas', err)
  } finally {
    setLoading(false)
  }
}

const fetchCatalogos = async () => {
  try {
    const dataParcialidades = await apiFetch<ParcialidadResponse>('/parcialidad/?page=1&page_size=100')
    setParcialidades(dataParcialidades.items)
    const dataFamilias = await apiFetch<FamiliaResponse>('/familias/?page=1&page_size=100')
    setFamilias(dataFamilias.items)
  } catch (err) {
    console.error('Error cargando catálogos', err)
  }
}


useEffect(() => {
  fetchPersonas()
}, [page, debouncedBusqueda, filtroDocumento, filtroSexo, filtroParcialidad, filtroFamilia])

useEffect(() => {
  fetchCatalogos()
}, [])

// === Acciones ===
const handleVerUsuario = (persona: Persona) => setSelectedUser(persona)

const handleEditar = (id: string) => {
  setPersonaAEditar(id)
  setEditModalOpen(true)
}

const confirmarDefuncion = (persona: Persona) => setUserToDelete(persona)
const cerrarModal = () => {
  setSelectedUser(null)
  setUserToDelete(null)
  setUploadResult(null)
}

const defuncionUsuario = async () => {
  if (!userToDelete) return

  try {
    // Preparar el payload
    const fechaActual = new Date().toISOString().split('T')[0]
    const payload = {
      id: userToDelete.id,
      fechaDefuncion: fechaActual,
    }

    // Hacer la solicitud PATCH
    const res = await apiFetch<{ estado: string; message: string }>(
      '/personas/register-defuncion',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    )

    if (res.estado === 'Exitoso') {
      // Opcional: Actualizar la lista de usuarios localmente para reflejar el cambio
      // setUsuarios(prev => prev.map(u => u.id === userToDelete.id ? { ...u, activo: false } : u))
      setUploadResult({ success: true, message: 'Defunción registrada con éxito' })
    } else {
      setUploadResult({ success: false, message: res.message || 'Error al registrar defunción' })
    }
  } catch (err) {
    console.error('Error al registrar defunción', err)
    setUploadResult({ success: false, message: 'Error inesperado al registrar defunción' })
  } finally {
    setUserToDelete(null)
  }
}


const handleUploadExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await apiFetch<UploadResponse>('/personas/upload-excel', {
      method: 'POST',
      body: formData,
    })
    setUploadResult(res)
    fetchPersonas()
  } catch {
    setUploadResult({
      status: 'error',
      insertados: 0,
      total_procesados: 0,
      errores: [{ fila: 0, id: '-', mensaje: 'Error al subir el archivo' }],
    })
  }
}

// === Estadísticas ===
const cargarEstadisticasPersonas = async () => {
  try {
    const data = await apiFetch<any>('/reportes/reportes/resumen');

    setTotalPersonas(data.total_personas);
    setHombres(data.total_hombres);
    setMujeres(data.total_mujeres);

  } catch (error) {
    console.error("Error cargando estadísticas de personas", error);
  }
};

const handleDescargarPersonas = async () => {
  try {
    // 1. Obtener el token
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No hay token de sesión.')
    }

    // 2. Hacer la petición con fetch nativo
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend-quillacinga.ddns.net/cmi-apigateway'}/reportes/reportes/personas`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          // No especifiques 'Accept: application/json' si el backend devuelve el archivo directamente
          // Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }
    )

    // 3. Verificar si la respuesta es OK
    if (!response.ok) {
      throw new Error(`Error al descargar: ${response.status} - ${response.statusText}`)
    }

    // 4. Obtener el blob
    const blob = await response.blob()

    // 5. Crear URL y enlace para descargar
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    // Opcional: Obtener el nombre del archivo desde el header 'content-disposition'
    const disposition = response.headers.get('Content-Disposition')
    let filename = 'personas.xlsx' // nombre por defecto
    if (disposition && disposition.indexOf('attachment') !== -1) {
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

    // 6. Liberar la URL del objeto
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error al descargar reporte de personas', err)
  }
}

   return (
    <div>
      {/* Encabezado y controles superiores */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#333] flex items-center gap-2">
            <Users size={25} className="text-[#7d4f2b] stroke-[2.5]" />
            Personas
            <Tooltip text="En esta sección puedes gestionar todas las personas registradas en el sistema."/>
          </h1>

          <div className="flex flex-wrap gap-2">
            <label className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 
                            text-sm cursor-pointer transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]">
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Upload size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Carga masiva</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUploadExcel(e.target.files[0])}
              />
              <Tooltip text="Sube un archivo Excel para cargar varias personas a la vez." color='white'/>
            </label>

            <button
              onClick={() => window.open('/plantillas/plantilla_personas.xlsx', '_blank')}
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 
                        text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Descargar formato</span>
              <Tooltip text="Descarga la plantilla de Excel para registrar personas." color='white'/>
            </button>

            <button
              onClick={handleDescargarPersonas}
              className="relative overflow-hidden bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 
                        text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Download size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Descargar informe</span>
              <Tooltip text="Descarga el informe de las personas." color="white" />
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="relative overflow-hidden bg-[#7d4f2b] text-white px-4 py-2 rounded flex items-center gap-2 
                        text-sm transition-all duration-300 group hover:shadow-lg hover:-translate-y-[2px]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#5e3c1f] to-[#7d4f2b] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <UserPlus size={16} className="stroke-[3] relative z-10" />
              <span className="relative z-10">Nueva persona</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          <div className="flex-1">
            <AnimatedFilterField
              icon={Search}
              label="Buscar por nombre"
              value={busqueda}
              onChange={setBusqueda}
              placeholder="Ej: Pedro, Pérez o 123456789"
              texttooltip="Busca personas por coincidencia en nombre, apellido o número de documento."
            />
          </div>

          <AnimatedFilterField
            as="select"
            icon={FileText}
            label="Tipo de documento"
            value={filtroDocumento}
            onChange={setFiltroDocumento}
            options={[
              { value: '', label: 'Todos los documentos' },
              ...Object.entries(enumDocumento).map(([code, label]) => ({
                value: code,
                label,
              })),
            ]}
            texttooltip="Filtra las personas según el tipo de documento."
          />

          <AnimatedFilterField
            as="select"
            icon={User}
            label="Sexo"
            value={filtroSexo}
            onChange={setFiltroSexo}
            options={[
              { value: '', label: 'Todos los sexos' },
              ...Object.entries(enumSexo).map(([code, label]) => ({
                value: code,
                label,
              })),
            ]}
            texttooltip="Filtra las personas por sexo."
          />

          <AnimatedFilterField
            key={`parcialidad-${parcialidades.length}`}
            as="select"
            icon={Building}
            label="Parcialidad"
            value={filtroParcialidad}
            onChange={setFiltroParcialidad}
            options={[
              { value: '', label: 'Todas las parcialidades' },
              ...parcialidades.map((p) => ({ value: p.id.toString(), label: p.nombre })),
            ]}
            texttooltip="Filtra las personas por parcialidad."
          />

          <AnimatedFilterField
            key={`familia-${familias.length}`}
            as="select"
            icon={UsersRound}
            label="Familia"
            value={filtroFamilia}
            onChange={setFiltroFamilia}
            options={[
              { value: '', label: 'Todas las familias' },
              ...familias.map((f) => ({
                value: f.id.toString(),
                label: `Familia ${f.id} (${f.integrantes} integrantes)`,
              })),
            ]}
            texttooltip="Filtra las personas por familia."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          
        </div>

      </div>

      {/* Tarjetas de estadísticas (opcional) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        <StatCard
          label="Total de personas"
          value={totalPersonas}
          icon={<Users className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#f3e5f5]"
          color="text-[#9C27B0]"
        />
        <StatCard
          label="Hombres"
          value={hombres}
          icon={<User className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#e3f2fd]"
          color="text-[#2196F3]"
        />
        <StatCard
          label="Mujeres"
          value={mujeres}
          icon={<User className="w-4 h-4 sm:w-6 sm:h-6" />}
          bg="bg-[#e8f5e9]"
          color="text-[#4CAF50]"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Tipo Doc.</th>
                <th className="px-5 py-3 text-left text-sm font-medium">Documento</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Nacimiento</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Sexo</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Parcialidad</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Familia</th>
                <th className="px-5 py-3 text-center text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : personas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No se encontraron personas
                  </td>
                </tr>
              ) : (
                personas.map((persona, index) => (
                  <tr key={persona.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-5 py-3 text-gray-800">{persona.nombre} {persona.apellido}</td>
                    <td className="px-5 py-3 text-gray-800">
                      {enumDocumento[persona.tipoDocumento as keyof typeof enumDocumento] || persona.tipoDocumento}
                    </td>
                    <td className="px-5 py-3 text-gray-800">{persona.id}</td>
                    <td className="px-5 py-3 text-center text-gray-800">{persona.fechaNacimiento}</td>
                    <td className="px-5 py-3 text-center text-gray-800">
                      {enumSexo[persona.sexo as keyof typeof enumSexo] || persona.sexo}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-800">
                      {persona.parcialidad?.nombre || '-'}
                    </td>
                    <td className="px-5 py-3 text-center text-gray-800">{persona.idFamilia ?? '-'}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleVerUsuario(persona)}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditar(persona.id)}
                          className="text-[#7d4f2b] hover:text-blue-600 transition-colors"
                          title="Editar persona"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => confirmarDefuncion(persona)}
                          className="text-[#7d4f2b] hover:text-red-600 transition-colors"
                          title="Marcar defunción"
                        >
                          <HeartMinus size={18} />
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

      {/* === Modales === */}

      {/* Modal: Ver */}
      {selectedUser && (
        <VerPersonaModal
          persona={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Modal: Eliminar */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Eliminar persona</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de eliminar a <strong>{userToDelete.nombre} {userToDelete.apellido}</strong>?<br />
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={cerrarModal} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={defuncionUsuario} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Resultado carga masiva o error */}
      {uploadResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-lg w-full relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-500">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-[#2c3e50] mb-4">Resultado</h2>
            <p className="text-gray-700">{uploadResult.message || 'Operación completada.'}</p>
            <div className="mt-6 text-right">
              <button onClick={cerrarModal} className="bg-[#7d4f2b] text-white px-5 py-2 rounded-lg hover:bg-[#5e3c1f]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <FormularioPersonaPage
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchPersonas()
            }}
          />
        </div>
      )}

      {/* Modal: Editar */}
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
    </div>
  )
}
