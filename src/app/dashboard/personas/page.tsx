'use client'

import { useState, useEffect } from 'react'
import { Eye, Trash, Search, Pencil, X, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { enumSexo, enumDocumento } from '@/constants/enums'

/* Hook para debounce */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

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
  const router = useRouter()

  // filtros
  const [busqueda, setBusqueda] = useState('')
  const debouncedBusqueda = useDebounce(busqueda, 500)
  const [filtroParcialidad, setFiltroParcialidad] = useState('')
  const [filtroFamilia, setFiltroFamilia] = useState('')
  const [filtroSexo, setFiltroSexo] = useState('')
  const [filtroDocumento, setFiltroDocumento] = useState('')

  // paginación
  const [page, setPage] = useState(1)
  const pageSize = 10

  // datos
  const [usuarios, setUsuarios] = useState<Persona[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [parcialidades, setParcialidades] = useState<Parcialidad[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])

  // modales
  const [selectedUser, setSelectedUser] = useState<Persona | null>(null)
  const [userToDelete, setUserToDelete] = useState<Persona | null>(null)

  // carga masiva
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  // cargar usuarios
  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      })

      if (debouncedBusqueda) {
        if (/^\d+$/.test(debouncedBusqueda)) {
          params.append('id', debouncedBusqueda)
        } else if (debouncedBusqueda.includes(' ')) {
          const [n, a] = debouncedBusqueda.split(' ')
          if (n) params.append('nombre', n)
          if (a) params.append('apellido', a)
        } else {
          params.append('nombre', debouncedBusqueda)
        }
      }
      if (filtroParcialidad) params.append('idParcialidad', filtroParcialidad)
      if (filtroFamilia) params.append('idFamilia', filtroFamilia)
      if (filtroSexo) params.append('sexo', filtroSexo)
      if (filtroDocumento) params.append('tipoDocumento', filtroDocumento)

      const data = await apiFetch<PersonasResponse>(`/personas/?${params.toString()}`)
      const activos = data.items.filter((u) => u.activo)
      setUsuarios(activos)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParcialidades = async () => {
    try {
      const data = await apiFetch<ParcialidadResponse>('/parcialidad/?page=1&page_size=100')
      setParcialidades(data.items)
    } catch (error) {
      console.error('Error cargando parcialidades:', error)
    }
  }

  const fetchFamilias = async () => {
    try {
      const data = await apiFetch<FamiliaResponse>('/familias/?page=1&page_size=100')
      setFamilias(data.items)
    } catch (error) {
      console.error('Error cargando familias:', error)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [page, debouncedBusqueda, filtroParcialidad, filtroFamilia, filtroSexo, filtroDocumento])

  useEffect(() => {
    fetchParcialidades()
    fetchFamilias()
  }, [])

  const handleEditar = (id: string) => {
    router.push(`/dashboard/personas/formulario?id=${id}`)
  }

  const handleVerUsuario = (usuario: Persona) => setSelectedUser(usuario)
  const cerrarModal = () => setSelectedUser(null)

  const confirmarEliminacion = (usuario: Persona) => setUserToDelete(usuario)
  const cancelarEliminacion = () => setUserToDelete(null)

  const eliminarUsuario = async () => {
    if (userToDelete) {
      try {
        const res = await apiFetch<{ estado: string; message: string; data: string }>(
          `/personas/${userToDelete.id}`,
          { method: 'DELETE' }
        )

        if (res.estado === 'Exitoso') {
          setUsuarios((prev) => prev.filter((u) => u.id !== userToDelete.id))
        } else {
          alert(res.message || 'Error eliminando usuario')
        }
      } catch {
        alert('Error eliminando usuario')
      } finally {
        setUserToDelete(null)
      }
    }
  }

  // subir excel
  const handleUploadExcel = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiFetch<UploadResponse>('/personas/upload-excel', {
        method: 'POST',
        body: formData,
      })
      setUploadResult(res)
      fetchUsuarios()
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
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-[#333]">Usuarios</h1>

      {/* Buscador y filtros */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-[#7d4f2b]" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o documento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#7d4f2b] rounded text-sm text-gray-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select
            value={filtroDocumento}
            onChange={(e) => setFiltroDocumento(e.target.value)}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todos los documentos</option>
            {Object.entries(enumDocumento).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filtroSexo}
            onChange={(e) => setFiltroSexo(e.target.value)}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todos los sexos</option>
            {Object.entries(enumSexo).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={filtroParcialidad}
            onChange={(e) => setFiltroParcialidad(e.target.value)}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las parcialidades</option>
            {parcialidades.map((p) => (
              <option key={p.id} value={p.id.toString()}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroFamilia}
            onChange={(e) => setFiltroFamilia(e.target.value)}
            className="border border-[#7d4f2b] rounded px-3 py-2 text-sm text-gray-700"
          >
            <option value="">Todas las familias</option>
            {familias.map((f) => (
              <option key={f.id} value={f.id.toString()}>
                Familia {f.id} ({f.integrantes} integrantes)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="min-w-full">
            <thead className="bg-[#7d4f2b] text-white sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-2">Nombre</th>
                <th className="text-left px-4 py-2">Tipo Doc.</th>
                <th className="text-left px-4 py-2">Documento</th>
                <th className="text-center px-4 py-2">Nacimiento</th>
                <th className="text-center px-4 py-2">Sexo</th>
                <th className="text-center px-4 py-2">Parcialidad</th>
                <th className="text-center px-4 py-2">Familia</th>
                <th className="text-left px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    Cargando...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario, index) => (
                  <tr
                    key={usuario.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-2">
                      {usuario.nombre} {usuario.apellido}
                    </td>
                    <td className="px-4 py-2">
                      {enumDocumento[usuario.tipoDocumento as keyof typeof enumDocumento] || usuario.tipoDocumento}
                    </td>
                    <td className="px-4 py-2">{usuario.id}</td>
                    <td className="px-4 py-2 text-center">{usuario.fechaNacimiento}</td>
                    <td className="px-4 py-2 text-center">
                      {enumSexo[usuario.sexo as keyof typeof enumSexo] || usuario.sexo}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {usuario.parcialidad ? usuario.parcialidad.nombre : '-'}
                    </td>
                    <td className="px-4 py-2 text-center">{usuario.idFamilia ?? '-'}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <button onClick={() => handleVerUsuario(usuario)} className="text-[#7d4f2b] hover:text-[#5e3c1f]">
                        <Eye size={18} />
                      </button>
                      <button onClick={() => handleEditar(usuario.id)} className="text-[#7d4f2b] hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => confirmarEliminacion(usuario)} className="text-[#7d4f2b] hover:text-red-600">
                        <Trash size={18} />
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
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <label className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center gap-2 cursor-pointer">
          <Upload size={18} /> Carga masiva (Excel)
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
          onClick={() => router.push('/dashboard/personas/formulario')}
          className="bg-[#7d4f2b] hover:bg-[#5e3c1f] text-white px-6 py-2 rounded"
        >
          Nuevo usuario
        </button>
      </div>

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

      {/* Modal ver usuario */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full relative">
            <button onClick={cerrarModal} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold mb-4 text-[#7d4f2b]">Información del Usuario</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Nombre:</strong> {selectedUser.nombre} {selectedUser.apellido}</p>
              <p><strong>Tipo de documento:</strong> {enumDocumento[selectedUser.tipoDocumento as keyof typeof enumDocumento] || selectedUser.tipoDocumento}</p>
              <p><strong>Número:</strong> {selectedUser.id}</p>
              <p><strong>Nacimiento:</strong> {selectedUser.fechaNacimiento}</p>
              <p><strong>Sexo:</strong> {enumSexo[selectedUser.sexo as keyof typeof enumSexo] || selectedUser.sexo}</p>
              <p><strong>Parcialidad:</strong> {selectedUser.parcialidad ? selectedUser.parcialidad.nombre : '-'}</p>
              <p><strong>Familia:</strong> {selectedUser.idFamilia ?? '-'}</p>
            </div>
            <div className="mt-6 text-center">
              <button onClick={cerrarModal} className="bg-[#7d4f2b] text-white px-5 py-2 rounded hover:bg-[#5e3c1f]">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center relative">
            <p className="text-lg mb-6">
              ¿Está seguro de querer eliminar al usuario <br />
              <strong>{userToDelete.nombre} {userToDelete.apellido}</strong>?
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={eliminarUsuario} className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700">
                Sí, eliminar
              </button>
              <button onClick={cancelarEliminacion} className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
